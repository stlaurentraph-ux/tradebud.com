import { describe, expect, it } from 'vitest';

import type { PendingSyncAction } from '@/features/state/persistence';
import { comparePendingSyncActionsForDrain } from './pendingSyncQueuePriority';

const row = (
  id: number,
  actionType: PendingSyncAction['actionType'],
  hlc: string,
): PendingSyncAction => ({
  id,
  createdAt: id,
  hlcTimestamp: hlc,
  actionType,
  payloadJson: '{}',
  attempts: 0,
  lastError: null,
  lastAttemptAt: null,
});

describe('comparePendingSyncActionsForDrain', () => {
  it('processes land media uploads before declaration audit rows', () => {
    const ordered = [
      row(1, 'audit_sync', '1'),
      row(2, 'photos_sync', '2'),
      row(3, 'evidence_sync', '3'),
    ].sort(comparePendingSyncActionsForDrain);

    expect(ordered.map((r) => r.actionType)).toEqual([
      'photos_sync',
      'evidence_sync',
      'audit_sync',
    ]);
  });
});
