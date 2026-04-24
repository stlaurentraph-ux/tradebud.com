'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  startTransition,
  type ReactNode,
} from 'react';
import type { User, TenantRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  hydrateSessionFromToken: (token: string) => void;
  logout: () => void;
  switchRole: (role: TenantRole) => void;
  impersonateDemo: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapClaimRoleToTenantRole(role: string | undefined): TenantRole {
  if (role === 'importer') return 'importer';
  if (role === 'cooperative') return 'cooperative';
  if (role === 'country_reviewer' || role === 'reviewer') return 'country_reviewer';
  if (role === 'sponsor') return 'sponsor';
  return 'exporter';
}

function buildUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const appMetadata = (payload.app_metadata ?? {}) as Record<string, unknown>;
  const userMetadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
  const roleClaim =
    (appMetadata.role as string | undefined) ??
    (userMetadata.role as string | undefined);
  const tenantId =
    (appMetadata.tenant_id as string | undefined) ??
    (userMetadata.tenant_id as string | undefined);
  const email = (payload.email as string | undefined) ?? '';
  const userId = (payload.sub as string | undefined) ?? '';
  if (!tenantId || !userId || !email) return null;
  const activeRole = mapClaimRoleToTenantRole(roleClaim);
  return {
    id: userId,
    email,
    name: email.split('@')[0] || 'Tracebud User',
    tenant_id: tenantId,
    roles: [activeRole],
    active_role: activeRole,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('tracebud_user');
    const storedToken = sessionStorage.getItem('tracebud_token');
    if (storedToken?.startsWith('demo_token_')) {
      sessionStorage.removeItem('tracebud_token');
      sessionStorage.removeItem('tracebud_user');
      startTransition(() => {
        setUser(null);
        setIsLoading(false);
      });
      return;
    }
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        startTransition(() => {
          setUser(parsed);
        });
      } catch {
        sessionStorage.removeItem('tracebud_user');
      }
    }
    if (!storedUser && storedToken) {
      const tokenUser = buildUserFromToken(storedToken);
      if (tokenUser) {
        sessionStorage.setItem('tracebud_user', JSON.stringify(tokenUser));
        startTransition(() => {
          setUser(tokenUser);
        });
      }
    }
    // DEV BYPASS: Auto-login with a mock cooperative user when no session exists
    // Remove this block when Supabase is properly configured
    if (!storedUser && !storedToken && process.env.NODE_ENV === 'development') {
      const devUser: User = {
        id: 'dev-user-001',
        email: 'dev@tracebud.local',
        name: 'Dev User',
        tenant_id: 'tenant-dev-001',
        roles: ['cooperative', 'exporter', 'importer'],
        active_role: 'cooperative',
        created_at: new Date().toISOString(),
      };
      sessionStorage.setItem('tracebud_user', JSON.stringify(devUser));
      startTransition(() => {
        setUser(devUser);
        setIsLoading(false);
      });
      return;
    }
    startTransition(() => {
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        access_token?: string;
        error_description?: string;
        error?: string;
      };
      if (!response.ok || !payload.access_token) {
        throw new Error(payload.error_description ?? payload.error ?? 'Invalid credentials.');
      }
      const derivedUser = buildUserFromToken(payload.access_token);
      if (!derivedUser) {
        throw new Error('Authenticated user is missing required role/tenant claims.');
      }
      sessionStorage.setItem('tracebud_token', payload.access_token);
      sessionStorage.setItem('tracebud_user', JSON.stringify(derivedUser));
      setUser(derivedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('tracebud_user');
    sessionStorage.removeItem('tracebud_token');
  }, []);

  const hydrateSessionFromToken = useCallback((token: string) => {
    const tokenUser = buildUserFromToken(token);
    if (!tokenUser) return;
    sessionStorage.setItem('tracebud_token', token);
    sessionStorage.setItem('tracebud_user', JSON.stringify(tokenUser));
    setUser(tokenUser);
  }, []);

  const switchRole = useCallback((role: TenantRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, active_role: role };
      setUser(updatedUser);
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const impersonateDemo = useCallback(async (email: string) => {
    void email;
    throw new Error('Demo impersonation is disabled.');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        hydrateSessionFromToken,
        logout,
        switchRole,
        impersonateDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
