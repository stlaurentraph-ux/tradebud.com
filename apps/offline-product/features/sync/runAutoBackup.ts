import type { Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  type ProcessPendingSyncQueueResult,
} from '@/features/sync/processPendingSyncQueue';
import { prepareFieldSyncContext } from '@/features/sync/resolveFieldSyncScope';
import { type UploadUnsyncedPlotsResult } from '@/features/sync/plotServerSync';
import { openFieldSyncSession } from '@/features/sync/runFieldSyncSession';
import { runFieldSyncPipeline } from '@/features/sync/runFieldSyncPipeline';
import {
  evaluateConservativeAutoBackup,
  recordAutoBackupAttempt,
  recordAutoBackupOutcome,
  summarizeAutoBackupError,
} from '@/features/sync/autoBackupPolicy';
import { withSyncQueueLock, setSyncQueuePhase } from '@/features/sync/syncQueueMutex';
import {
  SYNC_BACKGROUND_OPERATION_MS,
  SyncOperationTimeoutError,
  withSyncOperationTimeout,
} from '@/features/sync/syncOperationLimits';
import { emitSyncOperationOutcome } from '@/features/sync/syncOperationOutcome';
import type { TranslateFn } from '@/features/i18n/translate';

const QUEUE_ACTION_TYPES = ['harvest', 'photos_sync', 'evidence_sync', 'audit_sync'] as const;
const CONSENT_ACTION_TYPES: PendingSyncAction['actionType'][] = [
  'consent_approve',
  'consent_deny',
  'consent_revoke',
];
const ALL_AUTO_BACKUP_ACTION_TYPES: PendingSyncAction['actionType'][] = [
  ...QUEUE_ACTION_TYPES,
  ...CONSENT_ACTION_TYPES,
];

const noopTranslate: TranslateFn = (key) => key;

function isConsentQueueActionType(actionType: PendingSyncAction['actionType']): boolean {
  return CONSENT_ACTION_TYPES.includes(actionType);
}

function emptyQueueResult(overrides?: Partial<ProcessPendingSyncQueueResult>): ProcessPendingSyncQueueResult {
  return {
    completed: 0,
    failedActions: 0,
    droppedInvalid: 0,
    fetchFailed: false,
    ...overrides,
  };
}

export type RunAutoBackupResult = {
  plotResult: UploadUnsyncedPlotsResult | null;
  queueResult: ProcessPendingSyncQueueResult;
  plotsRestored?: number;
  syncResultMessage?: string;
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
        if (!sessionOpened.ok) {
          return {
            plotResult: null,
            queueResult: emptyQueueResult({
              fetchFailed: true,
              firstError: sessionOpened.failure.message,
              syncFailure: sessionOpened.failure,
            }),
          };
        }

        try {
          const syncContext = await prepareFieldSyncContext({
            profileFarmerId: params.farmerId,
            localPlots: params.localPlots,
          });
          const farmerId = syncContext.farmerId;
          const selectedQueueActionTypes = params.skipQueueDrain
            ? [...CONSENT_ACTION_TYPES]
            : [...ALL_AUTO_BACKUP_ACTION_TYPES];

          const pipeline = await runFieldSyncPipeline({
            accessToken: sessionOpened.session.accessToken,
            apiFarmerId: farmerId,
            farmerScopeIds: syncContext.ownedFarmerIds,
            syncFarmer: {
              id: farmerId,
              role: 'farmer',
              selfDeclared: false,
              name: params.farmerDisplayName,
            },
            syncPlots: params.localPlots,
            t: noopTranslate,
            selectedQueueActionTypes,
            allQueueActionTypes: ALL_AUTO_BACKUP_ACTION_TYPES,
            syncDrainActionTypes: [...QUEUE_ACTION_TYPES],
            consentActionTypes: CONSENT_ACTION_TYPES,
            isConsentQueueActionType,
            maxQueuePasses: 2,
            onPhase: setSyncQueuePhase,
          });

          const queueResult = emptyQueueResult({
            completed: pipeline.outcome.queueCompleted ?? 0,
            failedActions: pipeline.outcome.queueFailed ?? 0,
            fetchFailed: pipeline.outcome.queueFetchFailed === true,
            firstError: pipeline.queueFirstError,
            syncFailure: pipeline.outcome.syncFailure,
          });

          return {
            plotResult: pipeline.lastPlotUploadResult,
            queueResult,
            plotsRestored: pipeline.plotsRestored,
            syncResultMessage: pipeline.syncResultMessage,
          };
        } finally {
          sessionOpened.end();
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
