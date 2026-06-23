import { postAuditEventToBackend } from '@/features/api/audit';
import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import {
  deletePendingSyncAction,
  enqueuePendingSync,
  getSetting,
  loadPendingSyncActions,
  setSetting,
  type PendingSyncAction,
} from '@/features/state/persistence';
import { pendingSyncDedupKey } from '@/features/sync/pendingSyncDedup';

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

async function deletePendingSyncByDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): Promise<void> {
  const key = pendingSyncDedupKey(actionType, payloadJson);
  if (!key) return;
  const rows = await loadPendingSyncActions().catch(() => []);
  const match = rows.find(
    (row) =>
      row.actionType === actionType &&
      pendingSyncDedupKey(row.actionType, row.payloadJson) === key,
  );
  if (match) await deletePendingSyncAction(match.id).catch(() => undefined);
}

/** Queue any field-app cloud audit row; posts immediately when signed in. */
export async function queueFieldCloudAuditSync(params: {
  eventType: string;
  scopeId: string;
  payload: Record<string, unknown>;
}): Promise<QueueFieldCloudAuditResult> {
  const eventType = params.eventType.trim();
  const scopeId = params.scopeId.trim();
  if (!eventType || !scopeId) return 'queued';

  await clearFieldCloudAuditSyncedMarker({ eventType, scopeId });

  const payloadJson = JSON.stringify({
    eventType,
    payload: params.payload,
  });
  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: null,
  });

  if (!hasSyncAuthSession()) return 'queued';

  const result = await postAuditEventToBackend({
    eventType,
    payload: params.payload,
  });
  if (result.ok) {
    await deletePendingSyncByDedupKey('audit_sync', payloadJson);
    await markFieldCloudAuditSynced({ eventType, scopeId });
    return 'synced';
  }

  await enqueuePendingSync({
    createdAt: Date.now(),
    actionType: 'audit_sync',
    payloadJson,
    lastError: result.message ?? result.reason,
  });
  return 'queued';
}
