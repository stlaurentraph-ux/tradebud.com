import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasSyncAuthSession: vi.fn(() => true),
  loadAppState: vi.fn(),
  prepareFieldSyncContext: vi.fn(),
  probeFieldSyncInboundChanges: vi.fn(),
  persistFieldSyncCursorFromDelta: vi.fn(async () => undefined),
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
  trackEvent: vi.fn(),
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

vi.mock('@/features/sync/fieldSyncCursor', () => ({
  probeFieldSyncInboundChanges: mocks.probeFieldSyncInboundChanges,
  persistFieldSyncCursorFromDelta: mocks.persistFieldSyncCursorFromDelta,
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
  getSyncQueueLockSnapshot: vi.fn(() => ({
    locked: false,
    phase: 'idle',
    lockStartedAt: null,
    waitingSince: null,
    waiterCount: 0,
  })),
}));

vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: {
    FIELD_SYNC_DELTA_SKIPPED: 'field_sync_delta_skipped',
    FIELD_SYNC_INCREMENTAL_RESTORE: 'field_sync_incremental_restore',
  },
  trackEvent: mocks.trackEvent,
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
    mocks.withFieldSyncSession.mockImplementation(
      async (fn: (session: { accessToken: string }) => Promise<unknown>) => ({
        ok: true,
        value: await fn({ accessToken: 'token-1' }),
      }),
    );
    mocks.probeFieldSyncInboundChanges.mockResolvedValue({
      hasInboundChanges: true,
      hasCursor: false,
      delta: null,
      snapshot: null,
      changeSet: null,
      probeFailed: false,
    });
    mocks.loadAppState.mockResolvedValue({
      farmer: { id: 'farmer-1', name: 'Ada', role: 'farmer' },
      plots: [
        {
          id: 'plot-1',
          farmerId: 'farmer-1',
          name: 'Plot 1',
          createdAt: 1,
          areaSquareMeters: 1000,
          areaHectares: 0.1,
          kind: 'point',
          points: [{ latitude: 1, longitude: 2 }],
        },
      ],
    });
    mocks.prepareFieldSyncContext.mockResolvedValue({
      farmerId: 'server-farmer-1',
      ownedFarmerIds: ['server-farmer-1'],
      rekeyed: false,
    });
    mocks.restoreCloudMediaFromServer.mockResolvedValue({
      activePlots: [
        {
          id: 'plot-1',
          farmerId: 'farmer-1',
          name: 'Plot 1',
          createdAt: 1,
          areaSquareMeters: 1000,
          areaHectares: 0.1,
          kind: 'point',
          points: [{ latitude: 1, longitude: 2 }],
        },
      ],
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

  it('skips heavy restore when delta reports no inbound changes', async () => {
    mocks.probeFieldSyncInboundChanges.mockResolvedValue({
      hasInboundChanges: false,
      hasCursor: true,
      delta: { serverTime: '2026-06-24T12:00:00.000Z', farmers: [] },
      snapshot: { cursorMs: 1, auditByFarmer: {}, voucherFingerprint: '' },
      changeSet: null,
      probeFailed: false,
    });

    const result = await restoreCloudStateOnFocus({ force: true });
    expect(result?.skippedByDelta).toBe(true);
    expect(result?.totalRestored).toBe(0);
    expect(mocks.restoreCloudMediaFromServer).not.toHaveBeenCalled();
    expect(mocks.restoreLocalDeliveryReceiptsFromServer).not.toHaveBeenCalled();
    expect(mocks.emitServerPlotSyncChanged).not.toHaveBeenCalled();
    expect(mocks.trackEvent).toHaveBeenCalledWith('field_sync_delta_skipped', {
      surface: 'focus_pull',
    });
  });

  it('passes incremental restore scope when delta reports plot changes', async () => {
    mocks.probeFieldSyncInboundChanges.mockResolvedValue({
      hasInboundChanges: true,
      hasCursor: true,
      delta: { serverTime: '2026-06-24T12:00:00.000Z', farmers: [] },
      snapshot: { cursorMs: 1, auditByFarmer: {}, voucherFingerprint: '' },
      changeSet: {
        changedServerPlotIds: ['server-plot-1'],
        vouchersChanged: false,
        auditChangedFarmerIds: [],
      },
      probeFailed: false,
    });
    mocks.restoreCloudMediaFromServer.mockResolvedValue({
      activePlots: [],
      plotsRestored: 0,
      declarationsRestored: 0,
      evidenceRestored: 0,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      devicePreferencesRestored: false,
      profilePhotoRestored: false,
      mappingDraftRestored: false,
      offlinePacksQueued: 0,
      fetchFailed: false,
      downloadFailed: 0,
      incrementalRestore: true,
    });

    const result = await restoreCloudStateOnFocus({ force: true });
    expect(result?.incrementalRestore).toBe(true);
    expect(mocks.restoreCloudMediaFromServer).toHaveBeenCalledWith(
      expect.objectContaining({
        restoreScope: expect.objectContaining({
          restoreVouchers: false,
          restoreFarmerAuditArtifacts: false,
        }),
      }),
    );
    expect(mocks.trackEvent).toHaveBeenCalledWith('field_sync_incremental_restore', {
      surface: 'focus_pull',
    });
  });
});
