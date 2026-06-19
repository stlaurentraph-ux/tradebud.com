import { describe, expect, it } from 'vitest';

import { formatSyncNowUserMessage } from './formatSyncNowUserMessage';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('formatSyncNowUserMessage', () => {
  it('returns complete when nothing remains pending', () => {
    expect(formatSyncNowUserMessage({ plotsAlreadySynced: true, remainingPending: 0 }, t)).toBe(
      'sync_result_complete',
    );
  });

  it('returns incomplete count when pending without a reason', () => {
    expect(formatSyncNowUserMessage({ remainingPending: 12 }, t)).toBe(
      'sync_result_incomplete:{"n":12}',
    );
  });

  it('prefers a farmer-facing failure reason over generic incomplete', () => {
    expect(
      formatSyncNowUserMessage(
        {
          remainingPending: 12,
          failureReason: 'Plot not on server yet — upload plot from My Plots first.',
        },
        t,
      ),
    ).toBe('Plot not on server yet — upload plot from My Plots first.');
  });

  it('returns short reach failure when fetch fails with pending items', () => {
    expect(
      formatSyncNowUserMessage({ queueFetchFailed: true, remainingPending: 3 }, t),
    ).toBe('sync_reach_failed_short');
  });
});
