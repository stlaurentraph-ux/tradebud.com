let locked = false;
const waitQueue: Array<() => void> = [];

/** Serialize plot upload + pending sync queue drains across the app. */
export async function withSyncQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  await new Promise<void>((resolve) => {
    if (!locked) {
      locked = true;
      resolve();
      return;
    }
    waitQueue.push(resolve);
  });

  try {
    return await fn();
  } finally {
    const next = waitQueue.shift();
    if (next) {
      next();
    } else {
      locked = false;
    }
  }
}

/** @internal Test helper */
export function resetSyncQueueLockForTests() {
  locked = false;
  waitQueue.length = 0;
}
