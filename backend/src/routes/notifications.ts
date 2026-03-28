import express from 'express';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's notifications (latest 50)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.sub;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.sub;
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id: id as string, userId },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.sub;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a notification
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;

    await prisma.notification.deleteMany({
      where: { id: id as string, userId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
