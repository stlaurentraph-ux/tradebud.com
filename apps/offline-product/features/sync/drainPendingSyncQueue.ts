import type { Plot } from '@/features/state/AppStateContext';
import type { PendingSyncAction } from '@/features/state/persistence';
import {
  MANUAL_SYNC_AUDIT_ACTION_TYPES,
  MANUAL_SYNC_UPLOAD_ACTION_TYPES,
} from '@/features/sync/pendingSyncQueuePriority';
import {
  processPendingSyncQueue,
  type PendingSyncAttemptScope,
  type ProcessPendingSyncQueueResult,
} from '@/features/sync/processPendingSyncQueue';

function mergePass(
  merged: ProcessPendingSyncQueueResult,
  res: ProcessPendingSyncQueueResult,
): void {
  merged.completed += res.completed;
  merged.failedActions += res.failedActions;
  merged.droppedInvalid += res.droppedInvalid;
  if (res.firstError && !merged.firstError) {
    merged.firstError = res.firstError;
  }
  if (res.syncFailure && !merged.syncFailure) {
    merged.syncFailure = res.syncFailure;
  }
  if (res.fetchFailed) {
    merged.fetchFailed = res.fetchFailed;
  }
}

async function drainActionTypesForManualSync(params: {
  farmerId: string;
  localPlots: Plot[];
  farmerScopeIds?: string[];
  actionTypes: PendingSyncAction['actionType'][];
  attemptScope?: PendingSyncAttemptScope;
  maxPasses: number;
  maxActionsPerPass?: number;
  accessToken?: string;
}): Promise<ProcessPendingSyncQueueResult> {
  const merged: ProcessPendingSyncQueueResult = {
    completed: 0,
    failedActions: 0,
    droppedInvalid: 0,
    fetchFailed: false,
  };

  for (let pass = 0; pass < params.maxPasses; pass += 1) {
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

    mergePass(merged, res);

    if (res.syncFailure?.cause === 'rate_limit') {
      break;
    }

    const madeProgress = res.completed > 0 || res.droppedInvalid > 0;
    if (!madeProgress) {
      break;
    }
  }

  return merged;
}

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
  const requested = params.actionTypes ?? [
    ...MANUAL_SYNC_UPLOAD_ACTION_TYPES,
    ...MANUAL_SYNC_AUDIT_ACTION_TYPES,
  ];
  const requestedSet = new Set(requested);
  const uploadTypes = MANUAL_SYNC_UPLOAD_ACTION_TYPES.filter((type) => requestedSet.has(type));
  const auditTypes = MANUAL_SYNC_AUDIT_ACTION_TYPES.filter((type) => requestedSet.has(type));
  const otherTypes = requested.filter(
    (type) => !uploadTypes.includes(type as (typeof uploadTypes)[number]) && !auditTypes.includes(type as (typeof auditTypes)[number]),
  );

  const merged: ProcessPendingSyncQueueResult = {
    completed: 0,
    failedActions: 0,
    droppedInvalid: 0,
    fetchFailed: false,
  };

  // Declarations first — avoid burning the write rate limit on uploads/restore reads.
  for (const actionTypes of [auditTypes, otherTypes]) {
    if (actionTypes.length === 0) continue;
    mergePass(
      merged,
      await drainActionTypesForManualSync({
        ...params,
        actionTypes,
        maxPasses,
      }),
    );
    if (merged.syncFailure?.cause === 'rate_limit') {
      return merged;
    }
  }

  if (uploadTypes.length > 0) {
    mergePass(
      merged,
      await drainActionTypesForManualSync({
        ...params,
        actionTypes: uploadTypes,
        maxPasses,
      }),
    );
  }

  return merged;
}
