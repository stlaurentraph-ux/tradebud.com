import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

const getAuthenticatedSupabaseUserId = vi.fn();
const fetchOwnedFarmerIdsFromApi = vi.fn();
const getBootstrapOwnedFarmerIds = vi.fn();
const fetchPlotsForFarmerCached = vi.fn();
const rekeyFarmerIdInDatabase = vi.fn();
const adoptOnDeviceFarmerScope = vi.fn();
const logAuditEvent = vi.fn();

vi.mock('@/features/api/syncAuthSession', () => ({ getAuthenticatedSupabaseUserId }));
vi.mock('@/features/api/fieldAppBootstrap', () => ({
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
}));
vi.mock('@/features/sync/serverPlotFetchCache', () => ({ fetchPlotsForFarmerCached }));
vi.mock('@/features/auth/farmerProfileBootstrap', () => ({
  isUuid: (value: string) => /^[0-9a-f]{8}-/.test(value),
}));
vi.mock('@/features/state/persistence', () => ({
  rekeyFarmerIdInDatabase,
  adoptOnDeviceFarmerScope,
  logAuditEvent,
}));

const AUTH_UID = '66b5dafa-30be-4acb-a9c5-4e5c1ea22455';
const LINKED_PROFILE = 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17';

describe('alignFarmerWithAuthUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBootstrapOwnedFarmerIds.mockReturnValue([]);
    fetchPlotsForFarmerCached.mockResolvedValue([]);
    rekeyFarmerIdInDatabase.mockResolvedValue(undefined);
    adoptOnDeviceFarmerScope.mockResolvedValue(undefined);
    logAuditEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('never collapses the device onto the auth uid when the server owns a producer profile', async () => {
    getAuthenticatedSupabaseUserId.mockResolvedValue(AUTH_UID);
    fetchOwnedFarmerIdsFromApi.mockResolvedValue([LINKED_PROFILE]);

    const { alignFarmerWithAuthUser } = await import('./alignFarmerWithAuthUser');
    const result = await alignFarmerWithAuthUser(
      { id: LINKED_PROFILE, name: 'Hector' } as any,
      { localPlots: [] },
    );

    expect(result.rekeyed).toBe(false);
    expect(result.farmer?.id).toBe(LINKED_PROFILE);
    expect(rekeyFarmerIdInDatabase).not.toHaveBeenCalled();
  });

  it('does not rekey even when a transient empty plot list is returned', async () => {
    getAuthenticatedSupabaseUserId.mockResolvedValue(AUTH_UID);
    fetchOwnedFarmerIdsFromApi.mockResolvedValue([LINKED_PROFILE]);
    fetchPlotsForFarmerCached.mockResolvedValue([]);

    const { alignFarmerWithAuthUser } = await import('./alignFarmerWithAuthUser');
    const result = await alignFarmerWithAuthUser(
      { id: LINKED_PROFILE, name: 'Hector' } as any,
      { localPlots: [] },
    );

    expect(result.rekeyed).toBe(false);
    expect(rekeyFarmerIdInDatabase).not.toHaveBeenCalled();
  });

  it('aligns to the auth uid only when no other server profile exists and no plots are found', async () => {
    const deviceId = 'aaaaaaaa-1111-2222-3333-444444444444';
    getAuthenticatedSupabaseUserId.mockResolvedValue(AUTH_UID);
    fetchOwnedFarmerIdsFromApi.mockResolvedValue([]);
    fetchPlotsForFarmerCached.mockResolvedValue([]);

    const { alignFarmerWithAuthUser } = await import('./alignFarmerWithAuthUser');
    const result = await alignFarmerWithAuthUser(
      { id: deviceId, name: 'Hector' } as any,
      { localPlots: [] },
    );

    expect(rekeyFarmerIdInDatabase).toHaveBeenCalledWith(deviceId, AUTH_UID);
    expect(result.rekeyed).toBe(true);
    expect(result.farmer?.id).toBe(AUTH_UID);
  });
});
