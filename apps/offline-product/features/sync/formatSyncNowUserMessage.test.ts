import { describe, expect, it } from 'vitest';

import { formatSyncNowUserMessage } from './formatSyncNowUserMessage';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('formatSyncNowUserMessage', () => {
  it('returns partial copy when queue items fail', () => {
    expect(formatSyncNowUserMessage({ queueFailed: 2 }, t)).toBe('settings_sync_result_partial');
  });

  it('returns upload success when all plots uploaded', () => {
    expect(
      formatSyncNowUserMessage({ plotsUploadedAll: { uploaded: 2, total: 2 } }, t),
    ).toBe('sync_plots_uploaded_all:{"uploaded":2,"total":2}');
  });

  it('returns sent copy when queue completes', () => {
    expect(formatSyncNowUserMessage({ queueCompleted: 3 }, t)).toBe(
      'settings_sync_result_sent:{"n":3}',
    );
  });

  it('prefers queue success when plot fetch failed but queue drained', () => {
    expect(
      formatSyncNowUserMessage({ plotsFetchFailed: true, queueCompleted: 2 }, t),
    ).toBe('settings_sync_result_sent:{"n":2}');
  });

  it('does not claim backed up when items remain pending', () => {
    expect(
      formatSyncNowUserMessage({ plotsAlreadySynced: true, remainingPending: 12 }, t),
    ).toBe('settings_sync_still_pending:{"n":12}');
  });

  it('reports partial progress when some queue items uploaded', () => {
    expect(
      formatSyncNowUserMessage({ queueCompleted: 3, remainingPending: 9 }, t),
    ).toBe('settings_sync_result_sent_with_remaining:{"sent":3,"n":9}');
  });
});
