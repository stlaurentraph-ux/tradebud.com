import { beforeEach, describe, expect, it, vi } from 'vitest';

const restoreMocks = vi.hoisted(() => ({
  restoreLocalPlotsFromServer: vi.fn(),
  restoreLocalDeliveryReceiptsFromServer: vi.fn(),
  restoreFarmerCloudState: vi.fn(),
  uploadUnsyncedPlotsForFarmer: vi.fn(),
  drainPendingSyncQueueForManualSync: vi.fn(),
  enqueuePlotDependentSyncForLinkedPlots: vi.fn(),
  enqueueFarmerCloudSyncActions: vi.fn(),
  measureTotalSyncPending: vi.fn(),
  loadPendingSyncActions: vi.fn(),
  loadPlotServerLinks: vi.fn(),
  warmPlotServerLinksForSync: vi.fn(),
  pruneRedundantPendingUploadActions: vi.fn(),
  fetchBackendPlotsForSyncScope: vi.fn(),
  backfillServerHarvestDatesFromLocal: vi.fn(),
  restoreLinkedLocalPlotMediaFromServer: vi.fn(),
  hydrateLocalSyncMarkersFromServer: vi.fn(),
  restoreLocalDeclarationsFromServer: vi.fn(),
  loadAppState: vi.fn(),
}));

vi.mock('@/features/sync/processPendingSyncQueue', () => ({
  processPendingSyncQueue: vi.fn(),
}));

vi.mock('@/features/errors/mapApiErrorToUserMessage', () => ({
  mapPlotUploadErrorMessage: vi.fn((message: string) => message),
  mapSyncActionErrorMessage: vi.fn((message: string) => message),
}));

vi.mock('@/features/sync/formatSyncNowUserMessage', () => ({
  formatSyncNowUserMessage: vi.fn(() => 'sync-ok'),
}));

vi.mock('@/features/sync/syncReachabilityMessage', () => ({
  resolveSyncReachFailedShortMessage: vi.fn(() => 'reach-failed'),
}));

vi.mock('@/features/sync/restoreLocalPlotsFromServer', () => ({
  restoreLocalPlotsFromServer: restoreMocks.restoreLocalPlotsFromServer,
}));

vi.mock('@/features/sync/restoreLocalDeliveryReceiptsFromServer', () => ({
  restoreLocalDeliveryReceiptsFromServer: restoreMocks.restoreLocalDeliveryReceiptsFromServer,
}));

vi.mock('@/features/sync/restoreFarmerCloudState', () => ({
  restoreFarmerCloudState: restoreMocks.restoreFarmerCloudState,
}));

vi.mock('@/features/sync/plotServerSync', () => ({
  uploadUnsyncedPlotsForFarmer: restoreMocks.uploadUnsyncedPlotsForFarmer,
  warmPlotServerLinksForSync: restoreMocks.warmPlotServerLinksForSync,
  emitServerPlotSyncChanged: vi.fn(),
}));

vi.mock('@/features/sync/drainPendingSyncQueue', () => ({
  drainPendingSyncQueueForManualSync: restoreMocks.drainPendingSyncQueueForManualSync,
}));

vi.mock('@/features/sync/enqueuePlotDependentSyncActions', () => ({
  enqueuePlotDependentSyncForLinkedPlots: restoreMocks.enqueuePlotDependentSyncForLinkedPlots,
}));

vi.mock('@/features/sync/enqueueFarmerCloudSyncActions', () => ({
  enqueueFarmerCloudSyncActions: restoreMocks.enqueueFarmerCloudSyncActions,
}));

vi.mock('@/features/sync/measureTotalSyncPending', () => ({
  measureTotalSyncPending: restoreMocks.measureTotalSyncPending,
}));

vi.mock('@/features/sync/pruneRedundantPendingUploadActions', () => ({
  pruneRedundantPendingUploadActions: restoreMocks.pruneRedundantPendingUploadActions,
}));

vi.mock('@/features/sync/resolveFieldSyncScope', () => ({
  fetchBackendPlotsForSyncScope: restoreMocks.fetchBackendPlotsForSyncScope,
}));

