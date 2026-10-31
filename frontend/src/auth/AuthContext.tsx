import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export type UserRole = 'EMPLOYEE' | 'HR_ADMIN' | 'HR_REVIEWER' | 'IT_ADMIN' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  joiner_id?: string;
  joiner?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  quickDemoLogin: (role: UserRole, email?: string) => Promise<void>;
  logout: () => void;
  getRoleHome: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  quickDemoLogin: async () => {},
  logout: () => {},
  getRoleHome: () => '/signin',
});

export const getRoleHome = (role?: UserRole): string => {
  switch (role) {
    case 'EMPLOYEE':
      return '/me';
    case 'HR_ADMIN':
      return '/hr/dashboard';
    case 'HR_REVIEWER':
      return '/review/dashboard';
    case 'IT_ADMIN':
      return '/it/dashboard';
    case 'SYSTEM_ADMIN':
      return '/admin/dashboard';
    default:
      return '/signin';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const demoRole = localStorage.getItem('demo_role');
    if (token || demoRole) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('access_token', res.access_token);
      localStorage.removeItem('demo_role');
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (role: UserRole, email?: string) => {
    setLoading(true);
    try {
      const res = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email || '', demo_role: role }),
      });
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('demo_role', role);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('demo_role');
    setUser(null);
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        quickDemoLogin,
        logout,
        getRoleHome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
