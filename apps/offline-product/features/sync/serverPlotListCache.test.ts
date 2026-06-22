import { describe, expect, it, vi, beforeEach } from 'vitest';

const resolveFieldSyncScope = vi.fn();
const fetchBackendPlotsForSyncScope = vi.fn();

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  resolveFieldSyncScope,
  fetchBackendPlotsForSyncScope,
}));

async function loadModule() {
  return import('./serverPlotListCache');
}

describe('serverPlotListCache', () => {
  beforeEach(() => {
    vi.resetModules();
    resolveFieldSyncScope.mockReset();
    fetchBackendPlotsForSyncScope.mockReset();
  });

  it('returns cached rows within TTL without a second network fetch', async () => {
    resolveFieldSyncScope.mockResolvedValue({
      apiFarmerId: 'farmer-a',
      ownedFarmerIds: ['farmer-a'],
      serverPlotCount: 0,
    });
    fetchBackendPlotsForSyncScope.mockResolvedValue([{ id: 'plot-1' }]);

    const { fetchServerPlotListForUi } = await loadModule();
    const first = await fetchServerPlotListForUi({
      profileFarmerId: 'farmer-a',
      localPlots: [],
    });
    const second = await fetchServerPlotListForUi({
      profileFarmerId: 'farmer-a',
      localPlots: [],
    });

    expect(first).toEqual([{ id: 'plot-1' }]);
    expect(second).toEqual([{ id: 'plot-1' }]);
    expect(fetchBackendPlotsForSyncScope).toHaveBeenCalledTimes(1);
  });

  it('refetches when force is true', async () => {
    resolveFieldSyncScope.mockResolvedValue({
      apiFarmerId: 'farmer-a',
      ownedFarmerIds: ['farmer-a'],
      serverPlotCount: 0,
    });
    fetchBackendPlotsForSyncScope.mockResolvedValue([{ id: 'plot-1' }]);

    const { fetchServerPlotListForUi, invalidateServerPlotListCache } = await loadModule();
    await fetchServerPlotListForUi({ profileFarmerId: 'farmer-a', localPlots: [] });
    invalidateServerPlotListCache();
    await fetchServerPlotListForUi({
      profileFarmerId: 'farmer-a',
      localPlots: [],
      force: true,
    });

    expect(fetchBackendPlotsForSyncScope).toHaveBeenCalledTimes(2);
  });
});