vi.mock('@/features/harvest/reconcileUnuploadedLocalDeliveryReceipts', () => ({
  reconcileUnuploadedLocalDeliveryReceipts: vi.fn(async () => ({
    requeuedCount: 0,
    unmatchedCount: 0,
    fetchFailed: false,
  })),
}));

vi.mock('@/features/harvest/backfillServerHarvestDatesFromLocal', () => ({
  backfillServerHarvestDatesFromLocal: restoreMocks.backfillServerHarvestDatesFromLocal,
}));

vi.mock('@/features/sync/restoreLinkedLocalPlotMediaFromServer', () => ({
  restoreLinkedLocalPlotMediaFromServer: restoreMocks.restoreLinkedLocalPlotMediaFromServer,
}));

vi.mock('@/features/sync/restoreLocalDeclarationsFromServer', () => ({
  restoreLocalDeclarationsFromServer: restoreMocks.restoreLocalDeclarationsFromServer,
}));

vi.mock('@/features/sync/hydrateLocalSyncMarkersFromServer', () => ({
  hydrateLocalSyncMarkersFromServer: restoreMocks.hydrateLocalSyncMarkersFromServer,
}));

vi.mock('@/features/state/persistence', () => ({
  loadPendingSyncActions: restoreMocks.loadPendingSyncActions,
  loadPlotServerLinks: restoreMocks.loadPlotServerLinks,
  loadAppState: restoreMocks.loadAppState,
  getSetting: vi.fn(async () => null),
  setSetting: vi.fn(async () => undefined),
}));

const cursorMocks = vi.hoisted(() => ({
  persistFieldSyncCursorFromDelta: vi.fn(async () => undefined),
  persistFieldSyncCursorAfterPipeline: vi.fn(async () => undefined),
}));

vi.mock('@/features/sync/fieldSyncCursor', () => ({
  persistFieldSyncCursorFromDelta: cursorMocks.persistFieldSyncCursorFromDelta,
  persistFieldSyncCursorAfterPipeline: cursorMocks.persistFieldSyncCursorAfterPipeline,
}));

const markerMocks = vi.hoisted(() => ({
  resolveLinkedPlotMediaHydrationForSync: vi.fn(async () => false),
  areLinkedPlotMediaScopesHydrated: vi.fn(async () => false),
}));

vi.mock('@/features/sync/pushOnlyInboundMarkerState', () => ({
  areLinkedPlotMediaScopesHydrated: markerMocks.areLinkedPlotMediaScopesHydrated,
  resolveLinkedPlotMediaHydrationForSync: markerMocks.resolveLinkedPlotMediaHydrationForSync,
}));

vi.mock('@/features/sync/processPendingConsentQueue', () => ({
  processPendingConsentQueue: vi.fn(async () => ({
    completed: 0,
    failedActions: 0,
  })),
}));

vi.mock('@/features/sync/reportSyncFailure', () => ({
  reportSyncFailure: vi.fn(),
  reportSyncStepStart: vi.fn(),
}));

vi.mock('@/features/sync/serverPlotListCache', () => ({
  invalidateServerPlotListCache: vi.fn(),
}));

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

vi.mock('@/features/observability/analytics', () => ({
  ANALYTICS_EVENTS: { SYNC_RUN_COMPLETED: 'sync_run_completed' },
  trackEvent: vi.fn(),
}));

const t = (key: string) => key;

const completeFarmer = {
  id: 'farmer-local',
  name: 'Test Farmer',
  role: 'farmer' as const,
  selfDeclared: true,
  selfDeclaredAt: 1,
  fpicConsent: true,
  laborNoChildLabor: true,
  laborNoForcedLabor: true,
};

const completePlot = {
  id: 'plot-1',
  farmerId: 'farmer-local',
  name: 'Plot 1',
  createdAt: 1,
  areaSquareMeters: 10_000,
  areaHectares: 1,
  kind: 'polygon' as const,
  points: [],
  landTenureDeclared: true,
  noDeforestationDeclared: true,
};

