import { beforeEach, describe, expect, it, vi } from 'vitest';

const enqueuePendingSync = vi.fn(async () => undefined);
const loadPhotosForPlot = vi.fn(async () => []);
const loadTitlePhotosForPlot = vi.fn(async () => []);
const loadEvidenceForPlot = vi.fn(async () => []);
const loadPlotCadastralKey = vi.fn(async () => null);
const loadPlotTenure = vi.fn(async () => ({ informalTenure: false, informalTenureNote: null }));
const loadLocalDeliveryReceiptsForFarmer = vi.fn(async () => []);
const loadPendingSyncActions = vi.fn(async () => []);

vi.mock('@/features/sync/queueDeclarationAuditSync', () => ({
  enqueuePendingDeclarationAuditsForDevice: vi.fn(async () => ({ producer: false, plots: 0 })),
}));

vi.mock('@/features/state/persistence', () => ({
  enqueuePendingSync,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  loadPlotCadastralKey,
  loadPlotTenure,
  loadLocalDeliveryReceiptsForFarmer,
  loadPendingSyncActions,
  isPlotTitlePhotoPendingUpload: (photo: { storagePath?: string | null }) =>
    !photo.storagePath?.trim(),
}));

describe('enqueuePlotDependentSyncActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queues ground truth, land title, evidence, and harvest for a linked plot', async () => {
    loadPhotosForPlot.mockResolvedValueOnce([
      { id: 1, plotId: 'local-1', uri: 'file:///gt.jpg', takenAt: 1 },
    ]);
    loadTitlePhotosForPlot.mockResolvedValueOnce([
      { id: 2, plotId: 'local-1', uri: 'file:///title.jpg', takenAt: 2 },
    ]);
    loadEvidenceForPlot.mockResolvedValueOnce([
      {
        id: 3,
        plotId: 'local-1',
        kind: 'tenure_evidence',
        uri: 'file:///doc.pdf',
        mimeType: 'application/pdf',
        label: 'Title deed',
        takenAt: 3,
      },
    ]);
    loadLocalDeliveryReceiptsForFarmer.mockResolvedValueOnce([
      {
        id: 'harvest-local-1-99',
        farmerId: 'farmer-1',
        localPlotId: 'local-1',
        serverPlotId: null,
        kg: 120,
        recordedAt: 99,
        qrCodeRef: null,
        pendingSync: true,
        buyerLabel: 'Buyer',
        plotName: 'Plot 1',
      },
    ]);

    const { enqueuePlotDependentSyncActions } = await import('./enqueuePlotDependentSyncActions');
    const result = await enqueuePlotDependentSyncActions({
      localPlotId: 'local-1',
      farmerId: 'farmer-1',
    });

    expect(result).toEqual({
      groundTruth: true,
      landTitle: true,
      evidence: true,
      harvests: 1,
    });
    expect(enqueuePendingSync).toHaveBeenCalledTimes(4);
    expect(enqueuePendingSync.mock.calls.map(([row]) => row.actionType)).toEqual([
      'photos_sync',
      'photos_sync',
      'evidence_sync',
      'harvest',
    ]);
  });

  it('skips harvest rows already present in the pending queue', async () => {
    loadPendingSyncActions.mockResolvedValueOnce([
      {
        id: 1,
        createdAt: 1,
        hlcTimestamp: '1',
        actionType: 'harvest',
        payloadJson: JSON.stringify({
          clientEventId: 'harvest-local-1-99',
          plotId: 'local-1',
          kg: 120,
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
      },
    ]);
    loadLocalDeliveryReceiptsForFarmer.mockResolvedValueOnce([
      {
        id: 'harvest-local-1-99',
        farmerId: 'farmer-1',
        localPlotId: 'local-1',
        serverPlotId: null,
        kg: 120,
        recordedAt: 99,
        qrCodeRef: null,
        pendingSync: true,
        buyerLabel: 'Buyer',
        plotName: 'Plot 1',
      },
    ]);

    const { enqueuePlotDependentSyncActions } = await import('./enqueuePlotDependentSyncActions');
    const result = await enqueuePlotDependentSyncActions({
      localPlotId: 'local-1',
      farmerId: 'farmer-1',
    });

    expect(result.harvests).toBe(0);
    expect(enqueuePendingSync).not.toHaveBeenCalled();
  });

  it('skips land title queue when title photos already uploaded', async () => {
    loadTitlePhotosForPlot.mockResolvedValueOnce([
      {
        id: 2,
        plotId: 'local-1',
        uri: 'https://signed.example/title.jpg',
        takenAt: 2,
        storagePath: 'user/plot/land_title/title-2',
      },
    ]);

    const { enqueuePlotDependentSyncActions } = await import('./enqueuePlotDependentSyncActions');
    const result = await enqueuePlotDependentSyncActions({
      localPlotId: 'local-1',
      farmerId: 'farmer-1',
    });

    expect(result.landTitle).toBe(false);
    expect(enqueuePendingSync).not.toHaveBeenCalled();
  });
});
