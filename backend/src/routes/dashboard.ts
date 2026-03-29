import express, { Response } from 'express';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ─── Individual Dashboard Stats ─────────────────────────────────────────────
router.get('/individual', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    // Lives Impacted = disaster reports helped resolve + blood pledges count
    const [disasterHelpCount, bloodPledgeCount] = await Promise.all([
      prisma.disasterReport.count({
        where: { resolvedById: userId },
      }),
      prisma.pledge.count({
        where: { donorId: userId },
      }),
    ]);
    const livesImpacted = disasterHelpCount + bloodPledgeCount;

    // Total Contributed = sum of all donation amounts by this user
    const donationAgg = await prisma.donation.aggregate({
      where: { donorId: userId },
      _sum: { amount: true },
    });
    const totalContributed = donationAgg._sum.amount || 0;

    // Volunteer in _ events = tutor sessions enrolled + volunteer campaign donations
    const [sessionEnrollments, volunteerDonations] = await Promise.all([
      prisma.sessionEnrollment.count({
        where: { studentId: userId },
      }),
      prisma.donation.count({
        where: { donorId: userId, type: 'VOLUNTEER' },
      }),
    ]);
    const volunteerInEvents = sessionEnrollments + volunteerDonations;

    // Events Attended = sessions enrolled
    const eventsAttended = sessionEnrollments;

    res.json({
      livesImpacted,
      totalContributed,
      volunteerInEvents,
      eventsAttended,
    });
  } catch (error) {
    console.error('Error fetching individual dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Organization Dashboard Stats ───────────────────────────────────────────
router.get('/organization', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    // Active Campaigns = campaigns created by this org that are not fulfilled
    const activeCampaigns = await prisma.campaign.count({
      where: {
        createdBy: userId,
        status: { notIn: ['FULFILLED', 'REJECTED'] },
      },
    });

    // Funds Raised = sum of MONEY donations to campaigns created by this org
    const fundsAgg = await prisma.donation.aggregate({
      where: {
        type: 'MONEY',
        campaign: { createdBy: userId },
      },
      _sum: { amount: true },
    });
    const fundsRaised = fundsAgg._sum.amount || 0;

    // Material Units = sum of InventoryItem quantity where category is not MONEY/BLOOD
    const materialAgg = await prisma.inventoryItem.aggregate({
      where: {
        organizationId: userId,
        category: { notIn: ['MONEY', 'BLOOD'] },
      },
      _sum: { quantity: true },
    });
    const materialUnits = Math.round(materialAgg._sum.quantity || 0);

    // Volunteers Recruited = count of VOLUNTEER donations received via org campaigns
    const volunteersRecruited = await prisma.donation.count({
      where: {
        type: 'VOLUNTEER',
        campaign: { createdBy: userId },
      },
    });

    res.json({
      activeCampaigns,
      fundsRaised,
      materialUnits,
      volunteersRecruited,
    });
  } catch (error) {
    console.error('Error fetching organization dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Admin Dashboard Stats ──────────────────────────────────────────────────
router.get('/admin', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    // Pending Verifications
    const pendingVerifications = await prisma.verificationRequest.count({
      where: { status: 'PENDING' },
    });

    // Platform Volume = total money donated across all campaigns
    const volumeAgg = await prisma.donation.aggregate({
      where: { type: 'MONEY' },
      _sum: { amount: true },
    });
    const platformVolume = volumeAgg._sum.amount || 0;

    // Total Users
    const totalUsers = await prisma.user.count();

    // Active Orgs
    const activeOrgs = await prisma.user.count({
      where: { role: 'ORGANIZATION', verified: true },
    });

    res.json({
      pendingVerifications,
      platformVolume,
      totalUsers,
      activeOrgs,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Organizations List (for "Connect with NGOs") ───────────────────────────
router.get('/organizations-list', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await prisma.user.findMany({
      where: { role: 'ORGANIZATION', verified: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        location: true,
        verified: true,
        campaigns: {
          where: { status: { notIn: ['FULFILLED', 'REJECTED'] } },
          select: { id: true },
        },
        inventoryItems: {
          select: {
            id: true,
            category: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    const result = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      avatar: org.avatar || `https://i.pravatar.cc/150?u=${org.id}`,
      location: org.location || 'Unknown',
      verified: org.verified,
      campaignCount: org.campaigns.length,
      inventoryItems: org.inventoryItems,
    }));

    res.json({ organizations: result });
  } catch (error) {
    console.error('Error fetching organizations list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Suggested Campaigns (Individual — active campaigns not by them) ────────
router.get('/suggested-campaigns', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    const campaigns = await prisma.campaign.findMany({
      where: {
        createdBy: { not: userId },
        status: { notIn: ['FULFILLED', 'REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching suggested campaigns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Org's Own Active Campaigns ─────────────────────────────────────────────
router.get('/org-campaigns', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    const campaigns = await prisma.campaign.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching org campaigns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Chart Data — monthly donation aggregation ─────────────────────────────
router.get('/chart-data', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;

    // Determine date range: last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    let whereClause: any = {
      createdAt: { gte: sixMonthsAgo },
    };

    if (role === 'INDIVIDUAL') {
      whereClause.donorId = userId;
    } else if (role === 'ORGANIZATION') {
      whereClause.campaign = { createdBy: userId };
    }
    // ADMIN: no extra filter — platform-wide

    const donations = await prisma.donation.findMany({
      where: whereClause,
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = 0;
    }

    donations.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (key in monthlyMap) {
        monthlyMap[key] += d.amount;
      }
    });

    const chartData = Object.entries(monthlyMap).map(([name, amount]) => ({
      name: name.split(' ')[0], // Just month abbreviation
      amount,
    }));

    res.json({ chartData });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
