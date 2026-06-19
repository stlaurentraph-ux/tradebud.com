import { describe, expect, it, vi, afterEach } from 'vitest';

const fetchPlotsForFarmer = vi.fn();
const bootstrapFieldAppProducer = vi.fn();
const fetchOwnedFarmerIdsFromApi = vi.fn();
const getBootstrapOwnedFarmerIds = vi.fn();

vi.mock('@/features/api/postPlot', () => ({
  fetchPlotsForFarmer,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  bootstrapFieldAppProducer,
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
}));

vi.mock('@/features/state/persistence', () => ({
  adoptOnDeviceFarmerScope: vi.fn(),
  repairPendingSyncPayloadFarmerIds: vi.fn(),
  rekeyFarmerIdInDatabase: vi.fn(),
}));

describe('resolveFieldSyncScope', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prefers the owned profile id that lists server plots', async () => {
    bootstrapFieldAppProducer.mockResolvedValue({ ok: true });
    fetchOwnedFarmerIdsFromApi.mockResolvedValue(['device-farmer', 'linked-farmer']);
    getBootstrapOwnedFarmerIds.mockReturnValue([]);
    fetchPlotsForFarmer.mockImplementation(async (id: string) => {
      if (id === 'linked-farmer') return [{ id: 'plot-1' }];
      return [];
    });

    const { resolveFieldSyncScope } = await import('./resolveFieldSyncScope');
    const scope = await resolveFieldSyncScope({
      profileFarmerId: 'auth-user',
      localPlots: [{ id: 'local-1', farmerId: 'auth-user' } as any],
    });

    expect(scope.apiFarmerId).toBe('linked-farmer');
    expect(scope.serverPlotCount).toBe(1);
    expect(scope.ownedFarmerIds).toContain('linked-farmer');
  });
});
