import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getTenantSchemaFromAccessToken, getRoleFromAccessToken } from '@/lib/jwtTenantSchema';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  profileId: string;
  companyId?: string;
  profileName?: string;
  profileIsDefault?: boolean;
  role?: string;
  profile?: {
    id: string;
    name: string;
    description: string;
    isDefault?: boolean;
  };
}

interface LoginResponseUser {
  id: string;
  email: string;
  fullName: string;
  profileId: string;
  profileName: string;
  profileIsDefault?: boolean;
  role?: string;
}

function mapLoginUser(u: LoginResponseUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    profileId: u.profileId,
    profileName: u.profileName,
    profileIsDefault: u.profileIsDefault,
    role: u.role,
    profile: {
      id: u.profileId,
      name: u.profileName,
      description: '',
      isDefault: u.profileIsDefault,
    },
  };
}

interface AuthContextData {
  user: AuthUser | null;
  token: string | null;
  tenantCnpj: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (cnpj: string, email: string, password: string) => Promise<void>;
  ownerLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [tenantCnpj, setTenantCnpj] = useState<string | null>(() => {
    const ls = localStorage.getItem('tenant_cnpj');
    if (ls) {
      const d = ls.replace(/\D/g, '');
      if (d.length === 14) return d;
    }
    return getTenantSchemaFromAccessToken(localStorage.getItem('auth_token'));
  });
  const [role, setRole] = useState<string | null>(() => {
    return getRoleFromAccessToken(localStorage.getItem('auth_token'));
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get<AuthUser>('/users/my-profile');
      const merged: AuthUser = {
        ...data,
        profileName: data.profile?.name ?? data.profileName,
        profileIsDefault: data.profile?.isDefault ?? data.profileIsDefault,
      };
      setUser(merged);
      localStorage.setItem('auth_user', JSON.stringify(merged));
      const fromJwt = getTenantSchemaFromAccessToken(localStorage.getItem('auth_token'));
      if (fromJwt && localStorage.getItem('tenant_cnpj') !== fromJwt) {
        localStorage.setItem('tenant_cnpj', fromJwt);
        setTenantCnpj(fromJwt);
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('tenant_cnpj');
      setToken(null);
      setUser(null);
      setTenantCnpj(null);
    }
  }, []);

  // On mount, if token exists, load profile (skip for Owner — no tenant context)
  useEffect(() => {
    if (token) {
      const tokenRole = getRoleFromAccessToken(token);
      if (tokenRole === 'OWNER') {
        setIsLoading(false);
      } else {
        loadProfile().finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(false);
    }
  }, [token, loadProfile]);

  const login = async (cnpj: string, email: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string;
      user?: LoginResponseUser;
    }>('/auth/login', { cnpj, email, password });

    const jwt = data.accessToken;
    if (!jwt) throw new Error('Token não retornado pelo servidor');

    const digits = cnpj.replace(/\D/g, '');
    const tokenRole = getRoleFromAccessToken(jwt) || 'USER';
    localStorage.setItem('auth_token', jwt);
    localStorage.setItem('tenant_cnpj', digits);
    setToken(jwt);
    setTenantCnpj(digits);
    setRole(tokenRole);

    if (data.user) {
      const mapped = mapLoginUser(data.user);
      setUser(mapped);
      localStorage.setItem('auth_user', JSON.stringify(mapped));
      await loadProfile();
    } else {
      await loadProfile();
    }
  };

  const ownerLogin = async (email: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string;
      user?: LoginResponseUser;
    }>('/auth/owner-login', { email, password });

    const jwt = data.accessToken;
    if (!jwt) throw new Error('Token não retornado pelo servidor');

    localStorage.setItem('auth_token', jwt);
    localStorage.removeItem('tenant_cnpj');
    setToken(jwt);
    setTenantCnpj(null);
    setRole('OWNER');

    if (data.user) {
      const mapped = mapLoginUser(data.user);
      setUser(mapped);
      localStorage.setItem('auth_user', JSON.stringify(mapped));
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('tenant_cnpj');
    setToken(null);
    setUser(null);
    setTenantCnpj(null);
    setRole(null);
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
        tenantCnpj,
        role,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        ownerLogin,
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
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
