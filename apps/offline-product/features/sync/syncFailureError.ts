import type { SyncFailure } from '@/features/sync/syncFailure';

/** Thrown when a sync step fails with a classified {@link SyncFailure}. */
export class SyncFailureError extends Error {
  readonly failure: SyncFailure;

  constructor(failure: SyncFailure) {
    super(failure.message);
    this.name = 'SyncFailureError';
    this.failure = failure;
  }
}

export function isSyncFailureError(error: unknown): error is SyncFailureError {
  return error instanceof SyncFailureError;
}

export function syncFailureError(failure: SyncFailure): SyncFailureError {
  return new SyncFailureError(failure);
}

export function throwSyncFailure(failure: SyncFailure): never {
  throw new SyncFailureError(failure);
}
