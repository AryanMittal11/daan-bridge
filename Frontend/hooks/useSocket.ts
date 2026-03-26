import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useSocket = (userId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId }
    });

    const socket = socketRef.current;

    socket.on('online_users', (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('user_online', (id: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    });

    socket.on('user_offline', (id: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  };

  const sendMessage = (conversationId: string, senderId: string, text: string) => {
    socketRef.current?.emit('send_message', { conversationId, senderId, text });
  };

  const markRead = (conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId, userId });
  };

  return {
    socket: socketRef.current,
    onlineUsers,
    joinConversation,
    sendMessage,
    markRead
  };
};
