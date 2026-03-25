import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  profileId: string;
  companyId?: string;
  profile?: {
    id: string;
    name: string;
    description: string;
  };
}

interface AuthContextData {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (cnpj: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/my-profile');
      setUser(data);
    } catch {
      // Token invalid — clear state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // On mount, if token exists, load profile
  useEffect(() => {
    if (token) {
      loadProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token, loadProfile]);

  const login = async (cnpj: string, email: string, password: string) => {
    const { data } = await api.post('/auth/login', { cnpj, email, password });

    const jwt = data.accessToken;
    if (!jwt) throw new Error('Token não retornado pelo servidor');

    localStorage.setItem('auth_token', jwt);
    setToken(jwt);

    if (data.user) {
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    } else {
      // Fetch profile separately
      await loadProfile();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
