import type { PendingSyncAction } from '@/features/state/persistence';

/** Stable key so one logical upload does not spawn hundreds of queue rows. */
export function pendingSyncDedupKey(
  actionType: PendingSyncAction['actionType'],
  payloadJson: string,
): string | null {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (actionType === 'harvest') {
    const clientEventId =
      typeof payload.clientEventId === 'string' ? payload.clientEventId.trim() : '';
    if (clientEventId) return `harvest:${clientEventId}`;
    const plotId = String(payload.plotId ?? '');
    const kg = Number(payload.kg);
    if (plotId && Number.isFinite(kg)) return `harvest:${plotId}:${kg}`;
    return null;
  }

  if (actionType === 'evidence_sync') {
    if (payload.scope === 'producer') {
      const farmerId = String(payload.farmerId ?? '');
      const plotId = String(payload.plotId ?? '');
      return `evidence_sync:producer:${farmerId || plotId}`;
    }
    const plotId = String(payload.plotId ?? '');
    return plotId ? `evidence_sync:${plotId}` : null;
  }

  if (actionType === 'photos_sync') {
    const plotId = String(payload.plotId ?? '');
    const kind = String(payload.kind ?? 'ground_truth');
    return plotId ? `photos_sync:${plotId}:${kind}` : null;
  }

  if (
    actionType === 'consent_approve' ||
    actionType === 'consent_deny' ||
    actionType === 'consent_revoke'
  ) {
    const requestId = String(payload.requestId ?? payload.consentRequestId ?? '');
    return requestId ? `${actionType}:${requestId}` : null;
  }

  return null;
}

export function choosePendingSyncKeeper(
  a: PendingSyncAction,
  b: PendingSyncAction,
): PendingSyncAction {
  const attemptsA = a.attempts ?? 0;
  const attemptsB = b.attempts ?? 0;
  if (attemptsA !== attemptsB) {
    return attemptsA > attemptsB ? a : b;
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt >= b.createdAt ? a : b;
  }
  return a.id >= b.id ? a : b;
}

/** Merge duplicate queue rows (keeps one row per logical upload). */
export function planPendingSyncCompaction(
  rows: readonly PendingSyncAction[],
): { keepIds: Set<number>; deleteIds: number[] } {
  const keepByKey = new Map<string, PendingSyncAction>();
  const unkeyed: PendingSyncAction[] = [];

  for (const row of rows) {
    const key = pendingSyncDedupKey(row.actionType, row.payloadJson);
    if (!key) {
      unkeyed.push(row);
      continue;
    }
    const existing = keepByKey.get(key);
    if (!existing) {
      keepByKey.set(key, row);
      continue;
    }
    keepByKey.set(key, choosePendingSyncKeeper(existing, row));
  }

  const keepIds = new Set<number>([
    ...unkeyed.map((row) => row.id),
    ...[...keepByKey.values()].map((row) => row.id),
  ]);
  const deleteIds = rows.filter((row) => !keepIds.has(row.id)).map((row) => row.id);
  return { keepIds, deleteIds };
}
