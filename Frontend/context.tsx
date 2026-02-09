import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';
import API from './api';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: number;
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications] = useState(3);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally validate token and set initial user
      // Could call /api/me here
      // For now, keep user as is on reload
    }
  }, []);

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
    localStorage.removeItem('token');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{ user, login, register, logout, theme, toggleTheme, notifications }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
