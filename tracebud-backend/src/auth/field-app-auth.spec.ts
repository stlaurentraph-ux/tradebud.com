import { resolveFieldActorRole } from './field-app-auth';

describe('resolveFieldActorRole', () => {
  const farmerUser = { id: 'user-1', app_metadata: { role: 'farmer' } };
  const agentUser = { id: 'user-2', app_metadata: { role: 'agent' } };
  const exporterUser = { id: 'user-3', app_metadata: { role: 'exporter' } };

  function poolWithFarmerProfile(userId: string) {
    return {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('farmer_profile') && params?.[0] === userId) {
          return { rows: [{ '?column?': 1 }] };
        }
        return { rows: [] };
      }),
    } as never;
  }

  function poolWithoutProfile() {
    return {
      query: jest.fn(async () => ({ rows: [] })),
    } as never;
  }

  it('returns farmer from JWT role', async () => {
    await expect(resolveFieldActorRole(poolWithoutProfile(), farmerUser)).resolves.toBe('farmer');
  });

  it('returns agent from JWT role', async () => {
    await expect(resolveFieldActorRole(poolWithoutProfile(), agentUser)).resolves.toBe('agent');
  });

  it('returns farmer for dashboard JWT when farmer_profile is linked', async () => {
    await expect(
      resolveFieldActorRole(poolWithFarmerProfile('user-3'), exporterUser),
    ).resolves.toBe('farmer');
  });

  it('returns null for dashboard JWT without farmer_profile', async () => {
    await expect(resolveFieldActorRole(poolWithoutProfile(), exporterUser)).resolves.toBeNull();
  });

  it('assertTenantClaimOrFieldActor allows field-app signup without tenant', async () => {
    const { assertTenantClaimOrFieldActor } = await import('./field-app-auth');
    await expect(
      assertTenantClaimOrFieldActor(poolWithoutProfile(), {
        id: 'user-4',
        user_metadata: { signup_source: 'field-app', role: 'farmer' },
        app_metadata: { provider: 'google' },
      }),
    ).resolves.toBeUndefined();
  });
});
