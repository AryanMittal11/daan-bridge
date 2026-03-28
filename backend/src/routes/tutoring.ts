import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { createNotification } from '../utils/notificationHelper';

const router = express.Router();

// Register as a Tutor
router.post('/register', authenticateJWT, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.sub;
        const { bio, subjects, mode, address } = req.body;

        // Check if already registered
        const existingProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
        if (existingProfile) {
            return res.status(400).json({ error: 'User is already registered as a tutor' });
        }

        const tutorProfile = await prisma.tutorProfile.create({
            data: {
                userId,
                bio,
                subjects,
                mode,
                address
            }
        });

        res.status(201).json(tutorProfile);
    } catch (error) {
        console.error('Error registering tutor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current tutor profile and their created sessions
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.sub;
        const profile = await prisma.tutorProfile.findUnique({
            where: { userId },
            include: { 
                sessions: { 
                    include: { 
                        _count: { select: { enrollments: true } },
                        enrollments: { include: { student: { select: { id: true, name: true, email: true, avatar: true } } } },
                        logs: { orderBy: { createdAt: 'desc' } }
                    },
                    orderBy: { createdAt: 'desc' }
                } 
            }
        });

        // Check if enrolled sessions exist for the user (as student)
        const enrolledSessions = await prisma.sessionEnrollment.findMany({
            where: { studentId: userId },
            include: { session: { include: { tutor: { include: { user: true } }, _count: { select: { enrollments: true } } } } }
        });

        res.json({ profile, enrolledSessions });
    } catch (error) {
        console.error('Error fetching tutor profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new Tutoring Session
router.post('/sessions', authenticateJWT, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.sub;
        const { subject, date, time, mode, address, meetingLink, maxStudents } = req.body;

        const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
        if (!profile) {
            return res.status(403).json({ error: 'Only registered tutors can create sessions' });
        }

        const session = await prisma.tutoringSession.create({
            data: {
                tutorId: profile.id,
                subject,
                date,
                time,
                mode,
                address,
                meetingLink,
                maxStudents: maxStudents || 5
            }
        });

        await prisma.tutoringLog.create({
            data: {
                sessionId: session.id,
                userId,
                action: 'SESSION_CREATED',
                details: `Session "${subject}" was created.`
            }
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all Tutoring Sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await prisma.tutoringSession.findMany({
            include: {
                tutor: {
                    include: {
                        user: { select: { name: true, avatar: true } }
                    }
                },
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join a Session
router.post('/sessions/:id/join', authenticateJWT, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.sub;
        const sessionId = req.params.id as string;

        const session = await prisma.tutoringSession.findUnique({
            where: { id: sessionId },
            include: { 
                _count: { select: { enrollments: true } },
                tutor: { select: { userId: true } }
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const enrollmentsCount = (session as any)._count?.enrollments || 0;

        if (session.status === 'FULL' || enrollmentsCount >= session.maxStudents) {
            return res.status(400).json({ error: 'Session is full' });
        }

        const enrollment = await prisma.sessionEnrollment.create({
            data: {
                sessionId,
                studentId: userId
            }
        });

        await prisma.tutoringLog.create({
            data: {
                sessionId,
                userId,
                action: 'STUDENT_ENROLLED',
                details: `A student enrolled in the session.`
            }
        });

        // Automatically mark as full if we hit max students
        if (enrollmentsCount + 1 >= session.maxStudents) {
            await prisma.tutoringSession.update({
                where: { id: sessionId },
                data: { status: 'FULL' }
            });
        }

        // Notify the tutor about the new enrollment
        const student = await prisma.user.findUnique({ where: { id: userId } });
        createNotification(
            session.tutor.userId,
            '🎓 New Student Enrolled',
            `${student?.name || 'A student'} has registered for your tutoring session on ${session.subject}.`,
            'SUCCESS',
            '/tutoring'
        );

        res.status(201).json(enrollment);
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint
            return res.status(400).json({ error: 'You are already enrolled in this session' });
        }
        console.error('Error joining session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
