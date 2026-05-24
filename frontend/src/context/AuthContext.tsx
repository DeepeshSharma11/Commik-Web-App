import React, { createContext, useContext, useCallback } from 'react';
import { useAppStore } from '../store';

interface AuthContextType {
  token: string | null;
  role: string | null;
  setToken: (token: string | null, role: string | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, role, setToken } = useAppStore();

  const logout = useCallback(() => {
    setToken(null, null);
    window.location.href = '/login';
  }, [setToken]);

  const value: AuthContextType = {
    token,
    role,
    setToken,
    isAuthenticated: !!token,
    isAdmin: role === 'admin',
    isSeller: role === 'seller',
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
