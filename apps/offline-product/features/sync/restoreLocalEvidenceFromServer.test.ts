import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchPlotSyncedEvidence: vi.fn(),
  fetchPlotTenureVerification: vi.fn(),
  downloadEvidenceFileFromStorage: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(),
  loadTitlePhotosForPlot: vi.fn(),
  loadEvidenceForPlot: vi.fn(),
  persistPlotTitlePhoto: vi.fn(),
  persistPlotEvidenceItem: vi.fn(),
}));

vi.mock('@/features/api/postPlot', () => ({
  fetchPlotSyncedEvidence: mocks.fetchPlotSyncedEvidence,
  fetchPlotTenureVerification: mocks.fetchPlotTenureVerification,
}));

vi.mock('@/features/evidence/downloadEvidenceFromStorage', () => ({
  downloadEvidenceFileFromStorage: mocks.downloadEvidenceFileFromStorage,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: mocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPlotServerLinks: mocks.loadPlotServerLinks,
  loadTitlePhotosForPlot: mocks.loadTitlePhotosForPlot,
  loadEvidenceForPlot: mocks.loadEvidenceForPlot,
  persistPlotTitlePhoto: mocks.persistPlotTitlePhoto,
  persistPlotEvidenceItem: mocks.persistPlotEvidenceItem,
}));

import { restoreLocalEvidenceFromServer } from './restoreLocalEvidenceFromServer';

describe('restoreLocalEvidenceFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPlotServerLinks.mockResolvedValue({ 'local-1': 'server-1' });
    mocks.fetchBackendPlotsForSyncScope.mockResolvedValue([
      { id: 'server-1', client_plot_id: 'local-1' },
    ]);
    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);
    mocks.loadEvidenceForPlot.mockResolvedValue([]);
    mocks.downloadEvidenceFileFromStorage.mockResolvedValue({
      ok: true,
      localUri: 'file:///evidence/land.jpg',
      remoteUrl: 'https://signed.example/land.jpg',
      storagePath: 'user/server-1/land_title/1-photo',
    });
  });

  it('downloads and persists missing land title evidence', async () => {
    mocks.fetchPlotSyncedEvidence.mockResolvedValue([
      {
        id: 'doc-1',
        evidence_kind: 'land_title',
        file_storage_key: 'user/server-1/land_title/1-photo',
        mime_type: 'image/jpeg',
        updated_at: '2026-06-19T12:00:00.000Z',
      },
    ]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([]);

    const result = await restoreLocalEvidenceFromServer({
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
    expect(mocks.persistPlotTitlePhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        plotId: 'local-1',
        storagePath: 'user/server-1/land_title/1-photo',
      }),
    );
  });

  it('skips rows already stored by storage path', async () => {
    mocks.fetchPlotSyncedEvidence.mockResolvedValue([
      {
        id: 'doc-1',
        evidence_kind: 'tenure_evidence',
        file_storage_key: 'user/server-1/tenure_evidence/doc.pdf',
        mime_type: 'application/pdf',
        updated_at: '2026-06-19T12:00:00.000Z',
      },
    ]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([]);
    mocks.loadEvidenceForPlot.mockResolvedValue([
      {
        id: 1,
        plotId: 'local-1',
        kind: 'tenure_evidence',
        uri: 'https://signed.example/doc.pdf',
        mimeType: 'application/pdf',
        label: 'Land paper',
        takenAt: 1,
        storagePath: 'user/server-1/tenure_evidence/doc.pdf',
      },
    ]);

    const result = await restoreLocalEvidenceFromServer({
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

    expect(result.restoredCount).toBe(0);
    expect(mocks.downloadEvidenceFileFromStorage).not.toHaveBeenCalled();
  });
});
