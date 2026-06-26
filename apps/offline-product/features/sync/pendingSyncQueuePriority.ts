import type { PendingSyncAction } from '@/features/state/persistence';
import { compareHlcTimestamp } from '@/features/sync/hlc';

/** Upload artifacts must drain before audit_sync so declaration 429s do not block land docs. */
export const PENDING_SYNC_UPLOAD_PRIORITY: Partial<
  Record<PendingSyncAction['actionType'], number>
> = {
  harvest: 0,
  photos_sync: 1,
  evidence_sync: 2,
  audit_sync: 3,
  consent_approve: 4,
  consent_deny: 4,
  consent_revoke: 4,
};

export const MANUAL_SYNC_UPLOAD_ACTION_TYPES = [
  'harvest',
  'photos_sync',
  'evidence_sync',
] as const satisfies readonly PendingSyncAction['actionType'][];

export const MANUAL_SYNC_AUDIT_ACTION_TYPES = [
  'audit_sync',
] as const satisfies readonly PendingSyncAction['actionType'][];

export function pendingSyncActionPriority(
  actionType: PendingSyncAction['actionType'],
): number {
  return PENDING_SYNC_UPLOAD_PRIORITY[actionType] ?? 99;
}

export function comparePendingSyncActionsForDrain(
  a: PendingSyncAction,
  b: PendingSyncAction,
): number {
  const priorityDelta =
    pendingSyncActionPriority(a.actionType) - pendingSyncActionPriority(b.actionType);
  if (priorityDelta !== 0) return priorityDelta;

  const cmp = compareHlcTimestamp(a.hlcTimestamp, b.hlcTimestamp);
  if (cmp !== 0) return cmp;
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.id - b.id;
}
