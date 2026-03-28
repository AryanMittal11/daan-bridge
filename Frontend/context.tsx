import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import API from './api';
import { io as socketIO, Socket } from 'socket.io-client';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: number;
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
  refreshNotifications: () => void;
  loading: boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  location?: string;
  docUrl?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await API.get('/notifications/unread-count');
      setNotifications(data.count);
    } catch (err) {
      // Silently fail if not logged in
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await API.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Auth verification failed', error);
          localStorage.removeItem('token');
          delete API.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch notification count when user is set
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  // Socket.IO for real-time notifications
  useEffect(() => {
    if (user) {
      const s = socketIO('http://localhost:4000', {
        query: { userId: user.id },
      });

      s.on('new_notification', () => {
        fetchUnreadCount();
      });

      s.on('notification_count', (data: { count: number }) => {
        setNotifications(data.count);
      });

      setSocket(s);

      return () => {
        s.disconnect();
        setSocket(null);
      };
    }
  }, [user, fetchUnreadCount]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return true;
    } catch (err) {
      return false;
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      const { data } = await API.post('/auth/register', input);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setNotifications(0);
    localStorage.removeItem('token');
    socket?.disconnect();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{ user, login, register, logout, theme, toggleTheme, notifications, setNotifications, refreshNotifications: fetchUnreadCount, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