const baseParams = {
  accessToken: 'token',
  apiFarmerId: 'farmer-api',
  farmerScopeIds: ['farmer-api'],
  // Intentionally NOT declaration-complete (no self-declaration / plot declaration flags) so the
  // pipeline treats push_only as "not idle" and still pulls declarations.
  syncFarmer: { id: 'farmer-local', name: 'Test Farmer', role: 'farmer' as const, selfDeclared: false },
  syncPlots: [
    {
      id: 'plot-1',
      farmerId: 'farmer-local',
      name: 'Plot 1',
      createdAt: 1,
      areaSquareMeters: 10_000,
      areaHectares: 1,
      kind: 'polygon' as const,
      points: [],
    },
  ],
  t,
  selectedQueueActionTypes: ['audit_sync' as const],
  allQueueActionTypes: ['audit_sync' as const],
  syncDrainActionTypes: ['audit_sync' as const],
  consentActionTypes: [],
  isConsentQueueActionType: () => false,
};

describe('runFieldSyncPipeline push_only observability guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerMocks.resolveLinkedPlotMediaHydrationForSync.mockResolvedValue(false);
    markerMocks.areLinkedPlotMediaScopesHydrated.mockResolvedValue(false);
    restoreMocks.loadPlotServerLinks.mockResolvedValue({ 'plot-1': 'server-plot-1' });
    restoreMocks.pruneRedundantPendingUploadActions.mockResolvedValue(0);
    restoreMocks.hydrateLocalSyncMarkersFromServer.mockResolvedValue({
      declarationProducerMarked: false,
      declarationPlotsMarked: 0,
      fieldCloudMarked: 0,
      mediaMarked: 0,
      receiptsReconciled: 0,
      inboundScopesMarked: 0,
      fetchFailed: false,
    });
    restoreMocks.warmPlotServerLinksForSync.mockResolvedValue(undefined);
    restoreMocks.enqueuePlotDependentSyncForLinkedPlots.mockResolvedValue(undefined);
    restoreMocks.enqueueFarmerCloudSyncActions.mockResolvedValue({
      devicePreferences: false,
      profilePhoto: false,
      mappingDraft: false,
    });
    restoreMocks.drainPendingSyncQueueForManualSync.mockResolvedValue({
      completed: 1,
      failedActions: 0,
      droppedInvalid: 0,
      fetchFailed: false,
    });
    restoreMocks.measureTotalSyncPending.mockResolvedValue({
      total: 0,
      unsyncedPlotCount: 0,
      blockedPlotCount: 0,
      unsyncedPlotNames: [],
      blockedPlots: [],
      queuePendingCount: 0,
      plotsFetchFailed: false,
    });
    restoreMocks.loadPendingSyncActions.mockResolvedValue([]);
    restoreMocks.restoreLinkedLocalPlotMediaFromServer.mockResolvedValue({
      evidenceRestored: 0,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
    });
    restoreMocks.restoreLocalDeclarationsFromServer.mockResolvedValue({
      producerRestored: false,
      plotsRestored: 0,
      legalRestored: 0,
      fetchFailed: false,
    });
    restoreMocks.loadAppState.mockResolvedValue({
      farmer: baseParams.syncFarmer,
      plots: baseParams.syncPlots,
    });
  });

  it('pulls declarations but skips full cloud restore when push_only is not idle', async () => {
    const { runFieldSyncPipeline } = await import('./runFieldSyncPipeline');

    await runFieldSyncPipeline({
      ...baseParams,
      syncMode: 'push_only',
    });

    expect(restoreMocks.restoreLocalPlotsFromServer).not.toHaveBeenCalled();
    expect(restoreMocks.restoreLocalDeliveryReceiptsFromServer).not.toHaveBeenCalled();
    expect(restoreMocks.restoreFarmerCloudState).not.toHaveBeenCalled();
    expect(restoreMocks.restoreLocalDeclarationsFromServer).toHaveBeenCalled();
    expect(restoreMocks.uploadUnsyncedPlotsForFarmer).not.toHaveBeenCalled();
    expect(restoreMocks.backfillServerHarvestDatesFromLocal).not.toHaveBeenCalled();
    expect(restoreMocks.enqueueFarmerCloudSyncActions).not.toHaveBeenCalled();
    expect(restoreMocks.drainPendingSyncQueueForManualSync).not.toHaveBeenCalled();
    expect(restoreMocks.restoreLinkedLocalPlotMediaFromServer).toHaveBeenCalledWith(
      expect.objectContaining({ includeAuditPhotos: false }),
    );
  });

  it('skips heavy push_only work when idle (queue empty, markers satisfied)', async () => {
    markerMocks.resolveLinkedPlotMediaHydrationForSync.mockResolvedValue(true);
    const { runFieldSyncPipeline } = await import('./runFieldSyncPipeline');

    await runFieldSyncPipeline({
      ...baseParams,
      syncFarmer: completeFarmer,
      syncPlots: [completePlot],
      syncMode: 'push_only',
    });

    expect(restoreMocks.restoreLocalDeclarationsFromServer).not.toHaveBeenCalled();
    expect(restoreMocks.hydrateLocalSyncMarkersFromServer).not.toHaveBeenCalled();
    expect(restoreMocks.enqueuePlotDependentSyncForLinkedPlots).not.toHaveBeenCalled();
    expect(restoreMocks.drainPendingSyncQueueForManualSync).not.toHaveBeenCalled();
    expect(restoreMocks.restoreLinkedLocalPlotMediaFromServer).not.toHaveBeenCalled();
  });

  it('runs cloud restore helpers when syncMode is full', async () => {
    restoreMocks.restoreLocalPlotsFromServer.mockResolvedValue({
      restoredCount: 0,
      mergedPlots: baseParams.syncPlots,
      fetchFailed: false,
    });
    restoreMocks.restoreLocalDeliveryReceiptsFromServer.mockResolvedValue({
      restoredCount: 0,
      fetchFailed: false,
      vouchers: [],
    });
    restoreMocks.restoreFarmerCloudState.mockResolvedValue({
      declarationsRestored: 0,
      groundTruthRestored: 0,
      evidenceRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
    });
    restoreMocks.fetchBackendPlotsForSyncScope.mockResolvedValue([]);
    restoreMocks.backfillServerHarvestDatesFromLocal.mockResolvedValue({
      updatedCount: 0,
      vouchers: [],
    });
    restoreMocks.uploadUnsyncedPlotsForFarmer.mockResolvedValue({
      fetchFailed: false,
      unsyncedBefore: 0,
      uploaded: 0,
      failed: 0,
      stoppedForAuth: false,
    });

    const { runFieldSyncPipeline } = await import('./runFieldSyncPipeline');

    await runFieldSyncPipeline({
      ...baseParams,
      syncMode: 'full',
    });

    expect(restoreMocks.restoreLocalPlotsFromServer).toHaveBeenCalled();
    expect(restoreMocks.restoreLocalDeliveryReceiptsFromServer).toHaveBeenCalled();
    expect(restoreMocks.restoreFarmerCloudState).toHaveBeenCalled();
    expect(restoreMocks.enqueueFarmerCloudSyncActions).toHaveBeenCalled();
    expect(restoreMocks.restoreLinkedLocalPlotMediaFromServer).not.toHaveBeenCalled();
  });
});

