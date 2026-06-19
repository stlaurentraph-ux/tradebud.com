import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/features/sync/hasLocalSyncWork', () => ({
  measureLocalSyncWork: vi.fn(),
}));

vi.mock('@/features/state/persistence', () => ({
  compactDuplicatePendingSyncActions: vi.fn().mockResolvedValue(0),
  loadPendingSyncActions: vi.fn().mockResolvedValue([]),
}));

import {
  AUTO_BACKUP_FAILURE_BACKOFF_MS,
  AUTO_BACKUP_MIN_INTERVAL_MS,
  evaluateBackgroundAutoBackupGate,
  recordAutoBackupAttempt,
  recordAutoBackupOutcome,
  resetAutoBackupGateForTests,
} from './autoBackupPolicy';

describe('autoBackupPolicy', () => {
  beforeEach(() => {
    resetAutoBackupGateForTests();
  });

  it('blocks when there is no local work', () => {
    const decision = evaluateBackgroundAutoBackupGate({
      nowMs: 1_000_000,
      work: { hasWork: false, queuePendingCount: 0, unsyncedPlotCount: 0 },
    });
    expect(decision).toEqual({ allowed: false, reason: 'no_local_work' });
  });

  it('blocks when the minimum interval has not elapsed', () => {
    recordAutoBackupAttempt(1_000_000);
    const decision = evaluateBackgroundAutoBackupGate({
      nowMs: 1_000_000 + AUTO_BACKUP_MIN_INTERVAL_MS - 1,
      work: { hasWork: true, queuePendingCount: 2, unsyncedPlotCount: 0 },
    });
    expect(decision).toEqual({ allowed: false, reason: 'interval_not_elapsed' });
  });

  it('allows when work exists and the interval has elapsed', () => {
    recordAutoBackupAttempt(1_000_000);
    const decision = evaluateBackgroundAutoBackupGate({
      nowMs: 1_000_000 + AUTO_BACKUP_MIN_INTERVAL_MS,
      work: { hasWork: true, queuePendingCount: 1, unsyncedPlotCount: 0 },
    });
    expect(decision).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('blocks during failure backoff after consecutive failures', () => {
    recordAutoBackupAttempt(1_000_000);
    recordAutoBackupOutcome({
      success: false,
      errorSignature: 'Internal server error',
      atMs: 1_000_100,
    });
    const decision = evaluateBackgroundAutoBackupGate({
      nowMs: 1_000_100 + AUTO_BACKUP_FAILURE_BACKOFF_MS - 1,
      work: { hasWork: true, queuePendingCount: 3, unsyncedPlotCount: 0 },
    });
    expect(decision).toEqual({ allowed: false, reason: 'failure_backoff' });
  });

  it('allows again after failure backoff elapses', () => {
    recordAutoBackupAttempt(1_000_000);
    recordAutoBackupOutcome({
      success: false,
      errorSignature: 'Internal server error',
      atMs: 1_000_100,
    });
    const decision = evaluateBackgroundAutoBackupGate({
      nowMs: 1_000_100 + AUTO_BACKUP_FAILURE_BACKOFF_MS,
      work: { hasWork: true, queuePendingCount: 3, unsyncedPlotCount: 0 },
    });
    expect(decision).toEqual({ allowed: true, reason: 'allowed' });
  });
});
