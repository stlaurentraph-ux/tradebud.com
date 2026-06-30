import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchPlotSyncedEvidence: vi.fn(),
  fetchPlotTenureVerification: vi.fn(),
  loadPhotosForPlot: vi.fn(),
  loadTitlePhotosForPlot: vi.fn(),
  loadEvidenceForPlot: vi.fn(),
}));

vi.mock('@/features/api/postPlot', () => ({
  fetchPlotSyncedEvidence: mocks.fetchPlotSyncedEvidence,
  fetchPlotTenureVerification: mocks.fetchPlotTenureVerification,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPhotosForPlot: mocks.loadPhotosForPlot,
  loadTitlePhotosForPlot: mocks.loadTitlePhotosForPlot,
  loadEvidenceForPlot: mocks.loadEvidenceForPlot,
}));

import { buildMediaRestoreServerPlotIds, countPendingServerMediaRestore } from './serverMediaRestorePlan';

const localPlot = {
  id: 'local-1',
  farmerId: 'farmer-1',
  name: 'Plot A',
  createdAt: 1,
  areaSquareMeters: 1000,
  areaHectares: 0.1,
  kind: 'polygon' as const,
  points: [{ latitude: 1, longitude: 2 }],
  landTenureDeclared: true,
  noDeforestationDeclared: true,
};

describe('countPendingServerMediaRestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPhotosForPlot.mockResolvedValue([]);
    mocks.fetchPlotSyncedEvidence.mockResolvedValue([]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([]);
  });

  it('does not flag producer evidence already stored under profile scope', async () => {
    mocks.fetchPlotSyncedEvidence.mockResolvedValue([
      {
        id: 'doc-1',
        evidence_kind: 'fpic_repository',
        file_storage_key: 'user/farmer-1/fpic/doc.pdf',
        mime_type: 'application/pdf',
        updated_at: '2026-06-19T12:00:00.000Z',
      },
      {
        id: 'doc-2',
        evidence_kind: 'labor_evidence',
        file_storage_key: 'user/farmer-1/labor/doc.pdf',
        mime_type: 'application/pdf',
        updated_at: '2026-06-19T12:00:00.000Z',
      },
    ]);
    mocks.loadEvidenceForPlot.mockImplementation(async (plotId: string) => {
      if (plotId === 'profile:farmer-1') {
        return [
          {
            id: 1,
            plotId: 'profile:farmer-1',
            kind: 'fpic_repository',
            uri: 'file:///fpic.pdf',
            mimeType: 'application/pdf',
            label: 'FPIC',
            takenAt: 1,
            storagePath: 'user/farmer-1/fpic/doc.pdf',
          },
          {
            id: 2,
            plotId: 'profile:farmer-1',
            kind: 'labor_evidence',
            uri: 'file:///labor.pdf',
            mimeType: 'application/pdf',
            label: 'Labor',
            takenAt: 2,
            storagePath: 'user/farmer-1/labor/doc.pdf',
          },
        ];
      }
      return [];
    });
    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);

    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'farmer-1',
      localPlots: [localPlot],
      auditRows: [],
      backendPlots: [{ id: 'server-1', client_plot_id: 'local-1' }],
      plotServerLinks: { 'local-1': 'server-1' },
    });

    expect(missing).toBe(0);
    expect(mocks.loadEvidenceForPlot).toHaveBeenCalledWith('profile:farmer-1');
  });

  it('does not flag land-title audit photos when local title count already matches', async () => {
    mocks.loadTitlePhotosForPlot.mockResolvedValue([
      { id: 1, plotId: 'local-1', uri: 'file:///camera/title-a.jpg', takenAt: 1_700_000_000_000 },
      { id: 2, plotId: 'local-1', uri: 'file:///camera/title-b.jpg', takenAt: 1_700_000_100_000 },
    ]);
    mocks.loadEvidenceForPlot.mockResolvedValue([]);

    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'farmer-1',
      localPlots: [localPlot],
      auditRows: [
        {
          id: 'evt-1',
          event_type: 'plot_photos_synced',
          timestamp: '2026-06-19T12:00:00.000Z',
          payload: {
            plotId: 'server-1',
            kind: 'land_title',
            photos: [
              {
                storagePath: 'farmer/plot/title-a.jpg',
                uri: 'https://example.com/title-a.jpg',
                takenAt: 1_700_000_000_000,
              },
              {
                storagePath: 'farmer/plot/title-b.jpg',
                uri: 'https://example.com/title-b.jpg',
                takenAt: 1_700_000_100_000,
              },
            ],
          },
        },
      ],
      backendPlots: [{ id: 'server-1', client_plot_id: 'local-1' }],
      plotServerLinks: { 'local-1': 'server-1' },
    });

    expect(missing).toBe(0);
  });

  it('counts genuinely missing evidence on the correct scope', async () => {
    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);
    mocks.loadEvidenceForPlot.mockResolvedValue([]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([
      { storage_path: 'farmer/plot/title-a.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
      { storage_path: 'farmer/plot/title-b.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
    ]);

    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'farmer-1',
      localPlots: [localPlot],
      auditRows: [],
      backendPlots: [{ id: 'server-1', client_plot_id: 'local-1' }],
      plotServerLinks: { 'local-1': 'server-1' },
    });

    expect(missing).toBe(2);
  });

  it('does not flag tenure land titles when local title count already matches (generic uris)', async () => {
    mocks.loadTitlePhotosForPlot.mockResolvedValue([
      { id: 1, plotId: 'local-1', uri: 'file:///var/mobile/restore-111.jpg', takenAt: 1_700_000_000_000 },
      { id: 2, plotId: 'local-1', uri: 'file:///var/mobile/restore-222.jpg', takenAt: 1_700_000_100_000 },
    ]);
    mocks.loadEvidenceForPlot.mockResolvedValue([]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([
      { storage_path: 'farmer/plot/uuid-a.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
      { storage_path: 'farmer/plot/uuid-b.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
    ]);

    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'farmer-1',
      localPlots: [localPlot],
      auditRows: [],
      backendPlots: [{ id: 'server-1', client_plot_id: 'local-1' }],
      plotServerLinks: { 'local-1': 'server-1' },
    });

    expect(missing).toBe(0);
  });

  it('returns 0 when audit rows are null (parity skips measured media gap)', async () => {
    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'farmer-1',
      localPlots: [localPlot],
      auditRows: null,
      backendPlots: [{ id: 'server-1', client_plot_id: 'local-1' }],
      plotServerLinks: { 'local-1': 'server-1' },
    });

    expect(missing).toBe(0);
    expect(mocks.fetchPlotSyncedEvidence).not.toHaveBeenCalled();
  });
});

