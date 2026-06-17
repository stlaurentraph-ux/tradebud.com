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
import { clearAuthTokens, setAuthTokens } from '@/lib/auth-session';
import { decodeJwtPayload, mapClaimRoleToTenantRole } from '@/lib/auth-claims';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';
import {
  defaultActiveRoleForProfile,
  resolveProfileTenantRoles,
  type CommercialProfile,
} from '@/lib/commercial-profile';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  hydrateSessionFromToken: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  switchRole: (role: TenantRole) => void;
  applyTenantRoleFromProfile: (role: TenantRole) => void;
  applyTenantRolesFromProfile: (profile: import('@/lib/commercial-profile').CommercialProfile | null) => void;
  updateProfile: (patch: { name?: string }) => void;
  impersonateDemo: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEV_SWITCHABLE_ROLES: TenantRole[] = ['cooperative', 'exporter', 'importer', 'country_reviewer', 'sponsor'];

function isDevRoleOverrideEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_ROLE_SWITCHER === 'true';
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
  const fullName =
    (userMetadata.full_name as string | undefined) ??
    (userMetadata.fullName as string | undefined);
  if (!tenantId || !userId || !email) return null;
  const activeRole = mapClaimRoleToTenantRole(roleClaim);
  return {
    id: userId,
    email,
    name: fullName?.trim() || email.split('@')[0] || 'Tracebud User',
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
        if (storedToken) {
          setAuthTokens(storedToken);
        }
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
        setAuthTokens(storedToken);
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
        refresh_token?: string;
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
      setAuthTokens(payload.access_token, payload.refresh_token);
      sessionStorage.setItem('tracebud_user', JSON.stringify(derivedUser));
      setUser(derivedUser);
      trackDashboardEvent(DASHBOARD_EVENTS.SIGN_IN_SUCCESS, {
        role: derivedUser.active_role,
      });
    } catch (error) {
      trackDashboardEvent(DASHBOARD_EVENTS.SIGN_IN_FAILURE, {
        reason: error instanceof Error ? error.message : 'sign_in_failed',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('tracebud_user');
    clearAuthTokens();
  }, []);

  const hydrateSessionFromToken = useCallback((token: string, refreshToken?: string | null) => {
    const tokenUser = buildUserFromToken(token);
    if (!tokenUser) return;
    setAuthTokens(token, refreshToken);
    sessionStorage.setItem('tracebud_user', JSON.stringify(tokenUser));
    setUser(tokenUser);
  }, []);

  const switchRole = useCallback((role: TenantRole) => {
    if (!user) return;
    const roleAllowed = user.roles.includes(role) || (isDevRoleOverrideEnabled() && DEV_SWITCHABLE_ROLES.includes(role));
    if (!roleAllowed) return;
    const mergedRoles = user.roles.includes(role) ? user.roles : [...user.roles, role];
    const updatedUser = { ...user, roles: mergedRoles, active_role: role };
    setUser(updatedUser);
    sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
  }, [user]);

  const applyTenantRolesFromProfile = useCallback((profile: CommercialProfile | null) => {
    setUser((current) => {
      if (!current || !profile) return current;
      const roles = resolveProfileTenantRoles(profile);
      const preferredActive =
        current.active_role && roles.includes(current.active_role)
          ? current.active_role
          : defaultActiveRoleForProfile(profile);
      const updatedUser: User = { ...current, roles, active_role: preferredActive };
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const applyTenantRoleFromProfile = useCallback((role: TenantRole) => {
    applyTenantRolesFromProfile({
      tenant_id: user?.tenant_id ?? '',
      organization_name: null,
      country: null,
      primary_role: role === 'importer' ? 'importer' : role === 'cooperative' ? 'exporter' : 'exporter',
      supply_chain_roles: [role === 'cooperative' ? 'cooperative' : role],
      team_size: null,
      main_commodity: null,
      primary_objective: null,
      profile_skipped: false,
      updated_at: new Date().toISOString(),
    });
  }, [applyTenantRolesFromProfile, user?.tenant_id]);

  const updateProfile = useCallback((patch: { name?: string }) => {
    setUser((current) => {
      if (!current) return current;
      const updatedUser: User = {
        ...current,
        ...(patch.name ? { name: patch.name } : {}),
      };
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

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
        applyTenantRoleFromProfile,
        applyTenantRolesFromProfile,
        updateProfile,
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
