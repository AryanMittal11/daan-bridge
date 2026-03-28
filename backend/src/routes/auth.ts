import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { notifyAdmins } from '../utils/notificationHelper';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  const { email, password, name, role, location, docUrl } = req.body;
  if (!email || !password || !name || !role)
    return res.status(400).json({ message: 'Missing required fields.' });

  if (role !== 'ADMIN' && (!docUrl || docUrl.trim() === '')) {
    return res.status(400).json({ message: 'Verification document required for non-admin registrations.' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already registered.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      location,
      verified: role === 'ADMIN',
      avatar: 'https://i.pravatar.cc/150',
    },
  });

  if (role !== 'ADMIN') {
    await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        docUrl,
        status: 'PENDING',
      },
    });

    // Notify admins about new registration
    notifyAdmins(
      '👤 New User Registration',
      `${name} (${role}) has registered and needs verification review.`,
      'ADMIN',
      '/admin',
      true
    );
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, verified: user.verified },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { ...user, passwordHash: undefined } });
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = jwt.sign(
    { sub: user.id, role: user.role, verified: user.verified },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { ...user, passwordHash: undefined } });
});

// Verify Token / Get Current User
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
