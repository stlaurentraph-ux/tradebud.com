import {
  compactDuplicatePendingSyncActions,
  loadPendingSyncActions,
} from '@/features/state/persistence';
import { measureLocalSyncWork, type LocalSyncWorkSnapshot } from '@/features/sync/hasLocalSyncWork';
import type { Plot } from '@/features/state/AppStateContext';

/** Minimum gap between automatic background backup runs. */
export const AUTO_BACKUP_MIN_INTERVAL_MS = 15 * 60 * 1000;

/** When signed in with no local upload work, still check cloud restore at this interval. */
export const AUTO_RESTORE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** After repeated failures, wait at least this long before auto-trying again. */
export const AUTO_BACKUP_FAILURE_BACKOFF_MS = 15 * 60 * 1000;

/** Same queue error on this many rows ⇒ skip auto queue drain. */
export const AUTO_QUEUE_DRAIN_REPEAT_ERROR_THRESHOLD = 3;

type AutoBackupGateState = {
  lastAttemptAt: number;
  lastFailureAt: number;
  lastFailureSignature: string;
  consecutiveFailures: number;
};

const gateState: AutoBackupGateState = {
  lastAttemptAt: 0,
  lastFailureAt: 0,
  lastFailureSignature: '',
  consecutiveFailures: 0,
};

export type BackgroundAutoBackupDecision = {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'no_local_work'
    | 'interval_not_elapsed'
    | 'failure_backoff'
    | 'in_flight';
};

export function resetAutoBackupGateForTests(): void {
  gateState.lastAttemptAt = 0;
  gateState.lastFailureAt = 0;
  gateState.lastFailureSignature = '';
  gateState.consecutiveFailures = 0;
}

export function recordAutoBackupAttempt(atMs: number = Date.now()): void {
  gateState.lastAttemptAt = atMs;
}

export function recordAutoBackupOutcome(params: {
  success: boolean;
  errorSignature?: string;
  atMs?: number;
}): void {
  const atMs = params.atMs ?? Date.now();
  if (params.success) {
    gateState.consecutiveFailures = 0;
    gateState.lastFailureSignature = '';
    return;
  }
  const signature = params.errorSignature?.trim() ?? 'unknown';
  gateState.lastFailureAt = atMs;
  if (signature === gateState.lastFailureSignature) {
    gateState.consecutiveFailures += 1;
  } else {
    gateState.lastFailureSignature = signature;
    gateState.consecutiveFailures = 1;
  }
}

export function evaluateBackgroundAutoBackupGate(params: {
  nowMs: number;
  work: LocalSyncWorkSnapshot;
  signedIn?: boolean;
}): BackgroundAutoBackupDecision {
  if (!params.work.hasWork) {
    if (params.signedIn) {
      const sinceAttempt = params.nowMs - gateState.lastAttemptAt;
      if (
        gateState.lastAttemptAt === 0 ||
        sinceAttempt >= AUTO_RESTORE_CHECK_INTERVAL_MS
      ) {
        return { allowed: true, reason: 'allowed' };
      }
      return { allowed: false, reason: 'interval_not_elapsed' };
    }
    return { allowed: false, reason: 'no_local_work' };
  }

  const sinceAttempt = params.nowMs - gateState.lastAttemptAt;
  if (gateState.lastAttemptAt > 0 && sinceAttempt < AUTO_BACKUP_MIN_INTERVAL_MS) {
    return { allowed: false, reason: 'interval_not_elapsed' };
  }

  if (gateState.consecutiveFailures > 0 && gateState.lastFailureAt > 0) {
    const sinceFailure = params.nowMs - gateState.lastFailureAt;
    if (sinceFailure < AUTO_BACKUP_FAILURE_BACKOFF_MS) {
      return { allowed: false, reason: 'failure_backoff' };
    }
  }

  return { allowed: true, reason: 'allowed' };
}

export async function shouldSkipAutoQueueDrain(): Promise<boolean> {
  await compactDuplicatePendingSyncActions().catch(() => 0);
  const rows = await loadPendingSyncActions().catch(() => []);
  if (rows.length === 0) return false;

  const errored = rows.filter(
    (row) =>
      (row.attempts ?? 0) >= AUTO_QUEUE_DRAIN_REPEAT_ERROR_THRESHOLD &&
      typeof row.lastError === 'string' &&
      row.lastError.trim().length > 0,
  );
  if (errored.length === 0) return false;

  const byError = new Map<string, number>();
  for (const row of errored) {
    const key = row.lastError!.trim();
    byError.set(key, (byError.get(key) ?? 0) + 1);
  }
  let topCount = 0;
  for (const count of byError.values()) {
    topCount = Math.max(topCount, count);
  }
  return topCount >= AUTO_QUEUE_DRAIN_REPEAT_ERROR_THRESHOLD;
}

export function summarizeAutoBackupError(params: {
  plotFirstError?: string;
  queueFirstError?: string;
  queueFailedActions?: number;
}): string {
  if (params.plotFirstError?.trim()) return params.plotFirstError.trim();
  if ((params.queueFailedActions ?? 0) > 0 && params.queueFirstError?.trim()) {
    return params.queueFirstError.trim();
  }
  if ((params.queueFailedActions ?? 0) > 0) return 'queue_drain_failed';
  return 'unknown';
}

export async function evaluateConservativeAutoBackup(params: {
  plots: Plot[];
  nowMs?: number;
}): Promise<{
  work: LocalSyncWorkSnapshot;
  gate: BackgroundAutoBackupDecision;
  skipQueueDrain: boolean;
}> {
  const work = await measureLocalSyncWork({ plots: params.plots });
  const gate = evaluateBackgroundAutoBackupGate({
    nowMs: params.nowMs ?? Date.now(),
    work,
    signedIn: true,
  });
  const skipQueueDrain = work.hasWork
    ? await shouldSkipAutoQueueDrain()
    : true;
  return { work, gate, skipQueueDrain };
}
