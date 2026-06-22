import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plot } from '@/features/state/AppStateContext';

const mocks = vi.hoisted(() => ({
  fetchBackendPlotsForSyncScope: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  persistPlots: vi.fn(),
  savePlotServerLink: vi.fn(),
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  persistPlots: mocks.persistPlots,
  savePlotServerLink: mocks.savePlotServerLink,
}));

import { restoreLocalPlotsFromServer } from './restoreLocalPlotsFromServer';

const { fetchBackendPlotsForSyncScope, loadPlotServerLinks, persistPlots, savePlotServerLink } =
  mocks;

const polygonGeometry = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [30, -1],
      [30.001, -1],
      [30.001, -1.001],
      [30, -1],
    ],
  ],
};

describe('restoreLocalPlotsFromServer', () => {
  beforeEach(() => {
    fetchBackendPlotsForSyncScope.mockReset();
    loadPlotServerLinks.mockReset();
    persistPlots.mockReset();
    savePlotServerLink.mockReset();
    loadPlotServerLinks.mockResolvedValue({});
    persistPlots.mockResolvedValue(undefined);
    savePlotServerLink.mockResolvedValue(undefined);
  });

  it('restores server plots missing locally and saves links', async () => {
    fetchBackendPlotsForSyncScope.mockResolvedValue([
      {
        id: 'server-a',
        client_plot_id: 'local-a',
        name: 'Block A',
        kind: 'polygon',
        area_ha: 2,
        geometry: polygonGeometry,
      },
    ]);

    const result = await restoreLocalPlotsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots: [],
    });

    expect(result.restoredCount).toBe(1);
    expect(result.mergedPlots).toHaveLength(1);
    expect(result.mergedPlots[0]?.id).toBe('local-a');
    expect(persistPlots).toHaveBeenCalledWith(result.mergedPlots);
    expect(savePlotServerLink).toHaveBeenCalledWith('local-a', 'server-a');
  });

  it('skips plots already linked locally', async () => {
    const localPlots: Plot[] = [
      {
        id: 'local-a',
        farmerId: 'farmer-1',
        name: 'Block A',
        createdAt: 1,
        areaSquareMeters: 20_000,
        areaHectares: 2,
        kind: 'polygon',
        points: [{ latitude: -1, longitude: 30 }],
      },
    ];
    loadPlotServerLinks.mockResolvedValue({ 'local-a': 'server-a' });
    fetchBackendPlotsForSyncScope.mockResolvedValue([
      {
        id: 'server-a',
        client_plot_id: 'local-a',
        name: 'Block A',
        kind: 'polygon',
        area_ha: 2,
        geometry: polygonGeometry,
      },
    ]);

    const result = await restoreLocalPlotsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
    });

    expect(result.restoredCount).toBe(0);
    expect(persistPlots).not.toHaveBeenCalled();
  });

  it('returns fetchFailed when server list fails', async () => {
    fetchBackendPlotsForSyncScope.mockRejectedValue(new Error('429'));

    const localPlots: Plot[] = [];
    const result = await restoreLocalPlotsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: ['farmer-1'],
      localPlots,
    });

    expect(result.fetchFailed).toBe(true);
    expect(result.restoredCount).toBe(0);
    expect(result.mergedPlots).toEqual(localPlots);
  });
});
