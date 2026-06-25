import { describe, expect, it } from 'vitest';

import {
  formatSyncProgressCaption,
} from './syncProgressCaption';
import {
  getSyncQueueLockSnapshot,
  releaseStaleSyncQueueLockIfNeeded,
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

  it('releases a stale lock before granting a new holder', async () => {
    resetSyncQueueLockForTests();
    void withSyncQueueLock(async () => {
      await new Promise(() => undefined);
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(getSyncQueueLockSnapshot().locked).toBe(true);

    const snap = getSyncQueueLockSnapshot();
    expect(releaseStaleSyncQueueLockIfNeeded((snap.lockStartedAt ?? 0) + 200_000)).toBe(true);
    expect(getSyncQueueLockSnapshot().locked).toBe(false);

    await expect(withSyncQueueLock(async () => 'recovered', { waitMs: 30 })).resolves.toBe(
      'recovered',
    );
  });

  it('a force-released stale holder does not clobber the lock of the new holder', async () => {
    resetSyncQueueLockForTests();

    // Holder A acquires and hangs.
    let releaseA: (() => void) | undefined;
    const aHeld = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    const aRun = withSyncQueueLock(async () => {
      await aHeld;
    });
    await new Promise((r) => setTimeout(r, 0));

    // Operator/recovery force-releases A as stale.
    const snap = getSyncQueueLockSnapshot();
    expect(releaseStaleSyncQueueLockIfNeeded((snap.lockStartedAt ?? 0) + 200_000)).toBe(true);

    // Holder B acquires the freed lock and starts running.
    let releaseB: (() => void) | undefined;
    const bHeld = new Promise<void>((resolve) => {
      releaseB = resolve;
    });
    const bRun = withSyncQueueLock(async () => {
      await bHeld;
    }, { waitMs: 30 });
    await new Promise((r) => setTimeout(r, 0));
    expect(getSyncQueueLockSnapshot().locked).toBe(true);

    // A finally completes. Its finally must be a no-op (stale token) — B must keep the lock.
    releaseA?.();
    await aRun;
    await new Promise((r) => setTimeout(r, 0));
    expect(getSyncQueueLockSnapshot().locked).toBe(true);

    // A third caller must still have to wait for B (not slip in due to a corrupted lock).
    let cRan = false;
    const cRun = withSyncQueueLock(async () => {
      cRan = true;
    }, { waitMs: 'never' });
    await new Promise((r) => setTimeout(r, 10));
    expect(cRan).toBe(false);

    // Once B releases, C proceeds and the lock fully clears.
    releaseB?.();
    await bRun;
    await cRun;
    expect(cRan).toBe(true);
    expect(getSyncQueueLockSnapshot().locked).toBe(false);
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
