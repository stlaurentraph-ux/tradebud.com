import { beforeEach, describe, expect, it, vi } from 'vitest';

const processPendingSyncQueue = vi.hoisted(() => vi.fn());

vi.mock('@/features/sync/processPendingSyncQueue', () => ({
  processPendingSyncQueue,
}));

import { drainPendingSyncQueueForManualSync } from './drainPendingSyncQueue';

describe('drainPendingSyncQueueForManualSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processPendingSyncQueue.mockResolvedValue({
      completed: 0,
      failedActions: 0,
      droppedInvalid: 0,
      fetchFailed: false,
    });
  });

  it('drains audit_sync before upload action types', async () => {
    await drainPendingSyncQueueForManualSync({
      farmerId: 'farmer-1',
      localPlots: [],
      actionTypes: ['photos_sync', 'audit_sync'],
      maxPasses: 1,
    });

    expect(processPendingSyncQueue.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(processPendingSyncQueue.mock.calls[0]?.[0]?.actionTypes).toEqual(['audit_sync']);
    expect(processPendingSyncQueue.mock.calls[1]?.[0]?.actionTypes).toEqual(['photos_sync']);
  });
});
