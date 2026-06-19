import { describe, expect, it } from 'vitest';

import {
  formatSyncProgressCaption,
} from './syncProgressCaption';
import {
  getSyncQueueLockSnapshot,
  resetSyncQueueLockForTests,
  setSyncQueuePhase,
  SyncQueueLockTimeoutError,
  withSyncQueueLock,
} from './syncQueueMutex';

const t = (key: string, params?: Record<string, string | number>) => {
  if (key === 'sync_progress_with_elapsed') {
    return `${params?.step} (${params?.seconds}s)`;
  }
  if (key === 'sync_progress_waiting_for_step') {
    return `Waiting to start — ${params?.step} in progress`;
  }
  const labels: Record<string, string> = {
    sync_progress_connecting: 'Checking connection to Tracebud',
    sync_progress_plots: 'Uploading plot boundaries',
    sync_progress_queue: 'Sending deliveries, photos, and documents',
  };
  return labels[key] ?? key;
};

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

  it('rejects when the lock cannot be acquired in time', async () => {
    resetSyncQueueLockForTests();
    let releaseFirst: (() => void) | undefined;
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withSyncQueueLock(async () => {
      await firstHeld;
    });
    await new Promise((r) => setTimeout(r, 0));

    await expect(withSyncQueueLock(async () => undefined, { waitMs: 30 })).rejects.toBeInstanceOf(
      SyncQueueLockTimeoutError,
    );

    releaseFirst?.();
    await first;
  });

  it('waits indefinitely when waitMs is never', async () => {
    resetSyncQueueLockForTests();
    let releaseFirst: (() => void) | undefined;
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withSyncQueueLock(async () => {
      setSyncQueuePhase('uploading_plots');
      await firstHeld;
    });
    await new Promise((r) => setTimeout(r, 0));

    const second = withSyncQueueLock(async () => 'done', { waitMs: 'never' });
    await new Promise((r) => setTimeout(r, 50));
    expect(getSyncQueueLockSnapshot().waiterCount).toBe(1);

    releaseFirst?.();
    await expect(second).resolves.toBe('done');
  });
});

describe('formatSyncProgressCaption', () => {
  it('describes a waiting manual sync with the active holder step', () => {
    resetSyncQueueLockForTests();
    const caption = formatSyncProgressCaption(
      t,
      {
        locked: true,
        phase: 'uploading_plots',
        lockStartedAt: Date.now() - 12_000,
        waitingSince: Date.now() - 5_000,
        waiterCount: 1,
      },
      { syncNowBusy: true, nowMs: Date.now() },
    );
    expect(caption).toContain('Waiting to start');
    expect(caption).toContain('Uploading plot boundaries');
    expect(caption).toContain('(5s)');
  });

  it('shows the active step when backup was started elsewhere', () => {
    const caption = formatSyncProgressCaption(
      t,
      {
        locked: true,
        phase: 'processing_queue',
        lockStartedAt: Date.now() - 3_000,
        waitingSince: null,
        waiterCount: 0,
      },
      { syncNowBusy: false, nowMs: Date.now() },
    );
    expect(caption).toContain('Sending deliveries, photos, and documents');
    expect(caption).toContain('(3s)');
  });
});
