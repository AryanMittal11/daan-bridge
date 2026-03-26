import { Server, Socket } from 'socket.io';
import prisma from '../prisma/client';

export const setupChatSockets = (io: Server) => {
  // Mapping user IDs to their socket IDs to track online status if needed
  const onlineUsers = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId && userId !== 'undefined') {
      onlineUsers.set(userId, socket.id);
      
      // Emit the initial list of all currently online users
      socket.emit('online_users', Array.from(onlineUsers.keys()));
      
      // Let everyone else know this user is online
      socket.broadcast.emit('user_online', userId);
    }

    // When user joins a conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
    });

    // Handle sending message
    socket.on('send_message', async (data: { conversationId: string; senderId: string; text: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: data.senderId,
            text: data.text,
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        });

        // Update the conversation's updatedAt timestamp
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() }
        });

        // Ensure ALL participants are in the room so they receive the event
        const conv = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          include: { participants: { select: { id: true } } }
        });
        conv?.participants.forEach(p => {
           const sId = onlineUsers.get(p.id);
           if (sId) {
              const pSocket = io.sockets.sockets.get(sId);
              pSocket?.join(data.conversationId);
           }
        });

        // Broadcast the message to the conversation room
        io.to(data.conversationId).emit('receive_message', message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async ({ conversationId, userId }: { conversationId: string, userId: string }) => {
      try {
        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true }
        });

        // Ensure both participants are in the room before emitting
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: { select: { id: true } } }
        });
        conv?.participants.forEach(p => {
           const sId = onlineUsers.get(p.id);
           if (sId) {
              const pSocket = io.sockets.sockets.get(sId);
              pSocket?.join(conversationId);
           }
        });

        io.to(conversationId).emit('messages_read', { conversationId, readBy: userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', () => {
      if (userId && userId !== 'undefined') {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', userId);
      }
    });
  });
};
