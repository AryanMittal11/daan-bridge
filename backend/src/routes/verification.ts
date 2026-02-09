import express from 'express';
import prisma from '../prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

// User requests (or re-submits) verification
router.post('/request', authenticateJWT, requireRole(['INDIVIDUAL', 'ORGANIZATION']), async (req: any, res) => {
  const userId = req.user.sub;
  const { docUrl } = req.body;
  if (!docUrl) return res.status(400).json({ message: 'Document required.' });

  // Upsert for user
  const reqResult = await prisma.verificationRequest.upsert({
    where: { userId },
    update: { docUrl, status: 'PENDING', reviewedAt: null },
    create: { userId, docUrl },
  });
  res.json({ status: 'pending', request: reqResult });
});

export default router;
