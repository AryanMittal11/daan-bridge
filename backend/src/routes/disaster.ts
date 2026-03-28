import { Router } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import prisma from '../prisma/client';
import { createBroadcastNotification, createNotification } from '../utils/notificationHelper';

const router = Router();

// 1. Post/Toggle SOS Alert (Individual / Organization)
router.post('/sos', authenticateJWT, requireRole(['INDIVIDUAL']), async (req: AuthRequest, res) => {
    try {
        const { lat, lng } = req.body;
        const userId = req.user.sub;

        // Check if there is an active SOS alert for this user
        const existingAlert = await prisma.sOSAlert.findFirst({
            where: { userId, active: true },
        });

        if (existingAlert) {
            // Toggle off SOS
            await prisma.sOSAlert.update({
                where: { id: existingAlert.id },
                data: { active: false },
            });
            return res.json({ message: 'SOS deactivated', active: false });
        }

        // Otherwise create new active SOS alert
        if (lat === undefined || lng === undefined) {
        }

        const latitude = lat ?? 0.0;
        const longitude = lng ?? 0.0;

        // Get user name for notification
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        const newAlert = await prisma.sOSAlert.create({
            data: {
                userId,
                lat: latitude,
                lng: longitude,
                active: true,
            },
        });

        // Broadcast SOS notification to all verified users
        createBroadcastNotification(
            '🚨 SOS Alert — Urgent Help Needed!',
            `${user?.name || 'Someone'} has activated an SOS alert and needs immediate assistance! Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            'URGENT',
            '/disaster',
            userId,
            true // send email
        );

        res.json({ message: 'SOS activated', alert: newAlert, active: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle SOS alert.' });
    }
});

// 2. Post Incident Report (Individual only)
router.post('/report', authenticateJWT, requireRole(['INDIVIDUAL']), async (req: AuthRequest, res) => {
    try {
        const { type, description, lat, lng } = req.body;
        console.log("logged values", type, description, lat, lng);
        const reporterId = req.user.sub;

        if (!type || !description) {
            return res.status(400).json({ error: 'Type and description are required.' });
        }

        const report = await prisma.disasterReport.create({
            data: {
                reporterId,
                type,
                description,
                lat: lat || null,
                lng: lng || null,
            },
        });

        res.status(201).json({ message: 'Report created successfully', report });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create report.' });
    }
});

// 3. Get Live Disaster Data (Public or Auth)
router.get('/live', async (req, res) => {
    try {
        const activeAlerts = await prisma.sOSAlert.findMany({
            where: { active: true },
            include: {
                user: {
                    select: { name: true, role: true },
                },
            },
        });

        const recentReports = await prisma.disasterReport.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                reporter: {
                    select: { name: true, role: true },
                },
                resolvedBy: {
                    select: { name: true, role: true },
                }
            },
        });

        res.json({
            alerts: activeAlerts,
            reports: recentReports,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch live data.' });
    }
});

// 4. Update Report Status (Organization or Individual can verify/resolve)
router.put('/report/:id/status', authenticateJWT,  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // ✅ Validate input
      const allowedStatuses = ['PENDING', 'VERIFIED', 'RESOLVED'] as const;
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // ✅ Update report
      const updatedReport = await prisma.disasterReport.update({
        where: { id: id as string },
        data: {
          status,
          resolvedById: status === 'RESOLVED' ? req.user.sub : null,
        },
      });

      if (status === 'RESOLVED') {
        await prisma.sOSAlert.updateMany({
          where: {
            userId: updatedReport.reporterId,
            active: true,
          },
          data: {
            active: false,
          },
        });

        // Notify the reporter that their report has been resolved
        createNotification(
          updatedReport.reporterId,
          '✅ Disaster Report Resolved',
          'Your disaster report has been resolved. Thank you for helping keep the community safe!',
          'SUCCESS',
          '/disaster'
        );
      }

      return res.status(200).json({
        message: 'Status updated successfully',
        report: updatedReport,
      });

    } catch (error: any) {
      console.error('Update report status error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Report not found' });
      }
      return res.status(500).json({
        error: 'Failed to update report status',
      });
    }
  }
);

export default router;
