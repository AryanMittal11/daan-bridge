import express, { Response } from 'express';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { createNotification } from '../utils/notificationHelper';

const router = express.Router();

// ─── Contribute to Platform Funding (Individual / Organization) ─────────────
router.post('/contribute', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const { amount, message } = req.body;

    if (role === 'ADMIN') {
      return res.status(403).json({ message: 'Admins cannot fund the platform.' });
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) return res.status(401).json({ message: 'User not found.' });

    const funding = await prisma.platformFunding.create({
      data: {
        userId: userId as string,
        amount: amountNum,
        message: message || null,
      },
    });

    // Notify all admins about the contribution
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      createNotification(
        admin.id,
        '💰 Platform Funding Received',
        `${dbUser.name} contributed ₹${amountNum} to support the platform.${message ? ` Message: "${message}"` : ''}`,
        'SUCCESS',
        '/admin'
      );
    }

    // Notify the donor
    createNotification(
      userId as string,
      '💚 Thank You for Supporting Daan Bridge!',
      `Your contribution of ₹${amountNum} helps keep the platform running. Thank you!`,
      'SUCCESS',
      '/dashboard'
    );

    res.json({ funding, message: 'Thank you for your contribution!' });
  } catch (error) {
    console.error('Error processing platform funding:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Get Funding Logs (Admin only) ──────────────────────────────────────────
router.get('/logs', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin only.' });
    }

    const logs = await prisma.platformFunding.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Also get totals
    const totalAgg = await prisma.platformFunding.aggregate({
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      logs,
      totalAmount: totalAgg._sum.amount || 0,
      totalContributions: totalAgg._count || 0,
    });
  } catch (error) {
    console.error('Error fetching funding logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
