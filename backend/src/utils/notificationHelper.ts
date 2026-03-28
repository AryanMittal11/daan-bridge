import prisma from '../prisma/client';
import { Server } from 'socket.io';
import { sendEmail, buildEmailHtml } from './emailService';

let io: Server | null = null;
let onlineUsers: Map<string, string> | null = null;

export function initNotificationHelper(socketIo: Server, users: Map<string, string>) {
  io = socketIo;
  onlineUsers = users;
}

/**
 * Create a notification for a single user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'ADMIN',
  link?: string,
  sendEmailNotification: boolean = false
) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, title, message, type, link },
    });

    // Push via Socket.IO if user is online
    if (io && onlineUsers) {
      const socketId = onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit('new_notification', notification);
      }
    }

    // Send unread count update
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });
    if (io && onlineUsers) {
      const socketId = onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit('notification_count', { count: unreadCount });
      }
    }

    // Send email if requested
    if (sendEmailNotification) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await sendEmail(user.email, title, buildEmailHtml(title, message, link));
      }
    }

    return notification;
  } catch (err) {
    console.error('[Notification] Failed to create:', err);
  }
}

/**
 * Send a notification to ALL verified users (e.g., SOS alerts, blood broadcasts)
 */
export async function createBroadcastNotification(
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'ADMIN',
  link?: string,
  excludeUserId?: string,
  sendEmailNotification: boolean = false
) {
  try {
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true, email: true },
    });

    // Batch create notifications
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
        link,
      })),
    });

    // Push to online users via Socket.IO
    if (io && onlineUsers) {
      for (const user of users) {
        const socketId = onlineUsers.get(user.id);
        if (socketId) {
          const unreadCount = await prisma.notification.count({
            where: { userId: user.id, read: false },
          });
          io.to(socketId).emit('new_notification', { title, message, type, link, userId: user.id });
          io.to(socketId).emit('notification_count', { count: unreadCount });
        }
      }
    }

    // Email only for urgent notifications
    if (sendEmailNotification) {
      const emailHtml = buildEmailHtml(title, message, link);
      for (const user of users) {
        if (user.email) {
          sendEmail(user.email, title, emailHtml); // fire-and-forget
        }
      }
    }
  } catch (err) {
    console.error('[Notification] Broadcast failed:', err);
  }
}

/**
 * Notify all ADMIN users
 */
export async function notifyAdmins(
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'ADMIN',
  link?: string,
  sendEmailNotification: boolean = false
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    });

    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title,
        message,
        type,
        link,
      })),
    });

    if (io && onlineUsers) {
      for (const admin of admins) {
        const socketId = onlineUsers.get(admin.id);
        if (socketId) {
          const unreadCount = await prisma.notification.count({
            where: { userId: admin.id, read: false },
          });
          io.to(socketId).emit('new_notification', { title, message, type, link, userId: admin.id });
          io.to(socketId).emit('notification_count', { count: unreadCount });
        }
      }
    }

    if (sendEmailNotification) {
      const emailHtml = buildEmailHtml(title, message, link);
      for (const admin of admins) {
        if (admin.email) {
          sendEmail(admin.email, title, emailHtml);
        }
      }
    }
  } catch (err) {
    console.error('[Notification] Admin notify failed:', err);
  }
}
