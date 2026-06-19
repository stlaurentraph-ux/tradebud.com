import { describe, expect, it } from 'vitest';

import {
  pendingSyncDedupKey,
  planPendingSyncCompaction,
} from './pendingSyncDedup';
import type { PendingSyncAction } from '@/features/state/persistence';

const row = (
  id: number,
  actionType: PendingSyncAction['actionType'],
  payload: Record<string, unknown>,
  attempts = 0,
): PendingSyncAction => ({
  id,
  createdAt: id,
  hlcTimestamp: `hlc-${id}`,
  actionType,
  payloadJson: JSON.stringify(payload),
  attempts,
  lastError: null,
  lastAttemptAt: null,
});

describe('pendingSyncDedupKey', () => {
  it('dedupes producer evidence sync by farmer scope', () => {
    const key = pendingSyncDedupKey(
      'evidence_sync',
      JSON.stringify({
        scope: 'producer',
        farmerId: 'farmer-1',
        plotId: 'profile:farmer-1',
        reason: 'buyer audit',
      }),
    );
    expect(key).toBe('evidence_sync:producer:farmer-1');
  });

  it('dedupes harvest by clientEventId', () => {
    const key = pendingSyncDedupKey(
      'harvest',
      JSON.stringify({ plotId: 'p1', kg: 10, clientEventId: 'harvest-p1-1' }),
    );
    expect(key).toBe('harvest:harvest-p1-1');
  });
});

describe('planPendingSyncCompaction', () => {
  it('collapses duplicate producer evidence rows', () => {
    const rows = [
      row(1, 'evidence_sync', {
        scope: 'producer',
        farmerId: 'f1',
        plotId: 'profile:f1',
        reason: 'a',
      }),
      row(2, 'evidence_sync', {
        scope: 'producer',
        farmerId: 'f1',
        plotId: 'profile:f1',
        reason: 'b',
      }),
      row(3, 'harvest', { plotId: 'p1', kg: 5, clientEventId: 'h-1' }),
    ];
    const { keepIds, deleteIds } = planPendingSyncCompaction(rows);
    expect(keepIds.size).toBe(2);
    expect(deleteIds).toEqual([1]);
  });
});
