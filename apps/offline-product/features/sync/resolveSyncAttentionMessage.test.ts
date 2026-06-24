import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

import { resolveSyncAttentionMessage } from './resolveSyncAttentionMessage';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('resolveSyncAttentionMessage', () => {
  it('returns complete when nothing is pending', () => {
    expect(
      resolveSyncAttentionMessage({
        pending: {
          total: 0,
          unsyncedPlotCount: 0,
          queuePendingCount: 0,
          unsyncedPlotNames: [],
        },
        t,
      }),
    ).toEqual({ message: 'sync_result_complete', kind: 'success' });
  });

  it('prioritizes queue waiting over false unsynced plot names', () => {
    expect(
      resolveSyncAttentionMessage({
        pending: {
          total: 3,
          unsyncedPlotCount: 2,
          queuePendingCount: 1,
          unsyncedPlotNames: ['Plot 1', 'Plot 3'],
        },
        t,
      }),
    ).toEqual({
      message: 'sync_result_incomplete_queue:{"n":1}',
      kind: 'error',
    });
  });

  it('prefers explicit sync failure reason', () => {
    expect(
      resolveSyncAttentionMessage({
        pending: {
          total: 2,
          unsyncedPlotCount: 2,
          queuePendingCount: 0,
          unsyncedPlotNames: ['Plot 1', 'Plot 3'],
        },
        t,
        syncOutcome: {
          failureReason: 'Photos still uploading.',
          remainingPending: 2,
        },
      }),
    ).toEqual({ message: 'Photos still uploading.', kind: 'error' });
  });

  it('surfaces land docs still pending when audit sync hits rate limit', () => {
    expect(
      resolveSyncAttentionMessage({
        pending: {
          total: 4,
          unsyncedPlotCount: 0,
          queuePendingCount: 4,
          unsyncedPlotNames: [],
        },
        t,
        syncOutcome: {
          remainingPending: 4,
          queueCompleted: 1,
          syncFailure: {
            cause: 'rate_limit',
            actionType: 'audit_sync',
            step: 'declaration',
            message: '429',
          },
        },
        queueMediaPendingCount: 2,
      }),
    ).toEqual({
      message: 'sync_land_docs_still_pending_after_audit_limit',
      kind: 'error',
    });
  });

  it('surfaces declarations pending after land upload phase completes', () => {
    expect(
      resolveSyncAttentionMessage({
        pending: {
          total: 3,
          unsyncedPlotCount: 0,
          queuePendingCount: 3,
          unsyncedPlotNames: [],
        },
        t,
        syncOutcome: {
          remainingPending: 3,
          queueCompleted: 2,
          syncFailure: {
            cause: 'rate_limit',
            actionType: 'audit_sync',
            step: 'declaration',
            message: '429',
          },
        },
        queueMediaPendingCount: 0,
      }),
    ).toEqual({
      message: 'sync_declarations_pending_after_land_upload',
      kind: 'error',
    });
  });
});
