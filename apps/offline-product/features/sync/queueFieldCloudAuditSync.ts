import { postAuditEventToBackend } from '@/features/api/audit';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { invalidateAuditFetchCache } from '@/features/sync/fetchMergedAuditEventsForFarmer';
import { pendingSyncDedupKey } from '@/features/sync/pendingSyncDedup';
import {
  deletePendingSyncAction,
  enqueuePendingSync,
  getSetting,
  loadPendingSyncActions,
  markPendingSyncAttempt,
  setSetting,
  type PendingSyncAction,
} from '@/features/state/persistence';

export type QueueFieldCloudAuditResult = 'synced' | 'queued';

function auditSyncedSettingKey(eventType: string, scopeId: string): string {
  return `audit_cloud_synced:${eventType.trim()}:${scopeId.trim()}`;
}

export async function isFieldCloudAuditSynced(params: {
  eventType: string;
  scopeId: string;
}): Promise<boolean> {
  const marker = await getSetting(auditSyncedSettingKey(params.eventType, params.scopeId)).catch(
    () => null,
  );
  return Boolean(marker?.trim());
}

export async function markFieldCloudAuditSynced(params: {
  eventType: string;
  scopeId: string;
}): Promise<void> {
  await setSetting(auditSyncedSettingKey(params.eventType, params.scopeId), String(Date.now())).catch(
    () => undefined,
  );
}

async function clearFieldCloudAuditSyncedMarker(params: {
  eventType: string;
  scopeId: string;
}): Promise<void> {
  await setSetting(auditSyncedSettingKey(params.eventType, params.scopeId), '').catch(
    () => undefined,
  );
}

async function findPendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<PendingSyncAction | undefined> {
  const key = pendingSyncDedupKey(actionType, payloadJson);
  if (!key) return undefined;
  const rows = await loadPendingSyncActions().catch(() => []);
  return rows.find(
    (row) =>
      row.actionType === actionType &&
      pendingSyncDedupKey(row.actionType, row.payloadJson) === key,
  );
}

async function deletePendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<void> {
  const match = await findPendingSyncByDedupKey(actionType, payloadJson);
  if (match) await deletePendingSyncAction(match.id).catch(() => undefined);
}

async function ensurePendingFieldCloudAuditRow(payloadJson: string): Promise<PendingSyncAction> {
  const existing = await findPendingSyncByDedupKey('audit_sync', payloadJson);
  if (existing) return existing;

  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: null,
  });

  const created = await findPendingSyncByDedupKey('audit_sync', payloadJson);
  if (!created) {
    throw new Error('Failed to enqueue field cloud audit sync row');
  }
  return created;
}

/** Queue a field-app cloud audit row; optional immediate POST when signed in. */
export async function queueFieldCloudAuditSync(params: {
  eventType: string;
  scopeId: string;
  payload: Record<string, unknown>;
  /** Sync now drains the queue — skip an extra POST before the drain pass. */
  deferPost?: boolean;
  /** Skip queue work when the device marker shows a prior successful upload. */
  skipIfSynced?: boolean;
}): Promise<QueueFieldCloudAuditResult> {
  const eventType = params.eventType.trim();
  const scopeId = params.scopeId.trim();
  if (!eventType || !scopeId) return 'queued';

  if (params.skipIfSynced && (await isFieldCloudAuditSynced({ eventType, scopeId }))) {
    return 'synced';
  }

  await clearFieldCloudAuditSyncedMarker({ eventType, scopeId });

  const payloadJson = JSON.stringify({
    eventType,
    payload: params.payload,
  });

  if (params.deferPost || !hasSyncAuthSession()) {
    await ensurePendingFieldCloudAuditRow(payloadJson);
    return 'queued';
  }

  const result = await postAuditEventToBackend({
    eventType,
    payload: params.payload,
  });
  if (result.ok) {
    await deletePendingSyncByDedupKey('audit_sync', payloadJson);
    await markFieldCloudAuditSynced({ eventType, scopeId });
    invalidateAuditFetchCache();
    return 'synced';
  }

  const row = await ensurePendingFieldCloudAuditRow(payloadJson);
  await markPendingSyncAttempt(row.id, {
    attempts: row.attempts ?? 0,
    lastError: result.message ?? result.reason ?? 'Field cloud audit sync failed',
    lastAttemptAt: Date.now(),
  });
  return 'queued';
}
