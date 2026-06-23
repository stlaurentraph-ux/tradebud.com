import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchMergedAuditEventsForFarmer: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  loadPhotosForPlot: vi.fn(),
  loadTitlePhotosForPlot: vi.fn(),
  upsertPlotGroundPhoto: vi.fn(),
  persistPlotTitlePhoto: vi.fn(),
  downloadEvidenceFileFromStorage: vi.fn(),
}));

vi.mock('@/features/sync/fetchMergedAuditEventsForFarmer', () => ({
  fetchMergedAuditEventsForFarmer: mocks.fetchMergedAuditEventsForFarmer,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  loadPhotosForPlot: mocks.loadPhotosForPlot,
  loadTitlePhotosForPlot: mocks.loadTitlePhotosForPlot,
  upsertPlotGroundPhoto: mocks.upsertPlotGroundPhoto,
  persistPlotTitlePhoto: mocks.persistPlotTitlePhoto,
}));

vi.mock('@/features/evidence/downloadEvidenceFromStorage', () => ({
  downloadEvidenceFileFromStorage: mocks.downloadEvidenceFileFromStorage,
}));

import {
  restoreLocalGroundTruthPhotosFromServer,
  restoreLocalPlotPhotosFromServerAudit,
} from './restoreLocalGroundTruthPhotosFromServer';

describe('restoreLocalGroundTruthPhotosFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPlotServerLinks.mockResolvedValue({ 'local-1': 'server-plot-1' });
    mocks.fetchBackendPlotsForSyncScope.mockResolvedValue([{ id: 'server-plot-1' }]);
    mocks.loadPhotosForPlot.mockResolvedValue([]);
    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);
    mocks.downloadEvidenceFileFromStorage.mockResolvedValue({
      ok: true,
      localUri: 'file:///evidence/photo.jpg',
      remoteUrl: 'https://example.com/photo.jpg',
      storagePath: 'farmer/plot/photo.jpg',
    });
  });

  it('restores ground-truth photos from audit events', async () => {
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        id: 'evt-gt',
        event_type: 'plot_photos_synced',
        timestamp: '2026-06-19T12:00:00.000Z',
        payload: {
          plotId: 'server-plot-1',
          kind: 'ground_truth',
          photos: [
            {
              storagePath: 'farmer/plot/north.jpg',
              mimeType: 'image/jpeg',
              takenAt: 1_700_000_000_000,
              direction: 'north',
              latitude: 14.1,
              longitude: -87.2,
            },
          ],
        },
      },
    ]);

    const result = await restoreLocalGroundTruthPhotosFromServer({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
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

    expect(result.restoredCount).toBe(1);
    expect(mocks.upsertPlotGroundPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        plotId: 'local-1',
        direction: 'north',
        latitude: 14.1,
        longitude: -87.2,
      }),
    );
  });

  it('restores land-title photos from audit events', async () => {
    mocks.fetchMergedAuditEventsForFarmer.mockResolvedValue([
      {
        id: 'evt-lt',
        event_type: 'plot_photos_synced',
        timestamp: '2026-06-19T12:00:00.000Z',
        payload: {
          plotId: 'server-plot-1',
          kind: 'land_title',
          photos: [
            {
              storagePath: 'farmer/plot/title.jpg',
              mimeType: 'image/jpeg',
              takenAt: 1_700_000_000_000,
            },
          ],
        },
      },
    ]);

    const result = await restoreLocalPlotPhotosFromServerAudit({
      apiFarmerId: 'farmer-1',
      ownedFarmerIds: [],
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

    expect(result.landTitleRestored).toBe(1);
    expect(mocks.persistPlotTitlePhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        plotId: 'local-1',
        storagePath: 'farmer/plot/photo.jpg',
      }),
    );
  });
});
