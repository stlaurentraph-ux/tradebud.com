import type { AppRole } from '../auth/roles';

export type TestSupabaseUser = {
  id: string;
  email: string;
  app_metadata?: {
    tenant_id?: string;
    role?: AppRole | string;
  };
  user_metadata?: Record<string, unknown>;
};

export function testUser(options: {
  id?: string;
  email?: string;
  tenantId?: string;
  role?: AppRole;
  withoutTenant?: boolean;
  userMetadata?: Record<string, unknown>;
} = {}): TestSupabaseUser {
  const user: TestSupabaseUser = {
    id: options.id ?? 'user_1',
    email: options.email ?? 'test@tracebud.com',
  };
  if (options.userMetadata) {
    user.user_metadata = options.userMetadata;
  }
  if (!options.withoutTenant) {
    user.app_metadata = {
      tenant_id: options.tenantId ?? 'tenant_1',
      ...(options.role ? { role: options.role } : {}),
    };
  }
  return user;
}

export function exporterUser(
  overrides: Omit<Parameters<typeof testUser>[0], 'role'> = {},
): TestSupabaseUser {
  return testUser({ email: 'exporter+ops@tracebud.com', role: 'exporter', ...overrides });
}

export function agentUser(
  overrides: Omit<Parameters<typeof testUser>[0], 'role'> = {},
): TestSupabaseUser {
  return testUser({ email: 'agent+field@example.com', role: 'agent', ...overrides });
}

export function farmerUser(
  overrides: Omit<Parameters<typeof testUser>[0], 'role'> = {},
): TestSupabaseUser {
  return testUser({ email: 'farmer@example.com', role: 'farmer', ...overrides });
}
