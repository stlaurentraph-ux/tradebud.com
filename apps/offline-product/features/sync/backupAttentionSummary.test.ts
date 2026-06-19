import { describe, expect, it } from 'vitest';

import {
  pickBackupAttentionPrimaryKind,
  shouldOfferBackupAttentionDetails,
  shouldShowBackupAttentionPanel,
} from './backupAttentionSummary';

const baseSnapshot = {
  isSignedIn: true,
  queueLastError: null,
  queueLastErrorActionType: null,
  queuePendingCount: 0,
  queueRetryingCount: 0,
  queueMaxAttempts: 0,
  queueNextRetrySeconds: null,
  unsyncedPlotCount: 0,
  plotsFetchFailed: false,
  queuePendingBreakdown: null,
};

describe('backupAttentionSummary', () => {
  it('shows the panel when queue items failed', () => {
    expect(
      shouldShowBackupAttentionPanel({
        ...baseSnapshot,
        queuePendingCount: 2,
        queueLastError: 'network',
      }),
    ).toBe(true);
  });

  it('prioritizes connectivity when plot list cannot be reached', () => {
    expect(
      pickBackupAttentionPrimaryKind({
        ...baseSnapshot,
        queuePendingCount: 10,
        queueLastError: 'Internal Server Error',
        plotsFetchFailed: true,
      }),
    ).toBe('connectivity');
  });

  it('uses a single friendly primary line for queue errors', () => {
    expect(
      pickBackupAttentionPrimaryKind({
        ...baseSnapshot,
        queuePendingCount: 2,
        queueLastError: 'network',
      }),
    ).toBe('queue_error');
  });

  it('does not offer expandable dev details to farmers', () => {
    const snapshot = {
      ...baseSnapshot,
      queuePendingCount: 2,
      queueRetryingCount: 2,
      queueMaxAttempts: 11,
      queueLastError: 'network',
      queuePendingBreakdown: 'Harvest: 2',
      unsyncedPlotCount: 3,
      queueNextRetrySeconds: 257,
    };
    expect(pickBackupAttentionPrimaryKind(snapshot)).toBe('queue_error');
    expect(shouldOfferBackupAttentionDetails(snapshot)).toBe(false);
  });
});
