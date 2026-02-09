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
  console.log("Jwt user" + jwtUser);
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
  const { amount, type, items } = req.body; // type: MONEY | MATERIAL, amount: number
  const user = (req as any).user;
  const donorId = user.sub;

  const amountNum = Number(amount);
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ message: 'Invalid amount.' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: donorId } });
  if (!dbUser) return res.status(401).json({ message: 'User not found.' });

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });

  const donationType = (type === 'MATERIAL' ? 'MATERIAL' : 'MONEY') as 'MONEY' | 'MATERIAL';

  const [donation] = await prisma.$transaction([
    prisma.donation.create({
      data: {
        campaignId,
        donorId,
        donorName: dbUser.name,
        amount: amountNum,
        type: donationType,
        items: items || null,
      },
    }),
    prisma.campaign.update({
      where: { id: campaignId },
      data: { raised: campaign.raised + amountNum },
    }),
  ]);

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
