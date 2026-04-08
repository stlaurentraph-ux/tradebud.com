'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, TenantRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: TenantRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for different roles
const DEMO_USERS: Record<string, User> = {
  'exporter@tracebud.com': {
    id: 'usr_exporter_001',
    email: 'exporter@tracebud.com',
    name: 'Maria Santos',
    tenant_id: 'tenant_brazil_001',
    roles: ['exporter'],
    active_role: 'exporter',
    created_at: '2024-01-15T00:00:00Z',
  },
  'importer@tracebud.com': {
    id: 'usr_importer_001',
    email: 'importer@tracebud.com',
    name: 'Klaus Weber',
    tenant_id: 'tenant_germany_001',
    roles: ['importer'],
    active_role: 'importer',
    created_at: '2024-01-15T00:00:00Z',
  },
  'cooperative@tracebud.com': {
    id: 'usr_coop_001',
    email: 'cooperative@tracebud.com',
    name: 'Jean-Pierre Nkurunziza',
    tenant_id: 'tenant_rwanda_001',
    roles: ['cooperative'],
    active_role: 'cooperative',
    created_at: '2024-01-15T00:00:00Z',
  },
  'reviewer@tracebud.com': {
    id: 'usr_reviewer_001',
    email: 'reviewer@tracebud.com',
    name: 'Anna Schmidt',
    tenant_id: 'tenant_eu_001',
    roles: ['country_reviewer'],
    active_role: 'country_reviewer',
    created_at: '2024-01-15T00:00:00Z',
  },
  'sponsor@tracebud.com': {
    id: 'usr_sponsor_001',
    email: 'sponsor@tracebud.com',
    name: 'David Thompson',
    tenant_id: 'tenant_sponsor_001',
    roles: ['sponsor'],
    active_role: 'sponsor',
    created_at: '2024-01-15T00:00:00Z',
  },
  // Multi-role user
  'admin@tracebud.com': {
    id: 'usr_admin_001',
    email: 'admin@tracebud.com',
    name: 'Sophie Chen',
    tenant_id: 'tenant_global_001',
    roles: ['exporter', 'importer', 'country_reviewer'],
    active_role: 'exporter',
    created_at: '2024-01-15T00:00:00Z',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('tracebud_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('tracebud_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser) {
      setUser(demoUser);
      sessionStorage.setItem('tracebud_user', JSON.stringify(demoUser));
      sessionStorage.setItem('tracebud_token', 'demo_token_' + demoUser.id);
    } else {
      throw new Error('Invalid credentials. Use a demo account.');
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('tracebud_user');
    sessionStorage.removeItem('tracebud_token');
  }, []);

  const switchRole = useCallback((role: TenantRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, active_role: role };
      setUser(updatedUser);
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
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
