import { describe, expect, it } from 'vitest';

import {
  SyncOperationTimeoutError,
  withSyncOperationTimeout,
} from './syncOperationLimits';

describe('withSyncOperationTimeout', () => {
  it('resolves when the promise finishes in time', async () => {
    await expect(withSyncOperationTimeout(Promise.resolve('ok'), 500)).resolves.toBe('ok');
  });

  it('rejects with SyncOperationTimeoutError when the budget is exceeded', async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 80);
    });
    await expect(withSyncOperationTimeout(slow, 20)).rejects.toBeInstanceOf(
      SyncOperationTimeoutError,
    );
  });
});
