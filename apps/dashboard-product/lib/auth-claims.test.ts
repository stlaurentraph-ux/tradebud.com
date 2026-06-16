import { describe, expect, it } from 'vitest';
import { getTenantRoleFromAccessToken, mapClaimRoleToTenantRole } from './auth-claims';

describe('auth-claims', () => {
  it('maps backend role claims to tenant roles', () => {
    expect(mapClaimRoleToTenantRole('compliance_manager')).toBe('importer');
    expect(mapClaimRoleToTenantRole('country_reviewer')).toBe('country_reviewer');
    expect(mapClaimRoleToTenantRole('admin')).toBe('exporter');
  });

  it('reads active role from jwt metadata', () => {
    const payload = btoa(JSON.stringify({ alg: 'none' }))
      + '.'
      + btoa(JSON.stringify({ app_metadata: { role: 'sponsor' } }))
      + '.sig';
    expect(getTenantRoleFromAccessToken(payload)).toBe('sponsor');
  });
});
