import { describe, expect, it } from 'vitest';

import {
  formatPendingSyncSummary,
  formatSyncNowUserMessage,
  resolveSyncOpenPlotId,
} from './formatSyncNowUserMessage';

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

  it('names only plots that still need upload', () => {
    expect(
      formatSyncNowUserMessage(
        {
          remainingPending: 1,
          unsyncedPlotCount: 1,
          unsyncedPlotNames: ['Plot 2'],
        },
        t,
      ),
    ).toBe('sync_result_incomplete_plots:{"n":1,"names":"Plot 2"}');
  });

  it('shows a precise overlap message instead of a generic upload list', () => {
    expect(
      formatSyncNowUserMessage(
        {
          remainingPending: 1,
          blockedPlotCount: 1,
          unsyncedPlotCount: 0,
          blockedPlots: [
            {
              plotId: 'farmer-2',
              plotName: 'Plot 2',
              code: 'GEO-105',
              overlapPlotName: 'Plot 1',
              message: 'geo_quality_overlap_upload:{"plotName":"Plot 2","otherPlotName":"Plot 1"}',
              supportMailto: 'mailto:support@tracebud.com',
            },
          ],
        },
        t,
      ),
    ).toContain('geo_quality_overlap_upload');
  });

  it('names the plot for micro-area blocks without overlap support copy', () => {
    expect(
      formatSyncNowUserMessage(
        {
          remainingPending: 1,
          blockedPlotCount: 1,
          unsyncedPlotCount: 0,
          blockedPlots: [
            {
              plotId: 'plot-3',
              plotName: 'Plot 3',
              code: 'GEO-106',
              message: 'geo_quality_micro_area_upload:{"plotName":"Plot 3"}',
              supportMailto: 'mailto:support@tracebud.com',
            },
          ],
        },
        t,
      ),
    ).toBe('geo_quality_micro_area_upload:{"plotName":"Plot 3"}');
  });

  it('falls back to plot count when names are missing', () => {
    expect(
      formatSyncNowUserMessage(
        {
          remainingPending: 1,
          unsyncedPlotCount: 1,
          unsyncedPlotNames: [],
        },
        t,
      ),
    ).toBe('sync_result_incomplete_plot_count:{"n":1}');
  });
});

describe('resolveSyncOpenPlotId', () => {
  it('returns plot id when exactly one plot is geometry-blocked', () => {
    expect(
      resolveSyncOpenPlotId({
        remainingPending: 1,
        blockedPlots: [
          {
            plotId: 'plot-2',
            plotName: 'Plot 2',
            code: 'GEO-105',
            message: 'overlap',
            supportMailto: 'mailto:support@tracebud.com',
          },
        ],
      }),
    ).toBe('plot-2');
  });

  it('returns undefined when multiple plots are blocked', () => {
    expect(
      resolveSyncOpenPlotId({
        remainingPending: 2,
        blockedPlots: [
          {
            plotId: 'plot-1',
            plotName: 'Plot 1',
            code: 'GEO-106',
            message: 'micro',
            supportMailto: 'mailto:support@tracebud.com',
          },
          {
            plotId: 'plot-2',
            plotName: 'Plot 2',
            code: 'GEO-105',
            message: 'overlap',
            supportMailto: 'mailto:support@tracebud.com',
          },
        ],
      }),
    ).toBeUndefined();
  });
});

describe('formatPendingSyncSummary', () => {
  it('prefers failure reason', () => {
    expect(
      formatPendingSyncSummary(
        { total: 2, unsyncedPlotCount: 1, queuePendingCount: 1, unsyncedPlotNames: ['Plot 2'] },
        t,
        'Upload failed',
      ),
    ).toBe('Upload failed');
  });

  it('describes queue-only pending items', () => {
    expect(
      formatPendingSyncSummary(
        { total: 1, unsyncedPlotCount: 0, queuePendingCount: 1, unsyncedPlotNames: [] },
        t,
      ),
    ).toBe('sync_result_incomplete_queue:{"n":1}');
  });
});
