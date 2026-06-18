let locked = false;
const waitQueue: Array<() => void> = [];

const DEFAULT_LOCK_WAIT_MS = 45_000;

export type SyncQueuePhase =
  | 'idle'
  | 'preparing'
  | 'waiting_for_lock'
  | 'checking_connection'
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

function waitForSyncQueueLock(waitMs: LockWaitMs): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const finishWait = (grant: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      grant();
    };

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

    const grant = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      waiterCount = Math.max(0, waiterCount - 1);
      if (waiterCount === 0) waitingSince = null;
      resolve();
    };

    if (!locked) {
      locked = true;
      lockStartedAt = Date.now();
      phase = 'preparing';
      emitSyncQueueLockChange();
      grant();
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
  await waitForSyncQueueLock(options?.waitMs ?? DEFAULT_LOCK_WAIT_MS);

  try {
    return await fn();
  } finally {
    const next = waitQueue.shift();
    if (next) {
      lockStartedAt = Date.now();
      phase = 'preparing';
      emitSyncQueueLockChange();
      next();
    } else {
      locked = false;
      phase = 'idle';
      lockStartedAt = null;
      waitingSince = null;
      emitSyncQueueLockChange();
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
  listeners.clear();
}
