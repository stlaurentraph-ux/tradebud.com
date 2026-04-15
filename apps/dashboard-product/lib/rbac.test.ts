import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/types';
import { getVisibleNavItems } from './rbac';

function makeUser(activeRole: User['active_role']): User {
  return {
    id: `user-${activeRole}`,
    email: `${activeRole}@example.com`,
    name: `${activeRole} user`,
    tenant_id: 'tenant_test',
    roles: [activeRole],
    active_role: activeRole,
    created_at: new Date().toISOString(),
  };
}

describe('rbac navigation visibility', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides deferred routes for exporter when feature flags are disabled', () => {
    const exporter = makeUser('exporter');
    const names = getVisibleNavItems(exporter).map((item) => item.name);

    expect(names).toContain('Overview');
    expect(names).toContain('Compliance');
    expect(names).not.toContain('Requests');
    expect(names).not.toContain('Reports');
  });

  it('shows deferred routes for exporter when feature flags are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'true');
    const exporter = makeUser('exporter');
    const names = getVisibleNavItems(exporter).map((item) => item.name);

    expect(names).toContain('Requests');
    expect(names).toContain('Reports');
  });

  it('keeps role restrictions even when all feature flags are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'true');
    const cooperative = makeUser('cooperative');
    const names = getVisibleNavItems(cooperative).map((item) => item.name);

    expect(names).toContain('Compliance');
    expect(names).toContain('Requests');
    expect(names).not.toContain('Reports');
    expect(names).not.toContain('Admin');
  });

  it('respects mixed gate state for importer role paths', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
    const importer = makeUser('importer');
    const names = getVisibleNavItems(importer).map((item) => item.name);

    expect(names).toContain('Requests');
    expect(names).not.toContain('Reports');
    expect(names).toContain('Compliance');
    expect(names).toContain('Audit Log');
    expect(names).not.toContain('Admin');
  });

  it('respects mixed gate state for country reviewer role paths', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'true');
    const reviewer = makeUser('country_reviewer');
    const names = getVisibleNavItems(reviewer).map((item) => item.name);

    expect(names).not.toContain('Requests');
    expect(names).toContain('Reports');
    expect(names).toContain('Role Decisions');
    expect(names).toContain('Audit Log');
    expect(names).not.toContain('Admin');
  });
});
