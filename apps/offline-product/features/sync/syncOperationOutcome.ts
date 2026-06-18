export type SyncOperationOutcome =
  | { kind: 'timeout'; source: 'manual' | 'background'; at: number }
  | { kind: 'lock_timeout'; source: 'manual' | 'background'; at: number };

const listeners = new Set<(outcome: SyncOperationOutcome) => void>();
let lastOutcome: SyncOperationOutcome | null = null;

export function emitSyncOperationOutcome(
  outcome: Omit<SyncOperationOutcome, 'at'> & { at?: number },
): void {
  const full: SyncOperationOutcome = { ...outcome, at: outcome.at ?? Date.now() } as SyncOperationOutcome;
  lastOutcome = full;
  for (const listener of listeners) {
    try {
      listener(full);
    } catch {
      // ignore
    }
  }
}

export function getLastSyncOperationOutcome(): SyncOperationOutcome | null {
  return lastOutcome;
}

export function subscribeSyncOperationOutcome(
  listener: (outcome: SyncOperationOutcome) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** @internal Test helper */
export function resetSyncOperationOutcomeForTests(): void {
  lastOutcome = null;
  listeners.clear();
}