describe('runFieldSyncPipeline cursor advance gating', () => {
  const setupFullRestoreMocks = () => {
    restoreMocks.restoreLocalPlotsFromServer.mockResolvedValue({
      restoredCount: 0,
      mergedPlots: baseParams.syncPlots,
      fetchFailed: false,
    });
    restoreMocks.restoreLocalDeliveryReceiptsFromServer.mockResolvedValue({
      restoredCount: 0,
      fetchFailed: false,
      vouchers: [],
    });
    restoreMocks.restoreFarmerCloudState.mockResolvedValue({
      declarationsRestored: 0,
      groundTruthRestored: 0,
      evidenceRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
    });
    restoreMocks.fetchBackendPlotsForSyncScope.mockResolvedValue([]);
    restoreMocks.backfillServerHarvestDatesFromLocal.mockResolvedValue({
      updatedCount: 0,
      vouchers: [],
    });
    restoreMocks.uploadUnsyncedPlotsForFarmer.mockResolvedValue({
      fetchFailed: false,
      unsyncedBefore: 0,
      uploaded: 0,
      failed: 0,
      stoppedForAuth: false,
    });
  };

  const cursorAdvanceCount = () =>
    cursorMocks.persistFieldSyncCursorFromDelta.mock.calls.length +
    cursorMocks.persistFieldSyncCursorAfterPipeline.mock.calls.length;

  beforeEach(() => {
    vi.clearAllMocks();
    markerMocks.resolveLinkedPlotMediaHydrationForSync.mockResolvedValue(false);
    markerMocks.areLinkedPlotMediaScopesHydrated.mockResolvedValue(false);
    restoreMocks.loadPlotServerLinks.mockResolvedValue({ 'plot-1': 'server-plot-1' });
    restoreMocks.pruneRedundantPendingUploadActions.mockResolvedValue(0);
    restoreMocks.hydrateLocalSyncMarkersFromServer.mockResolvedValue({
      declarationProducerMarked: false,
      declarationPlotsMarked: 0,
      fieldCloudMarked: 0,
      mediaMarked: 0,
      receiptsReconciled: 0,
      inboundScopesMarked: 0,
      fetchFailed: false,
    });
    restoreMocks.warmPlotServerLinksForSync.mockResolvedValue(undefined);
    restoreMocks.enqueuePlotDependentSyncForLinkedPlots.mockResolvedValue(undefined);
    restoreMocks.enqueueFarmerCloudSyncActions.mockResolvedValue({
      devicePreferences: false,
      profilePhoto: false,
      mappingDraft: false,
    });
    restoreMocks.measureTotalSyncPending.mockResolvedValue({
      total: 0,
      unsyncedPlotCount: 0,
      blockedPlotCount: 0,
      unsyncedPlotNames: [],
      blockedPlots: [],
      queuePendingCount: 0,
      plotsFetchFailed: false,
    });
    restoreMocks.restoreLinkedLocalPlotMediaFromServer.mockResolvedValue({
      evidenceRestored: 0,
      groundTruthRestored: 0,
      landTitleRestored: 0,
      fetchFailed: false,
      downloadFailed: 0,
    });
    restoreMocks.restoreLocalDeclarationsFromServer.mockResolvedValue({
      producerRestored: false,
      plotsRestored: 0,
      legalRestored: 0,
      fetchFailed: false,
    });
    restoreMocks.loadAppState.mockResolvedValue({
      farmer: baseParams.syncFarmer,
      plots: baseParams.syncPlots,
    });
    setupFullRestoreMocks();
  });

  it('advances the field sync cursor after a clean run with no queue failures', async () => {
    restoreMocks.loadPendingSyncActions.mockResolvedValue([]);
    restoreMocks.drainPendingSyncQueueForManualSync.mockResolvedValue({
      completed: 0,
      failedActions: 0,
      droppedInvalid: 0,
      fetchFailed: false,
    });

    const { runFieldSyncPipeline } = await import('./runFieldSyncPipeline');
    await runFieldSyncPipeline({ ...baseParams, syncMode: 'full' });

    expect(cursorAdvanceCount()).toBe(1);
  });

  it('does NOT advance the cursor when queue actions failed', async () => {
    // One audit_sync row is pending so the drain actually runs...
    restoreMocks.loadPendingSyncActions.mockResolvedValue([
      {
        id: 1,
        actionType: 'audit_sync',
        payloadJson: '{}',
        hlcTimestamp: '1:1',
        createdAt: 1,
        attempts: 0,
      },
    ] as never);
    // ...and it reports a failed action, which must hold the inbound cursor back.
    restoreMocks.drainPendingSyncQueueForManualSync.mockResolvedValue({
      completed: 0,
      failedActions: 1,
      droppedInvalid: 0,
      fetchFailed: false,
    });

    const { runFieldSyncPipeline } = await import('./runFieldSyncPipeline');
    const result = await runFieldSyncPipeline({ ...baseParams, syncMode: 'full' });

    expect(result.outcome.queueFailed).toBeGreaterThan(0);
    expect(cursorAdvanceCount()).toBe(0);
  });
});
