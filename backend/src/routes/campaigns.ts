import express from 'express';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requireRole, requireVerified } from '../middleware/rbac';

const router = express.Router();

// Fetch all campaigns (any authenticated user can view)
router.get('/all', authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
    console.log(campaigns);
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new campaign (ORG only)
router.post('/add', authenticateJWT, requireVerified, async (req, res) => {
  const { title, description, type, target, unit, category, image, location, deadline } = req.body;
  const jwtUser = (req as any).user;
  if (jwtUser.role !== 'ORGANIZATION' && jwtUser.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only organizations/admins can create campaigns.' });
  }

  if (!title || !type || !target) {
    return res.status(400).json({ message: 'Missing required fields: title, type, target' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: jwtUser.sub } });
  if (!dbUser) return res.status(401).json({ message: 'User not found.' });

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description,
      type,
      target: Number(target) || 0,
      unit: unit || 'USD',
      category,
      image,
      details: req.body.details || null,
      location,
      deadline,
      organizer: dbUser.name,
      createdBy: jwtUser.sub,
      status: 'PENDING',
    }
  });
  res.json({ campaign });
});

// Donate to a campaign (INDIVIDUAL or ORGANIZATION)
router.post('/:id/donate', authenticateJWT, requireVerified, async (req, res) => {
  const campaignId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const { amount, type, items, details } = req.body; // type: MONEY | MATERIAL | VOLUNTEER | BLOOD
  const user = (req as any).user;
  const donorId = user.sub;

  const amountNum = Number(amount);
  // For volunteer, we count 1 volunteer as 1 unit of help, or 0 if strictly tracking hours (but logic says count people)
  if (amountNum < 0) {
    return res.status(400).json({ message: 'Invalid amount.' });
  }
  // Allow amount=0 if it's strictly volunteer sign-up without hours specified, but usually we want > 0
  if (amountNum === 0 && type !== 'VOLUNTEER') {
    return res.status(400).json({ message: 'Amount must be greater than 0.' });
  }


  const dbUser = await prisma.user.findUnique({ where: { id: donorId } });
  if (!dbUser) return res.status(401).json({ message: 'User not found.' });

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });

  const validTypes = ['MONEY', 'MATERIAL', 'VOLUNTEER', 'BLOOD'];
  const donationType = validTypes.includes(type) ? type : 'MONEY';

  const donationItemsStr = details && Object.keys(details).length > 0 ? JSON.stringify(details) : (items || null);

  const transactionItems: any[] = [
    prisma.donation.create({
      data: {
        campaignId,
        donorId,
        donorName: dbUser.name,
        amount: amountNum,
        type: donationType,
        items: donationItemsStr,
      },
    }),
    prisma.campaign.update({
      where: { id: campaignId },
      data: { raised: campaign.raised + amountNum },
    }),
  ];

  if (donationType === 'MONEY') {
    transactionItems.push(
      prisma.inventoryItem.upsert({
        where: {
          organizationId_category_name: {
            organizationId: campaign.createdBy,
            category: 'MONEY',
            name: 'Campaign Funds',
          }
        },
        update: {
          quantity: { increment: amountNum }
        },
        create: {
          organizationId: campaign.createdBy,
          category: 'MONEY',
          name: 'Campaign Funds',
          quantity: amountNum,
          unit: campaign.unit || 'USD',
        }
      })
    );
  } else if (donationType === 'MATERIAL' && details) {
    const invCategory = details.category || "OTHER";
    const invName = details.name || "Donated Material";
    transactionItems.push(
      prisma.inventoryItem.upsert({
        where: {
          organizationId_category_name: {
            organizationId: campaign.createdBy,
            category: invCategory,
            name: invName,
          }
        },
        update: {
          quantity: { increment: amountNum },
          details: details.structured || null
        },
        create: {
          organizationId: campaign.createdBy,
          category: invCategory,
          name: invName,
          quantity: amountNum,
          unit: "Items",
          details: details.structured || null
        }
      })
    );
  }

  const result = await prisma.$transaction(transactionItems);
  const donation = result[0];

  res.json({ donation, campaign: { ...campaign, raised: campaign.raised + amountNum } });
});

// Get donations for a campaign (for analytics / org view)
router.get('/:id/donations', authenticateJWT, requireVerified, async (req, res) => {
  const campaignId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
  const donations = await prisma.donation.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ donations });
});

export default router;
