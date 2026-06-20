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
});
