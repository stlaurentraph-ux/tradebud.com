import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasSyncAuthSession: vi.fn(() => true),
  loadAppState: vi.fn(),
  prepareFieldSyncContext: vi.fn(),
  restoreCloudMediaFromServer: vi.fn(),
  restoreLocalDeliveryReceiptsFromServer: vi.fn(),
  hydrateLocalSyncMarkersFromServer: vi.fn(async () => ({
    declarationProducerMarked: false,
    declarationPlotsMarked: 0,
    fieldCloudMarked: 0,
    mediaMarked: 0,
    receiptsReconciled: 0,
    inboundScopesMarked: 0,
    fetchFailed: false,
  })),
  pruneRedundantPendingUploadActions: vi.fn(async () => 0),
  emitServerPlotSyncChanged: vi.fn(),
  withFieldSyncSession: vi.fn(),
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  hasSyncAuthSession: mocks.hasSyncAuthSession,
}));

vi.mock('@/features/state/persistence', () => ({
  loadAppState: mocks.loadAppState,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  prepareFieldSyncContext: mocks.prepareFieldSyncContext,
}));

vi.mock('@/features/sync/restoreCloudMediaFromServer', () => ({
  restoreCloudMediaFromServer: mocks.restoreCloudMediaFromServer,
}));

vi.mock('@/features/sync/restoreLocalDeliveryReceiptsFromServer', () => ({
  restoreLocalDeliveryReceiptsFromServer: mocks.restoreLocalDeliveryReceiptsFromServer,
}));

vi.mock('@/features/sync/hydrateLocalSyncMarkersFromServer', () => ({
  hydrateLocalSyncMarkersFromServer: mocks.hydrateLocalSyncMarkersFromServer,
}));

vi.mock('@/features/sync/pruneRedundantPendingUploadActions', () => ({
  pruneRedundantPendingUploadActions: mocks.pruneRedundantPendingUploadActions,
}));

vi.mock('@/features/sync/plotServerSync', () => ({
  emitServerPlotSyncChanged: mocks.emitServerPlotSyncChanged,
}));

vi.mock('@/features/sync/runFieldSyncSession', () => ({
  withFieldSyncSession: mocks.withFieldSyncSession,
}));

vi.mock('@/features/sync/syncQueueMutex', () => ({
  getSyncQueueLockSnapshot: vi.fn(() => ({ locked: false, phase: 'idle', lockStartedAt: null, waitingSince: null, waiterCount: 0 })),
}));

import { getSyncQueueLockSnapshot } from '@/features/sync/syncQueueMutex';
import { restoreCloudStateOnFocus } from './restoreCloudStateOnFocus';

describe('restoreCloudStateOnFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSyncQueueLockSnapshot).mockReturnValue({
      locked: false,
      phase: 'idle',
      lockStartedAt: null,
      waitingSince: null,
      waiterCount: 0,
    });
    mocks.hasSyncAuthSession.mockReturnValue(true);
    mocks.withFieldSyncSession.mockImplementation(async (fn: () => Promise<unknown>) => ({
      ok: true,
      value: await fn(),
    }));
    mocks.loadAppState.mockResolvedValue({
      farmer: { id: 'farmer-1', name: 'Ada', role: 'farmer' },
      plots: [{ id: 'plot-1', farmerId: 'farmer-1', name: 'Plot 1', createdAt: 1, areaSquareMeters: 1000, areaHectares: 0.1, kind: 'point', points: [{ latitude: 1, longitude: 2 }] }],
    });
    mocks.prepareFieldSyncContext.mockResolvedValue({
      farmerId: 'server-farmer-1',
      ownedFarmerIds: ['server-farmer-1'],
      rekeyed: false,
    });
    mocks.restoreCloudMediaFromServer.mockResolvedValue({
      activePlots: [{ id: 'plot-1', farmerId: 'farmer-1', name: 'Plot 1', createdAt: 1, areaSquareMeters: 1000, areaHectares: 0.1, kind: 'point', points: [{ latitude: 1, longitude: 2 }] }],
      plotsRestored: 0,
      declarationsRestored: 0,
      evidenceRestored: 1,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      devicePreferencesRestored: false,
      profilePhotoRestored: false,
      mappingDraftRestored: false,
      offlinePacksQueued: 0,
      fetchFailed: false,
      downloadFailed: 0,
    });
    mocks.restoreLocalDeliveryReceiptsFromServer.mockResolvedValue({
      restoredCount: 2,
      reconciledCount: 0,
      fetchFailed: false,
      skippedUnlinked: 0,
      vouchers: [],
    });
  });

  it('returns null when not signed in', async () => {
    mocks.hasSyncAuthSession.mockReturnValue(false);
    await expect(restoreCloudStateOnFocus({ force: true })).resolves.toBeNull();
  });

  it('returns null while sync queue lock is held', async () => {
    vi.mocked(getSyncQueueLockSnapshot).mockReturnValue({
      locked: true,
      phase: 'processing_queue',
      lockStartedAt: Date.now(),
      waitingSince: null,
      waiterCount: 0,
    });
    await expect(restoreCloudStateOnFocus({ force: true })).resolves.toBeNull();
    expect(mocks.withFieldSyncSession).not.toHaveBeenCalled();
  });

  it('pulls media and receipts then emits sync changed when restored', async () => {
    const result = await restoreCloudStateOnFocus({ force: true });
    expect(result?.totalRestored).toBe(3);
    expect(mocks.restoreCloudMediaFromServer).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeclarations: true }),
    );
    expect(mocks.restoreLocalDeliveryReceiptsFromServer).toHaveBeenCalled();
    expect(mocks.emitServerPlotSyncChanged).toHaveBeenCalledTimes(1);
  });
});
