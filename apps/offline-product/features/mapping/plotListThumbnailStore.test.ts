import { describe, expect, it } from 'vitest';

import {
  plotListThumbnailFilePath,
  plotListThumbnailUriBasePath,
  plotNeedsListThumbnailBackfill,
  PLOT_LIST_THUMBS_DIR,
} from '@/features/mapping/plotListThumbnailStore';

describe('plotListThumbnailStore', () => {
  it('builds stable on-device paths per plot id', () => {
    expect(plotListThumbnailFilePath('farmer-1', 'file:///docs/')).toBe(
      `file:///docs/${PLOT_LIST_THUMBS_DIR}/farmer-1.png`,
    );
  });

  it('strips cache-buster query from persisted thumbnail URIs', () => {
    expect(plotListThumbnailUriBasePath('file:///docs/plot-list-thumbs/a.png?v=123')).toBe(
      'file:///docs/plot-list-thumbs/a.png',
    );
  });

  it('detects plots that need backfill', () => {
    expect(
      plotNeedsListThumbnailBackfill({
        points: [{ latitude: 1, longitude: 2 }],
        listThumbnailUri: undefined,
      }),
    ).toBe(true);
    expect(
      plotNeedsListThumbnailBackfill({
        points: [{ latitude: 1, longitude: 2 }],
        listThumbnailUri: 'file:///plot-list-thumbs/x.png',
      }),
    ).toBe(false);
    expect(
      plotNeedsListThumbnailBackfill({
        points: [],
        listThumbnailUri: undefined,
      }),
    ).toBe(false);
  });
});
