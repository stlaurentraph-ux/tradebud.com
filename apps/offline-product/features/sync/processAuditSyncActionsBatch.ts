import type { PendingSyncAction } from '@/features/state/persistence';
import {
  deletePendingSyncAction,
  logAuditEvent,
  markPendingSyncAttempt,
} from '@/features/state/persistence';
import {
  postAuditEventsBatchToBackend,
  type PostAuditEventResult,
} from '@/features/api/audit';
import { invalidateAuditFetchCache } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import {
  isDeclarationAuditSynced,
  markDeclarationAuditSynced,
} from '@/features/sync/queueDeclarationAuditSync';
import {
  isFieldCloudAuditSynced,
  markFieldCloudAuditSynced,
} from '@/features/sync/queueFieldCloudAuditSync';
import {
  classifyQueueSyncFailure,
  type SyncFailure,
} from '@/features/sync/syncFailure';
import { reportSyncFailure } from '@/features/sync/reportSyncFailure';
import { MAX_AUDIT_BATCH_API_SIZE } from '@/features/sync/auditSyncLimits';

export type ProcessAuditSyncBatchResult = {
  completed: number;
  failedActions: number;
  droppedInvalid: number;
  firstError?: string;
  syncFailure?: SyncFailure;
  rateLimited: boolean;
};

type ParsedAuditAction = {
  row: PendingSyncAction;
  eventType: string;
  auditPayload: Record<string, unknown>;
  clientEventId: string;
  scopeId: string;
};

function parseAuditAction(row: PendingSyncAction): ParsedAuditAction | 'drop' | 'skip_synced' {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(row.payloadJson) as Record<string, unknown>;
  } catch {
    return 'drop';
  }
  const eventType = String(payload?.eventType ?? '').trim();
  const auditPayload = payload?.payload;
  if (
    !eventType ||
    !auditPayload ||
    typeof auditPayload !== 'object' ||
    Array.isArray(auditPayload)
  ) {
    return 'drop';
  }
  const auditPayloadObj = auditPayload as Record<string, unknown>;
  const scopeId = String(auditPayloadObj.farmerId ?? '').trim();
  return {
    row,
    eventType,
    auditPayload: auditPayloadObj,
    clientEventId: `pending-sync-${row.id}`,
    scopeId,
  };
}

async function markSynced(parsed: ParsedAuditAction): Promise<void> {
  await markDeclarationAuditSynced({
    eventType: parsed.eventType,
    payload: parsed.auditPayload,
  });
  invalidateAuditFetchCache();
  if (parsed.scopeId) {
    await markFieldCloudAuditSynced({ eventType: parsed.eventType, scopeId: parsed.scopeId });
  }
}

export async function processAuditSyncActionsBatch(params: {
  actions: PendingSyncAction[];
}): Promise<ProcessAuditSyncBatchResult> {
  const result: ProcessAuditSyncBatchResult = {
    completed: 0,
    failedActions: 0,
    droppedInvalid: 0,
    rateLimited: false,
  };

  const pending: ParsedAuditAction[] = [];
  for (const row of params.actions) {
    const parsed = parseAuditAction(row);
    if (parsed === 'drop') {
      await deletePendingSyncAction(row.id);
      result.droppedInvalid += 1;
      continue;
    }
    if (parsed === 'skip_synced') {
      continue;
    }
    const alreadyDeclaration = await isDeclarationAuditSynced({
      eventType: parsed.eventType,
      payload: parsed.auditPayload,
    }).catch(() => false);
    const alreadyCloud =
      parsed.scopeId.length > 0
        ? await isFieldCloudAuditSynced({
            eventType: parsed.eventType,
            scopeId: parsed.scopeId,
          }).catch(() => false)
        : false;
    if (alreadyDeclaration || alreadyCloud) {
      await deletePendingSyncAction(row.id);
      result.completed += 1;
      continue;
    }
    pending.push(parsed);
  }

  if (pending.length === 0) {
    return result;
  }

  for (let offset = 0; offset < pending.length; offset += MAX_AUDIT_BATCH_API_SIZE) {
    const chunk = pending.slice(offset, offset + MAX_AUDIT_BATCH_API_SIZE);
    const batchResult = await postAuditEventsBatchToBackend(
      chunk.map((item) => ({
        eventType: item.eventType,
        payload: item.auditPayload,
        clientEventId: item.clientEventId,
      })),
    );

    if (!batchResult.ok) {
      const failure = classifyQueueSyncFailure({
        error: batchResult.message ?? batchResult.reason,
        actionType: 'audit_sync',
      });
      result.failedActions += chunk.length;
      result.firstError = result.firstError ?? failure.message;
      result.syncFailure = result.syncFailure ?? failure;
      result.rateLimited = batchResult.reason === 'server_error' && failure.cause === 'rate_limit';
      for (const item of chunk) {
        await markPendingSyncAttempt(item.row.id, {
          attempts: (item.row.attempts ?? 0) + 1,
          lastError: failure.message,
          lastAttemptAt: Date.now(),
        });
        reportSyncFailure(failure, {
          pendingSyncId: item.row.id,
          source: 'sync_queue',
          actionType: 'audit_sync',
        });
      }
      break;
    }

    for (let i = 0; i < chunk.length; i += 1) {
      const item = chunk[i]!;
      const rowResult = batchResult.results[i] as PostAuditEventResult | undefined;
      // A 200 with a short/empty/malformed `results` array must NOT be treated as success — that
      // would delete the queue row while the server may never have stored the audit event
      // (silent data loss for declarations / field cloud audit). Retry instead.
      if (!rowResult || !rowResult.ok) {
        result.failedActions += 1;
        const failure = classifyQueueSyncFailure({
          error: rowResult
            ? rowResult.message ?? rowResult.reason
            : 'Audit batch response missing per-event result.',
          actionType: 'audit_sync',
        });
        result.firstError = result.firstError ?? failure.message;
        result.syncFailure = result.syncFailure ?? failure;
        await markPendingSyncAttempt(item.row.id, {
          attempts: (item.row.attempts ?? 0) + 1,
          lastError: failure.message,
          lastAttemptAt: Date.now(),
        });
        continue;
      }
      await markSynced(item);
      await deletePendingSyncAction(item.row.id);
      await logAuditEvent({
        eventType: 'sync_queue_action_succeeded',
        payload: {
          pendingSyncId: item.row.id,
          actionType: 'audit_sync',
          attemptsBeforeSuccess: item.row.attempts ?? 0,
          batched: true,
        },
      }).catch(() => undefined);
      result.completed += 1;
    }
  }

  return result;
}
