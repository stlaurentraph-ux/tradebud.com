import type { Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  processPendingSyncQueue,
  type PendingSyncAttemptScope,
  type ProcessPendingSyncQueueResult,
} from '@/features/sync/processPendingSyncQueue';

/** Run multiple queue passes for Settings Sync now (evidence uploads + backoff bypass). */
export async function drainPendingSyncQueueForManualSync(params: {
  farmerId: string;
  localPlots: Plot[];
  farmerScopeIds?: string[];
  actionTypes?: PendingSyncAction['actionType'][];
  attemptScope?: PendingSyncAttemptScope;
  maxPasses?: number;
  maxActionsPerPass?: number;
  accessToken?: string;
}): Promise<ProcessPendingSyncQueueResult> {
  const maxPasses = params.maxPasses ?? 4;
  const merged: ProcessPendingSyncQueueResult = {
    completed: 0,
    failedActions: 0,
    droppedInvalid: 0,
    fetchFailed: false,
  };

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const res = await processPendingSyncQueue({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
      farmerScopeIds: params.farmerScopeIds,
      actionTypes: params.actionTypes,
      attemptScope: params.attemptScope ?? 'all',
      maxActions: params.maxActionsPerPass,
      ignoreBackoff: true,
      accessToken: params.accessToken,
    });

    merged.completed += res.completed;
    merged.failedActions += res.failedActions;
    merged.droppedInvalid += res.droppedInvalid;
    if (res.firstError && !merged.firstError) {
      merged.firstError = res.firstError;
    }
    if (res.fetchFailed) {
      merged.fetchFailed = res.fetchFailed;
    }

    const madeProgress = res.completed > 0 || res.droppedInvalid > 0;
    if (!madeProgress) {
      break;
    }
  }

  return merged;
}
