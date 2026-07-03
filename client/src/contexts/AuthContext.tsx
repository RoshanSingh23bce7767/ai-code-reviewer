/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  revokeSessions: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const response = await apiClient.get('/users/me');
      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // First, get CSRF token so it sets the cookie
      try {
        await apiClient.get('/csrf-token');
      } catch {
        // CSRF get failing is non-fatal for local dev
      }
      
      // Try to fetch profile
      await refreshProfile();
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to global unauthorized event
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.success) {
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', { name, email, password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    await apiClient.post('/auth/verify-email', { token });
  };

  const forgotPassword = async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (token: string, password: string) => {
    await apiClient.post('/auth/reset-password', { token, password });
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    const response = await apiClient.patch('/users/me', data);
    if (response.data?.success) {
      await refreshProfile();
    }
  };

  const deleteAccount = async (password: string) => {
    await apiClient.delete('/users/me', { data: { password } });
    setUser(null);
  };

  const revokeSessions = async () => {
    await apiClient.post('/auth/sessions/revoke');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        updateProfile,
        deleteAccount,
        revokeSessions,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
