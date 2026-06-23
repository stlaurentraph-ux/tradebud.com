import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import {
  mapPlotUploadErrorMessage,
  mapSyncActionErrorMessage,
} from '@/features/errors/mapApiErrorToUserMessage';
import type { TranslateFn } from '@/features/i18n/translate';
import { drainPendingSyncQueueForManualSync } from '@/features/sync/drainPendingSyncQueue';
import { enqueuePlotDependentSyncForLinkedPlots } from '@/features/sync/enqueuePlotDependentSyncActions';
import { enqueueFarmerCloudSyncActions } from '@/features/sync/enqueueFarmerCloudSyncActions';
import {
  formatSyncNowUserMessage,
  type SyncNowUserOutcome,
} from '@/features/sync/formatSyncNowUserMessage';
import { measureTotalSyncPending } from '@/features/sync/measureTotalSyncPending';
import {
  processPendingSyncQueue,
  type PendingSyncAttemptScope,
} from '@/features/sync/processPendingSyncQueue';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
import {
  uploadUnsyncedPlotsForFarmer,
  warmPlotServerLinksForSync,
  type UploadUnsyncedPlotsResult,
} from '@/features/sync/plotServerSync';
import { restoreLocalPlotsFromServer } from '@/features/sync/restoreLocalPlotsFromServer';
import { pruneRedundantPendingUploadActions } from '@/features/sync/pruneRedundantPendingUploadActions';
import { restoreLocalDeliveryReceiptsFromServer } from '@/features/sync/restoreLocalDeliveryReceiptsFromServer';
import { restoreFarmerCloudState } from '@/features/sync/restoreFarmerCloudState';
import { reconcileUnuploadedLocalDeliveryReceipts } from '@/features/harvest/reconcileUnuploadedLocalDeliveryReceipts';
import { backfillServerHarvestDatesFromLocal } from '@/features/harvest/backfillServerHarvestDatesFromLocal';
import { reportSyncFailure, reportSyncStepStart } from '@/features/sync/reportSyncFailure';
import { emitServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';
import type { SyncQueuePhase } from '@/features/sync/syncQueueMutex';
import { classifyPlotListFailure, classifySyncFailure } from '@/features/sync/syncFailure';
import { resolveSyncReachFailedShortMessage } from '@/features/sync/syncReachabilityMessage';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import type { FieldSyncMode } from '@/features/sync/resolveFieldSyncMode';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export type FieldSyncPipelineParams = {
  accessToken: string;
  apiFarmerId: string;
  farmerScopeIds: string[];
  syncFarmer: FarmerProfile;
  syncPlots: Plot[];
  t: TranslateFn;
  /**
   * full: pull from cloud then push pending work (sign-in, parity restore, empty refresh).
   * push_only: incremental upload — warm links, prune, enqueue, drain queue only.
   */
  syncMode?: FieldSyncMode;
  /** When empty, all queue action types are considered selected. */
  selectedQueueActionTypes: PendingSyncAction['actionType'][];
  allQueueActionTypes: PendingSyncAction['actionType'][];
  syncDrainActionTypes: PendingSyncAction['actionType'][];
  consentActionTypes: PendingSyncAction['actionType'][];
  isConsentQueueActionType: (actionType: PendingSyncAction['actionType']) => boolean;
  queueSmartSweepEnabled?: boolean;
  queueSmartSweepCap?: number;
  /** Manual sync uses 4 passes; conservative auto-backup uses 2. */
  maxQueuePasses?: number;
  onPhase?: (phase: SyncQueuePhase) => void;
};

export type FieldSyncPipelineResult = {
  outcome: SyncNowUserOutcome;
  plotUploadFirstError?: string;
  queueFirstError?: string;
  lastPlotUploadResult: UploadUnsyncedPlotsResult | null;
  /** Farmer-facing message from {@link formatSyncNowUserMessage} + land-doc reminder handled by caller. */
  syncResultMessage: string;
  skipQueueDrain: boolean;
  stoppedForAuth?: boolean;
  /** Plots merged from server during restore — caller should reload local state when > 0. */
  plotsRestored?: number;
};

function mergeQueueResult(
  outcome: SyncNowUserOutcome,
  queueRes: Awaited<ReturnType<typeof processPendingSyncQueue>>,
): void {
  if (
    queueRes.fetchFailed &&
    queueRes.completed === 0 &&
    queueRes.failedActions === 0 &&
    queueRes.droppedInvalid === 0
  ) {
    outcome.queueFetchFailed = true;
    if (queueRes.syncFailure) {
      outcome.syncFailure = queueRes.syncFailure;
    }
    return;
  }
  outcome.queueCompleted = (outcome.queueCompleted ?? 0) + queueRes.completed;
  outcome.queueFailed = (outcome.queueFailed ?? 0) + queueRes.failedActions;
  if (queueRes.syncFailure && !outcome.syncFailure) {
    outcome.syncFailure = queueRes.syncFailure;
  }
}

function reportPlotUploadFailure(
  error: unknown,
  context: Record<string, unknown>,
): void {
  reportSyncFailure(
    classifySyncFailure({
      error,
      step: 'plot_upload',
    }),
    context,
  );
}

/**
 * Runs plot upload + queue drain inside an already-open field sync session.
 * Token verification and plot-fetch de-duplication belong to {@link openFieldSyncSession}.
 */
export async function runFieldSyncPipeline(
  params: FieldSyncPipelineParams,
): Promise<FieldSyncPipelineResult> {
  const {
    accessToken,
    apiFarmerId,
    farmerScopeIds,
    syncFarmer,
    syncPlots,
    t,
    selectedQueueActionTypes,
    allQueueActionTypes,
    syncDrainActionTypes,
    isConsentQueueActionType,
    queueSmartSweepEnabled = false,
    queueSmartSweepCap = 100,
    maxQueuePasses = 4,
    onPhase,
    syncMode = 'full',
  } = params;

  const setPhase = (phase: SyncQueuePhase) => {
    onPhase?.(phase);
  };

  const outcome: SyncNowUserOutcome = { syncMode };
  let plotUploadFirstError: string | undefined;
  let skipQueueDrain = false;

  let activePlots = syncPlots;
  let plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
  let backendPlotsForReceipts: unknown[] = [];

  if (syncMode === 'full') {
    setPhase('restoring_plots');
    reportSyncStepStart('plot_list', { phase: 'restore', plotCount: syncPlots.length });
    const restoreResult = await restoreLocalPlotsFromServer({
      apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
      localPlots: syncPlots,
    });
    if (restoreResult.restoredCount > 0) {
      activePlots = restoreResult.mergedPlots;
      outcome.plotsRestored = restoreResult.restoredCount;
      invalidateServerPlotListCache();
    }
    if (restoreResult.fetchFailed) {
      outcome.plotsFetchFailed = true;
    }

    // Reconcile local↔server plot ids before pulling receipts, evidence, or declarations.
    await warmPlotServerLinksForSync({
      farmerId: apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
      localPlots: activePlots,
    });

    const receiptRestoreResult = await restoreLocalDeliveryReceiptsFromServer({
      apiFarmerId,
      profileFarmerId: syncFarmer.id,
      ownedFarmerIds: farmerScopeIds,
      localPlots: activePlots,
    });
    if (receiptRestoreResult.restoredCount > 0) {
      outcome.receiptsRestored = receiptRestoreResult.restoredCount;
    }
    if (receiptRestoreResult.fetchFailed) {
      outcome.plotsFetchFailed = true;
    }

    plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
    backendPlotsForReceipts = await fetchBackendPlotsForSyncScope({
      farmerId: apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
    }).catch(() => []);
    const receiptReconcileResult = await reconcileUnuploadedLocalDeliveryReceipts({
      farmerId: syncFarmer.id,
      localPlots: activePlots,
      backendPlots: backendPlotsForReceipts,
      plotServerLinks,
      vouchers: receiptRestoreResult.fetchFailed ? undefined : receiptRestoreResult.vouchers,
    }).catch(() => ({ requeuedCount: 0, unmatchedCount: 0, fetchFailed: true }));
    if (receiptReconcileResult.requeuedCount > 0) {
      outcome.receiptsRequeued = receiptReconcileResult.requeuedCount;
    }

    const cloudRestoreResult = await restoreFarmerCloudState({
      apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
      localFarmer: syncFarmer,
      localPlots: activePlots,
    });
    if (cloudRestoreResult.declarationsRestored > 0) {
      outcome.declarationsRestored = cloudRestoreResult.declarationsRestored;
    }
    if (cloudRestoreResult.groundTruthRestored > 0) {
      outcome.groundTruthPhotosRestored = cloudRestoreResult.groundTruthRestored;
    }
    if (cloudRestoreResult.evidenceRestored > 0) {
      outcome.evidenceRestored = cloudRestoreResult.evidenceRestored;
    }
    if (cloudRestoreResult.fetchFailed) {
      outcome.evidenceFetchFailed = true;
      outcome.declarationsFetchFailed = true;
    }
    if (cloudRestoreResult.downloadFailed > 0) {
      outcome.evidenceDownloadFailed = cloudRestoreResult.downloadFailed;
    }
  } else {
    setPhase('processing_queue');
    reportSyncStepStart('queue', { phase: 'push_only' });
    await warmPlotServerLinksForSync({
      farmerId: apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
      localPlots: activePlots,
    }).catch(() => undefined);
    plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
  }

  await pruneRedundantPendingUploadActions({ farmerId: apiFarmerId }).catch(() => 0);

  reportSyncStepStart('plot_upload', { plotCount: activePlots.length });
  await warmPlotServerLinksForSync({
    farmerId: apiFarmerId,
    ownedFarmerIds: farmerScopeIds,
    localPlots: activePlots,
  });

  const selectedTypes =
    selectedQueueActionTypes.length > 0 ? selectedQueueActionTypes : allQueueActionTypes;
  const queueDrainTypes = selectedTypes.filter((actionType) =>
    syncDrainActionTypes.includes(actionType),
  );
  const shouldProcessConsent = selectedTypes.some(isConsentQueueActionType);

  setPhase(activePlots.length > 0 ? 'uploading_plots' : 'processing_queue');

  let lastPlotUploadResult: UploadUnsyncedPlotsResult | null = null;
  if (syncMode === 'push_only') {
    outcome.plotsAlreadySynced = true;
  } else if (activePlots.length === 0) {
    outcome.plotsNone = true;
  } else {
    let syncRes = await uploadUnsyncedPlotsForFarmer({
      farmerId: apiFarmerId,
      ownedFarmerIds: farmerScopeIds,
      localPlots: activePlots,
      farmerDisplayName: syncFarmer?.name?.trim() || undefined,
      t,
      surface: 'settings',
    });
    if (!syncRes.fetchFailed && syncRes.unsyncedBefore === 0) {
      const verifyBeforeQueue = await measureTotalSyncPending({
        farmerId: apiFarmerId,
        ownedFarmerIds: farmerScopeIds,
        plots: activePlots,
        isSignedIn: true,
        forcePlotFetch: true,
      });
      if (verifyBeforeQueue.unsyncedPlotCount > 0) {
        syncRes = await uploadUnsyncedPlotsForFarmer({
          farmerId: apiFarmerId,
          ownedFarmerIds: farmerScopeIds,
          localPlots: activePlots,
          farmerDisplayName: syncFarmer?.name?.trim() || undefined,
          t,
          surface: 'settings',
        });
      }
    }
    if (syncRes.stoppedForAuth) {
      reportSyncFailure(
        classifySyncFailure({ error: 'sign_in_session_expired', step: 'plot_upload' }),
        { source: 'plot_upload' },
      );
      return {
        outcome,
        lastPlotUploadResult: syncRes,
        syncResultMessage: '',
        skipQueueDrain: true,
        stoppedForAuth: true,
        plotsRestored: outcome.plotsRestored,
      };
    }
    if (syncRes.fetchFailed) {
      outcome.plotsFetchFailed = true;
      plotUploadFirstError = syncRes.firstError;
      const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
      const plotsMissingServerLink = activePlots.filter(
        (plot) => !plotServerLinks[plot.id]?.trim(),
      );
      skipQueueDrain = plotsMissingServerLink.length > 0;
      if (plotUploadFirstError) {
        reportSyncFailure(classifyPlotListFailure(plotUploadFirstError), { source: 'plot_upload' });
      }
    } else if (syncRes.unsyncedBefore === 0) {
      outcome.plotsAlreadySynced = true;
    } else if (syncRes.uploaded === syncRes.unsyncedBefore) {
      outcome.plotsUploadedAll = {
        uploaded: syncRes.uploaded,
        total: syncRes.unsyncedBefore,
      };
    } else {
      outcome.plotsPartial = {
        uploaded: syncRes.uploaded,
        total: syncRes.unsyncedBefore,
        failed: syncRes.failed,
      };
      plotUploadFirstError = syncRes.firstError;
      skipQueueDrain = true;
      if (plotUploadFirstError) {
        reportPlotUploadFailure(plotUploadFirstError, { source: 'plot_upload' });
      }
    }
    lastPlotUploadResult = syncRes;
  }

  if (activePlots.length > 0) {
    const plotServerLinks = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
    await enqueuePlotDependentSyncForLinkedPlots({
      farmerId: apiFarmerId,
      farmer: syncFarmer,
      plots: activePlots,
      plotServerLinks,
    }).catch(() => undefined);
  }

  let queueFirstError: string | undefined;

  if (shouldProcessConsent) {
    setPhase('processing_consent');
    reportSyncStepStart('queue', { phase: 'consent' });
    const consentRes = await processPendingConsentQueue();
    outcome.queueCompleted = (outcome.queueCompleted ?? 0) + consentRes.completed;
    outcome.queueFailed = (outcome.queueFailed ?? 0) + consentRes.failedActions;
  }

  if (queueDrainTypes.length > 0 && !skipQueueDrain) {
    setPhase('processing_queue');
    reportSyncStepStart('queue', { actionTypes: queueDrainTypes.join(',') });
    if (__DEV__ && queueSmartSweepEnabled) {
      const retryingPass = await processPendingSyncQueue({
        farmerId: apiFarmerId,
        localPlots: activePlots,
        farmerScopeIds,
        actionTypes: queueDrainTypes,
        attemptScope: 'retrying_only' satisfies PendingSyncAttemptScope,
        maxActions: queueSmartSweepCap,
        ignoreBackoff: true,
        accessToken,
      });
      mergeQueueResult(outcome, retryingPass);
      if (retryingPass.firstError) queueFirstError = retryingPass.firstError;
      const firstPassProcessed =
        retryingPass.completed + retryingPass.failedActions + retryingPass.droppedInvalid;
      const remainingBudget = Math.max(0, queueSmartSweepCap - firstPassProcessed);
      if (!retryingPass.fetchFailed && remainingBudget > 0) {
        const firstAttemptPass = await processPendingSyncQueue({
          farmerId: apiFarmerId,
          localPlots: activePlots,
          farmerScopeIds,
          actionTypes: queueDrainTypes,
          attemptScope: 'first_attempt_only' satisfies PendingSyncAttemptScope,
          maxActions: remainingBudget,
          ignoreBackoff: true,
          accessToken,
        });
        mergeQueueResult(outcome, firstAttemptPass);
        if (firstAttemptPass.firstError) queueFirstError = firstAttemptPass.firstError;
      }
    } else {
      const queueRes = await drainPendingSyncQueueForManualSync({
        farmerId: apiFarmerId,
        localPlots: activePlots,
        farmerScopeIds,
        actionTypes: queueDrainTypes,
        attemptScope: 'all',
        maxPasses: maxQueuePasses,
        accessToken,
      });
      mergeQueueResult(outcome, queueRes);
      if (queueRes.firstError) queueFirstError = queueRes.firstError;
    }
  }

  if (syncMode !== 'push_only') {
    await enqueueFarmerCloudSyncActions(syncFarmer).catch(() => undefined);
  }

  if (syncMode === 'full') {
    const dateBackfillResult = await backfillServerHarvestDatesFromLocal({
      farmerId: syncFarmer.id,
      localPlots: activePlots,
      backendPlots: backendPlotsForReceipts,
      plotServerLinks,
    }).catch(() => ({ updatedCount: 0, vouchers: [] as unknown[] }));
    if (dateBackfillResult.updatedCount > 0) {
      outcome.receiptsRestored = (outcome.receiptsRestored ?? 0) + dateBackfillResult.updatedCount;
    }
  }

  invalidateServerPlotListCache();
  const pendingAfter = await measureTotalSyncPending({
    farmerId: apiFarmerId,
    ownedFarmerIds: farmerScopeIds,
    plots: activePlots,
    isSignedIn: true,
    forcePlotFetch: syncMode === 'full',
  });
  outcome.remainingPending = pendingAfter.total;
  outcome.unsyncedPlotCount = pendingAfter.unsyncedPlotCount;
  outcome.blockedPlotCount = pendingAfter.blockedPlotCount;
  outcome.unsyncedPlotNames = pendingAfter.unsyncedPlotNames;
  outcome.blockedPlots = pendingAfter.blockedPlots;
  outcome.queuePendingCount = pendingAfter.queuePendingCount;
  if (pendingAfter.plotsFetchFailed) {
    outcome.plotsFetchFailed = true;
  }

  const syncApiBaseUrl = getTracebudApiBaseUrl();
  const errored =
    outcome.remainingPending > 0
      ? (await loadPendingSyncActions().catch(() => [])).find(
          (row) => typeof row.lastError === 'string' && row.lastError.trim().length > 0,
        )
      : undefined;
  const queuePending = pendingAfter.queuePendingCount ?? 0;
  const plotHint = plotUploadFirstError
    ? mapPlotUploadErrorMessage(plotUploadFirstError, t, { surface: 'settings' })
    : undefined;
  const queueRowHint = errored?.lastError
    ? mapSyncActionErrorMessage(errored.lastError, t, 'settings', {
        actionType: errored.actionType,
      })
    : undefined;
  const queuePassHint = queueFirstError
    ? mapSyncActionErrorMessage(queueFirstError, t, 'settings')
    : undefined;
  outcome.failureReason =
    queuePending > 0 && (queueRowHint ?? queuePassHint)
      ? (queueRowHint ?? queuePassHint)
      : (plotHint ?? queueRowHint ?? queuePassHint);
  if (
    !outcome.failureReason?.trim() &&
    pendingAfter.plotsFetchFailed &&
    pendingAfter.unsyncedPlotCount > 0
  ) {
    outcome.failureReason = resolveSyncReachFailedShortMessage(t, syncApiBaseUrl);
  } else if (
    !outcome.failureReason?.trim() &&
    pendingAfter.unsyncedPlotCount > 0 &&
    plotUploadFirstError
  ) {
    outcome.failureReason = mapPlotUploadErrorMessage(plotUploadFirstError, t, {
      surface: 'settings',
    });
  } else if (!outcome.failureReason?.trim() && pendingAfter.blockedPlots.length === 1) {
    const block = pendingAfter.blockedPlots[0];
    outcome.failureReason =
      block.code === 'GEO-105'
        ? `${block.message} ${t('geo_quality_overlap_upload_support')}`
        : block.message;
    if (block.code === 'GEO-105') {
      outcome.supportMailto = block.supportMailto;
    }
  } else if (!outcome.failureReason?.trim() && pendingAfter.unsyncedPlotCount > 0) {
    const names = pendingAfter.unsyncedPlotNames.filter(Boolean).join(', ');
    if (lastPlotUploadResult?.unsyncedBefore === 0) {
      outcome.failureReason = names
        ? t('settings_sync_plot_not_confirmed_on_server', { names })
        : t('settings_sync_plot_upload_not_attempted');
    }
  }

  const syncResultMessage = formatSyncNowUserMessage(outcome, t);

  trackEvent(ANALYTICS_EVENTS.SYNC_RUN_COMPLETED, {
    syncMode,
    queueCompleted: outcome.queueCompleted ?? 0,
    queueFailed: outcome.queueFailed ?? 0,
    remainingPending: outcome.remainingPending ?? 0,
    plotsRestored: outcome.plotsRestored ?? 0,
    skipQueueDrain,
  });

  // Refresh Harvests / My Plots after every completed sync, including restore-only runs.
  emitServerPlotSyncChanged();

  return {
    outcome,
    plotUploadFirstError,
    queueFirstError,
    lastPlotUploadResult,
    syncResultMessage,
    skipQueueDrain,
    plotsRestored: outcome.plotsRestored,
  };
}
