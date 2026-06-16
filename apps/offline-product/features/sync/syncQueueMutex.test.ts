import { describe, expect, it } from 'vitest';

import { resetSyncQueueLockForTests, withSyncQueueLock } from './syncQueueMutex';

describe('withSyncQueueLock', () => {
  it('serializes concurrent callers', async () => {
    resetSyncQueueLockForTests();
    const order: number[] = [];
    await Promise.all([
      withSyncQueueLock(async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
        order.push(2);
      }),
      withSyncQueueLock(async () => {
        order.push(3);
      }),
    ]);
    expect(order).toEqual([1, 2, 3]);
  });
});
