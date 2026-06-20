import type { Plot } from '@/features/state/AppStateContext';
import { loadPlotServerLinks } from '@/features/state/persistence';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
import { drainPendingSyncQueueForManualSync } from '@/features/sync/drainPendingSyncQueue';
import {
  type ProcessPendingSyncQueueResult,
} from '@/features/sync/processPendingSyncQueue';
import { prepareFieldSyncContext } from '@/features/sync/resolveFieldSyncScope';
import {
  uploadUnsyncedPlotsForFarmer,
  warmPlotServerLinksForSync,
  type UploadUnsyncedPlotsResult,
} from '@/features/sync/plotServerSync';
import { enqueuePlotDependentSyncForLinkedPlots } from '@/features/sync/enqueuePlotDependentSyncActions';
import { openFieldSyncSession } from '@/features/sync/runFieldSyncSession';
import {
  evaluateConservativeAutoBackup,
  recordAutoBackupAttempt,
  recordAutoBackupOutcome,
  summarizeAutoBackupError,
} from '@/features/sync/autoBackupPolicy';
import { setSyncQueuePhase, withSyncQueueLock } from '@/features/sync/syncQueueMutex';
import {
  SYNC_BACKGROUND_OPERATION_MS,
  SyncOperationTimeoutError,
  withSyncOperationTimeout,
} from '@/features/sync/syncOperationLimits';
import { emitSyncOperationOutcome } from '@/features/sync/syncOperationOutcome';

const QUEUE_ACTION_TYPES = ['harvest', 'photos_sync', 'evidence_sync', 'audit_sync'] as const;

export type RunAutoBackupResult = {
  plotResult: UploadUnsyncedPlotsResult | null;
  queueResult: ProcessPendingSyncQueueResult;
};

/** Upload unsynced plots and optionally drain the offline queue (harvests, photos, documents). */
export async function runAutoBackup(params: {
  farmerId: string;
  localPlots: Plot[];
  farmerDisplayName?: string;
  /** When true, uploads plots + consent only — skips harvest/photo/evidence queue drain. */
  skipQueueDrain?: boolean;
}): Promise<RunAutoBackupResult> {
  try {
    return await withSyncQueueLock(async () => {
      const work = (async () => {
        const sessionOpened = await openFieldSyncSession();
        try {
        const syncAccess = sessionOpened.ok
          ? { ok: true as const, token: sessionOpened.session.accessToken }
          : { ok: false as const, reason: 'network' as const };
        const syncContext = await prepareFieldSyncContext({
          profileFarmerId: params.farmerId,
          localPlots: params.localPlots,
        });
        const farmerId = syncContext.farmerId;

        setSyncQueuePhase(
          params.localPlots.length > 0 ? 'uploading_plots' : 'processing_consent',
        );
        let plotResult: UploadUnsyncedPlotsResult | null = null;
        if (params.localPlots.length > 0) {
          setSyncQueuePhase('uploading_plots');
          plotResult = await uploadUnsyncedPlotsForFarmer({
            farmerId,
            localPlots: params.localPlots,
            farmerDisplayName: params.farmerDisplayName,
          });

          await warmPlotServerLinksForSync({
            farmerId,
            ownedFarmerIds: syncContext.ownedFarmerIds,
            localPlots: params.localPlots,
          });
          const plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
          await enqueuePlotDependentSyncForLinkedPlots({
            farmerId,
            plots: params.localPlots,
            plotServerLinks,
          }).catch(() => undefined);
        }
        setSyncQueuePhase('processing_consent');
        await processPendingConsentQueue();

        let queueResult: ProcessPendingSyncQueueResult = {
          completed: 0,
          failedActions: 0,
          droppedInvalid: 0,
          fetchFailed: false,
        };
        if (!params.skipQueueDrain) {
          setSyncQueuePhase('processing_queue');
          queueResult = await drainPendingSyncQueueForManualSync({
            farmerId,
            localPlots: params.localPlots,
            farmerScopeIds: syncContext.ownedFarmerIds,
            actionTypes: [...QUEUE_ACTION_TYPES],
            attemptScope: 'all',
            maxPasses: 2,
            accessToken: syncAccess.ok ? syncAccess.token : undefined,
          });
        }
        return { plotResult, queueResult };
        } finally {
          if (sessionOpened.ok) {
            sessionOpened.end();
          }
        }
      })();
      return withSyncOperationTimeout(work, SYNC_BACKGROUND_OPERATION_MS);
    });
  } catch (e) {
    if (e instanceof SyncOperationTimeoutError) {
      emitSyncOperationOutcome({ kind: 'timeout', source: 'background' });
    }
    throw e;
  }
}

/**
 * Background auto-backup: only when local work exists, throttle window elapsed,
 * and not in failure backoff. Skips queue drain when rows repeat the same error.
 */
export async function runConservativeAutoBackup(params: {
  farmerId: string;
  localPlots: Plot[];
}): Promise<RunAutoBackupResult | null> {
  const { gate, skipQueueDrain } = await evaluateConservativeAutoBackup({
    plots: params.localPlots,
  });
  if (!gate.allowed) {
    return null;
  }

  recordAutoBackupAttempt();
  try {
    const result = await runAutoBackup({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
      skipQueueDrain,
    });
    const plotFailed =
      (result.plotResult?.failed ?? 0) > 0 ||
      result.plotResult?.fetchFailed === true ||
      result.plotResult?.stoppedForAuth === true;
    const queueFailed = result.queueResult.failedActions > 0 || result.queueResult.fetchFailed;
    const success = !plotFailed && !queueFailed;
    recordAutoBackupOutcome({
      success,
      errorSignature: success
        ? undefined
        : summarizeAutoBackupError({
            plotFirstError: result.plotResult?.firstError,
            queueFirstError: result.queueResult.firstError,
            queueFailedActions: result.queueResult.failedActions,
          }),
    });
    return result;
  } catch (e) {
    recordAutoBackupOutcome({
      success: false,
      errorSignature: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
