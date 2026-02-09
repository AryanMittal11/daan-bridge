import express from 'express';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requireRole, requireVerified } from '../middleware/rbac';

const router = express.Router();

router.get('/all', authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const items = await prisma.bloodBank.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items });
  } catch (error) {
    console.error('Error fetching :', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/donors', authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const items = await prisma.bloodDonation.findMany({
      include: {
        donor: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json({ items });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/req/add', authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const { bloodType, units, hospitalName, patientName, contactNo } = req.body;

    // organization ID from logged-in user
    const organizationId = req.user?.sub;

    if (!organizationId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const item = await prisma.bloodRequest.create({
      data: {
        organizationId,
        bloodType,
        units: Number(units),
        hospitalName,
        patientName,
        contactNo
      }
    });

    res.json({ item });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/req', authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const items = await prisma.bloodRequest.findMany({ orderBy: { createdAt: 'desc' } });
    console.log("blood req********"+items);
    res.json({ items });
  } catch (error) {
    console.error('Error fetching :', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
