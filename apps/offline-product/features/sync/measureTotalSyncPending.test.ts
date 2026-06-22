import { describe, expect, it, vi, afterEach } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';

const loadPlotServerLinks = vi.fn();
const persistPlotServerLinks = vi.fn();
const loadPendingSyncActions = vi.fn();
const compactDuplicatePendingSyncActions = vi.fn();
const prepareFieldSyncContext = vi.fn();
const fetchBackendPlotsForSyncScope = vi.fn();
const fetchOwnedFarmerIdsFromApi = vi.fn();
const getBootstrapOwnedFarmerIds = vi.fn();

vi.mock('@/features/state/persistence', () => ({
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
  loadPlotServerLinks,
  persistPlotServerLinks,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  prepareFieldSyncContext,
  fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/api/fieldAppBootstrap', () => ({
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
}));

vi.mock('@/features/sync/serverPlotListCache', () => ({
  invalidateServerPlotListCache: vi.fn(),
}));

vi.mock('@/features/sync/serverPlotFetchCache', () => ({
  invalidateServerPlotFetchCache: vi.fn(),
}));

const plot1: Plot = {
  id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168',
  farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
  name: 'Plot 1',
  kind: 'polygon',
  areaHectares: 0.35,
  areaSquareMeters: 3500,
  points: [{ latitude: 14.1, longitude: -87.2 }],
  createdAt: 1,
};

const plot2: Plot = {
  id: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781771458544',
  farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
  name: 'Plot 2',
  kind: 'polygon',
  areaHectares: 0.4,
  areaSquareMeters: 4000,
  points: [{ latitude: 14.2, longitude: -87.3 }],
  createdAt: 2,
};

describe('measureTotalSyncPending', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('treats server plots as synced after farmer rekey suffix match', async () => {
    compactDuplicatePendingSyncActions.mockResolvedValue(0);
    loadPendingSyncActions.mockResolvedValue([]);
    loadPlotServerLinks.mockResolvedValue({});
    prepareFieldSyncContext.mockResolvedValue({
      farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
      ownedFarmerIds: [
        'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
        '66b5dafa-30be-4acb-a9c5-4e5c1ea22455',
      ],
      rekeyed: false,
    });
    fetchBackendPlotsForSyncScope.mockResolvedValue([
      {
        id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        name: 'Plot 1',
        kind: 'polygon',
      },
      {
        id: '5b7d5a29-883e-4e86-bd44-1cc58677a5d9',
        client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781771458544',
        name: 'Plot 2',
        kind: 'polygon',
      },
    ]);

    const { measureTotalSyncPending } = await import('./measureTotalSyncPending');
    const snapshot = await measureTotalSyncPending({
      farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
      plots: [plot1, plot2],
      isSignedIn: true,
      forcePlotFetch: true,
    });

    expect(snapshot.unsyncedPlotCount).toBe(0);
    expect(snapshot.total).toBe(0);
    expect(snapshot.plotServerLinks?.[plot1.id]).toBe('686b9ff6-acf7-40ff-9bb0-2d96f060bb78');
    expect(snapshot.plotServerLinks?.[plot2.id]).toBe('5b7d5a29-883e-4e86-bd44-1cc58677a5d9');
    expect(persistPlotServerLinks).toHaveBeenCalled();
  });

  it('falls back to owned farmer ids from API when scope preparation fails', async () => {
    compactDuplicatePendingSyncActions.mockResolvedValue(0);
    loadPendingSyncActions.mockResolvedValue([]);
    loadPlotServerLinks.mockResolvedValue({});
    prepareFieldSyncContext.mockRejectedValue(new Error('scope failed'));
    fetchOwnedFarmerIdsFromApi.mockResolvedValue(['dcdd88e5-13e6-45d6-8e09-e6f1968e7e17']);
    getBootstrapOwnedFarmerIds.mockReturnValue([]);
    fetchBackendPlotsForSyncScope.mockResolvedValue([
      {
        id: 'server-1',
        client_plot_id: plot1.id,
        name: 'Plot 1',
        kind: 'polygon',
      },
    ]);

    const { measureTotalSyncPending } = await import('./measureTotalSyncPending');
    const snapshot = await measureTotalSyncPending({
      farmerId: 'device-farmer',
      plots: [plot1],
      isSignedIn: true,
    });

    expect(fetchBackendPlotsForSyncScope).toHaveBeenCalledWith({
      farmerId: 'device-farmer',
      ownedFarmerIds: ['dcdd88e5-13e6-45d6-8e09-e6f1968e7e17', 'device-farmer'],
    });
    expect(snapshot.unsyncedPlotCount).toBe(0);
  });
});
