import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  quickSwitch: (role: 'admin' | 'staff') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bank_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bank_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (localStorage.getItem('bank_token')) {
        const res = await api.getMe();
        setUser(res.user);
        localStorage.setItem('bank_user', JSON.stringify(res.user));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('bank_token');
      localStorage.removeItem('bank_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('bank_auth_expired', handleExpired);
    return () => window.removeEventListener('bank_auth_expired', handleExpired);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('bank_token', res.token);
      localStorage.setItem('bank_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('bank_token');
      localStorage.removeItem('bank_user');
    }
  };

  const quickSwitch = async (role: 'admin' | 'staff') => {
    setIsLoading(true);
    try {
      const res = await api.quickSwitch(role);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('bank_token', res.token);
      localStorage.setItem('bank_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
    quickSwitch,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
