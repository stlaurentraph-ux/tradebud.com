/** Max time to wait for another sync/backup to finish before giving up. */
export const SYNC_LOCK_WAIT_MS = 60_000;

/** Wall-clock budget for manual "Sync now" in Settings. */
export const SYNC_MANUAL_OPERATION_MS = 180_000;

/** Wall-clock budget for automatic background backup. */
export const SYNC_BACKGROUND_OPERATION_MS = 120_000;

/** After this many seconds, progress copy switches to "still trying". */
export const SYNC_SLOW_HINT_SECONDS = 25;

/** Near the operation budget, warn that sync will stop soon. */
export const SYNC_STOPPING_SOON_SECONDS = 90;

export class SyncOperationTimeoutError extends Error {
  constructor() {
    super('sync_operation_timeout');
    this.name = 'SyncOperationTimeoutError';
  }
}

/** Reject when `promise` does not settle within `timeoutMs`. */
export function withSyncOperationTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new SyncOperationTimeoutError());
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