describe('buildMediaRestoreServerPlotIds', () => {
  it('skips server plots with no resolvable on-device plot', () => {
    const ids = buildMediaRestoreServerPlotIds({
      localPlots: [localPlot],
      plotServerLinks: { 'local-1': 'server-1' },
      backendPlots: [
        { id: 'server-1', client_plot_id: 'local-1' },
        { id: 'server-orphan', client_plot_id: 'missing-local-9999999999999' },
      ],
    });

    expect(ids).toEqual(new Set(['server-1']));
  });
});

describe('countPendingServerMediaRestore rekey suffix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPhotosForPlot.mockResolvedValue([]);
    mocks.fetchPlotSyncedEvidence.mockResolvedValue([]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([]);
  });

  it('measures tenure gap against the rekeyed local plot id', async () => {
    const localPlotId = 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168';
    const serverPlotId = '686b9ff6-acf7-40ff-9bb0-2d96f060bb78';
    const staleClientPlotId = '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168';

    mocks.loadTitlePhotosForPlot.mockResolvedValue([]);
    mocks.loadEvidenceForPlot.mockResolvedValue([]);
    mocks.fetchPlotTenureVerification.mockResolvedValue([
      { storage_path: 'farmer/plot/title-a.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
      { storage_path: 'farmer/plot/title-b.jpg', mime_type: 'image/jpeg', evidence_label: 'title' },
    ]);

    const missing = await countPendingServerMediaRestore({
      apiFarmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
      localPlots: [
        {
          ...localPlot,
          id: localPlotId,
          farmerId: 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17',
        },
      ],
      auditRows: [],
      backendPlots: [{ id: serverPlotId, client_plot_id: staleClientPlotId }],
      plotServerLinks: { [localPlotId]: serverPlotId },
    });

    expect(missing).toBe(2);
    expect(mocks.loadTitlePhotosForPlot).toHaveBeenCalledWith(localPlotId);
  });
});
