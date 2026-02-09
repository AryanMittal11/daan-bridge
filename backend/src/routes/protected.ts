import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requireVerified, requireRole } from '../middleware/rbac';

const router = express.Router();

// Placeholder - list campaigns
router.get('/campaigns', authenticateJWT, requireVerified, (req, res) => {
  res.json([]); // Fill with DB fetch logic
});

// Create campaign - only ORG
router.post('/campaigns', authenticateJWT, requireVerified, requireRole(['ORGANIZATION']), (req, res) => {
  res.json({ success: true });
});

export default router;
