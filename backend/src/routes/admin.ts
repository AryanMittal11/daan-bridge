import express from 'express';
import prisma from '../prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createNotification } from '../utils/notificationHelper';

const router = express.Router();

// List all pending verification requests
router.get('/verification-requests', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const requests = await prisma.verificationRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: true }
  });
  res.json({ requests });
});

// Approve or reject a request
router.post('/verify-user', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  const { userId, action } = req.body;
  if (!userId || !['APPROVED', 'REJECTED'].includes(action))
    return res.status(400).json({ message: 'Invalid input.' });

  await prisma.verificationRequest.update({
    where: { userId },
    data: { status: action, reviewedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { verified: action === 'APPROVED' },
  });

  // Notify user about verification result
  const isApproved = action === 'APPROVED';
  createNotification(
    userId,
    isApproved ? '✅ Account Approved' : '❌ Account Rejected',
    isApproved
      ? 'Your account has been verified! You now have full access to Daan Bridge.'
      : 'Your verification request has been rejected. Please contact support for more information.',
    isApproved ? 'SUCCESS' : 'WARNING',
    '/dashboard',
    true // send email
  );

  res.json({ success: true });
});

export default router;
