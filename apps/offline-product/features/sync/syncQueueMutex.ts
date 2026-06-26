import {
  SYNC_BACKGROUND_OPERATION_MS,
  SYNC_MANUAL_OPERATION_MS,
} from '@/features/sync/syncOperationLimits';

let locked = false;
/** Each queued waiter returns true if it actually took the lock (false if it had already timed out). */
type QueuedGrant = () => boolean;
const waitQueue: QueuedGrant[] = [];

const DEFAULT_LOCK_WAIT_MS = 45_000;

/** Safety valve when a lock holder outlives operation timeouts (abandoned work). */
const MAX_LOCK_HOLD_MS =
  Math.max(SYNC_MANUAL_OPERATION_MS, SYNC_BACKGROUND_OPERATION_MS) + 15_000;

export type SyncQueuePhase =
  | 'idle'
  | 'preparing'
  | 'waiting_for_lock'
  | 'checking_connection'
  | 'restoring_plots'
  | 'uploading_plots'
  | 'processing_consent'
  | 'processing_queue';

export type SyncQueueLockSnapshot = {
  locked: boolean;
  phase: SyncQueuePhase;
  /** When the current lock holder acquired the lock. */
  lockStartedAt: number | null;
  /** When the first waiter started waiting (if any). */
  waitingSince: number | null;
  waiterCount: number;
};

let phase: SyncQueuePhase = 'idle';
let lockStartedAt: number | null = null;
let waitingSince: number | null = null;
let waiterCount = 0;

/**
 * Fencing token. Each successful lock acquisition gets a unique id. A holder may only mutate the
 * shared lock state on release if it is still the current holder. This is what makes
 * `releaseStaleSyncQueueLockIfNeeded` safe: when a hung holder is force-released and the lock is
 * handed to a new acquirer, the original holder's eventual `finally` runs with a stale token and
 * becomes a no-op — instead of clearing `locked` / popping a waiter out from under the new holder
 * (which previously allowed two pipelines to drain the pending sync queue concurrently).
 */
let currentHolderId: number | null = null;
let holderIdCounter = 0;

function assignHolderLock(): number {
  locked = true;
  currentHolderId = ++holderIdCounter;
  lockStartedAt = Date.now();
  phase = 'preparing';
  return currentHolderId;
}

const listeners = new Set<() => void>();

function emitSyncQueueLockChange(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export function getSyncQueueLockSnapshot(): SyncQueueLockSnapshot {
  return {
    locked,
    phase,
    lockStartedAt,
    waitingSince,
    waiterCount,
  };
}

export function subscribeSyncQueueLock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Only the active lock holder should update the phase. */
export function setSyncQueuePhase(next: SyncQueuePhase): void {
  if (!locked && next !== 'idle') return;
  phase = next;
  emitSyncQueueLockChange();
}

export class SyncQueueLockTimeoutError extends Error {
  constructor() {
    super('sync_queue_lock_timeout');
    this.name = 'SyncQueueLockTimeoutError';
  }
}

type LockWaitMs = number | 'never';

/** @internal Test helper and recovery hook when a holder never releases. */
export function releaseStaleSyncQueueLockIfNeeded(nowMs = Date.now()): boolean {
  if (!locked || lockStartedAt == null) return false;
  if (nowMs - lockStartedAt < MAX_LOCK_HOLD_MS) return false;
  locked = false;
  // Invalidate the hung holder's fencing token so its eventual `finally` is a no-op.
  currentHolderId = null;
  phase = 'idle';
  lockStartedAt = null;
  waitingSince = null;
  waitQueue.length = 0;
  emitSyncQueueLockChange();
  return true;
}

function handoffOrRelease(): void {
  // Skip waiters that already timed out; grant to the first live one, else fully release.
  while (waitQueue.length > 0) {
    const next = waitQueue.shift();
    if (next && next()) {
      return;
    }
  }
  locked = false;
  currentHolderId = null;
  phase = 'idle';
  lockStartedAt = null;
  waitingSince = null;
  emitSyncQueueLockChange();
}

function waitForSyncQueueLock(waitMs: LockWaitMs): Promise<number> {
  releaseStaleSyncQueueLockIfNeeded();
  return new Promise<number>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const onTimeout = () => {
      if (settled) return;
      settled = true;
      waiterCount = Math.max(0, waiterCount - 1);
      if (waiterCount === 0) waitingSince = null;
      emitSyncQueueLockChange();
      reject(new SyncQueueLockTimeoutError());
    };

    if (waitMs !== 'never') {
      timer = setTimeout(onTimeout, waitMs);
    }

    const grant = (): boolean => {
      if (settled) return false;
      settled = true;
      if (timer) clearTimeout(timer);
      waiterCount = Math.max(0, waiterCount - 1);
      if (waiterCount === 0) waitingSince = null;
      const holderId = assignHolderLock();
      emitSyncQueueLockChange();
      resolve(holderId);
      return true;
    };

    if (!locked) {
      settled = true;
      if (timer) clearTimeout(timer);
      const holderId = assignHolderLock();
      emitSyncQueueLockChange();
      resolve(holderId);
      return;
    }

    waiterCount += 1;
    if (waitingSince == null) waitingSince = Date.now();
    emitSyncQueueLockChange();
    waitQueue.push(grant);
  });
}

/** Serialize plot upload + pending sync queue drains across the app. */
export async function withSyncQueueLock<T>(
  fn: () => Promise<T>,
  options?: { waitMs?: LockWaitMs },
): Promise<T> {
  const holderId = await waitForSyncQueueLock(options?.waitMs ?? DEFAULT_LOCK_WAIT_MS);

  try {
    return await fn();
  } finally {
    // Only release/hand off if we are still the current holder. If we were force-released as a
    // stale holder, ownership has already moved to another caller — touching shared state here
    // would corrupt the lock and allow a concurrent drain.
    if (currentHolderId === holderId) {
      handoffOrRelease();
    }
  }
}

/** @internal Test helper */
export function resetSyncQueueLockForTests() {
  locked = false;
  waitQueue.length = 0;
  phase = 'idle';
  lockStartedAt = null;
  waitingSince = null;
  waiterCount = 0;
  currentHolderId = null;
  holderIdCounter = 0;
  listeners.clear();
}
