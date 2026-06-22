import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchMergedAuditEventsForFarmer: vi.fn(),
  loadAppState: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(),
  persistFarmer: vi.fn(),
  persistPlots: vi.fn(),
  savePlotCadastralKey: vi.fn(),
  savePlotTenure: vi.fn(),
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  fetchMergedAuditEventsForFarmer: mocks.fetchMergedAuditEventsForFarmer,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  loadAppState: mocks.loadAppState,
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  persistFarmer: mocks.persistFarmer,
  persistPlots: mocks.persistPlots,
  savePlotCadastralKey: mocks.savePlotCadastralKey,
  savePlotTenure: mocks.savePlotTenure,
}));

import { restoreLocalDeclarationsFromServer } from './restoreLocalDeclarationsFromServer';

describe('restoreLocalDeclarationsFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPlotServerLinks.mockResolvedValue({});
    mocks.fetchBackendPlotsForSyncScope.mockResolvedValue([]);
    mocks.loadAppState.mockResolvedValue({ farmer: undefined, plots: [] });
  });

  it('restores producer attestations when missing locally', async () => {
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        id: 'evt-1',
        event_type: 'producer_attestations_updated',
        timestamp: '2026-06-19T12:00:00.000Z',
        payload: {
          farmerId: 'farmer-1',
          fpicConsent: true,
          laborNoChildLabor: true,
          laborNoForcedLabor: true,
          selfDeclared: true,
          selfDeclaredAt: 1_700_000_000_000,
        },
      },
    ]);

    const result = await restoreLocalDeclarationsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
      localFarmer: {
        id: 'farmer-1',
        role: 'farmer',
        selfDeclared: false,
      },
      localPlots: [],
    });

    expect(result.producerRestored).toBe(true);
    expect(mocks.persistFarmer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'farmer-1',
        fpicConsent: true,
        laborNoChildLabor: true,
        laborNoForcedLabor: true,
        selfDeclared: true,
      }),
    );
  });

  it('restores plot compliance flags by local plot id', async () => {
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        id: 'evt-2',
        event_type: 'plot_compliance_declared',
        timestamp: '2026-06-19T12:00:00.000Z',
        payload: {
          plotId: 'local-1',
          farmerId: 'farmer-1',
          landTenureDeclared: true,
          noDeforestationDeclared: true,
        },
      },
    ]);

    const result = await restoreLocalDeclarationsFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
      localFarmer: {
        id: 'farmer-1',
        role: 'farmer',
        selfDeclared: true,
        fpicConsent: true,
        laborNoChildLabor: true,
        laborNoForcedLabor: true,
      },
      localPlots: [
        {
          id: 'local-1',
          farmerId: 'farmer-1',
          name: 'Plot A',
          createdAt: 1,
          areaSquareMeters: 1000,
          areaHectares: 0.1,
          kind: 'polygon',
          points: [{ latitude: 1, longitude: 2 }],
        },
      ],
    });

    expect(result.plotsRestored).toBe(1);
    expect(mocks.persistPlots).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'local-1',
        landTenureDeclared: true,
        noDeforestationDeclared: true,
      }),
    ]);
  });
});
