import { describe, expect, it } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';
import {
  layoutOnlineTileForPlot,
  pickListThumbnailZoom,
  pickOfflinePackZoom,
  pickPlotListSatelliteTile,
  tileGeoBounds,
} from '@/features/mapping/plotListSatelliteTileLayout';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailStore';

const smallFieldPlot: Plot = {
  id: 'plot-small',
  name: 'Small field',
  kind: 'polygon',
  points: [
    { latitude: 4.7121, longitude: -74.0721 },
    { latitude: 4.7124, longitude: -74.0718 },
    { latitude: 4.7120, longitude: -74.0716 },
    { latitude: 4.7117, longitude: -74.0719 },
  ],
  areaHectares: 0.1,
  areaSquareMeters: 1000,
  farmerId: 'farmer-1',
  createdAt: 1_735_689_600_000,
};

describe('pickListThumbnailZoom', () => {
  it('uses high zoom for small plots so tiles are not upscaled', () => {
    expect(pickListThumbnailZoom(smallFieldPlot, PLOT_LIST_THUMB_DISPLAY_SIZE)).toBeGreaterThanOrEqual(
      17,
    );
  });

  it('keeps projected tile near native 256px resolution', () => {
    const layout = layoutOnlineTileForPlot(smallFieldPlot, PLOT_LIST_THUMB_DISPLAY_SIZE);
    expect(layout).not.toBeNull();
    expect(layout!.width).toBeLessThanOrEqual(320);
    expect(layout!.height).toBeLessThanOrEqual(320);
  });

  it('uses offline pack zoom levels instead of ideal online zoom', () => {
    const ideal = pickListThumbnailZoom(smallFieldPlot, PLOT_LIST_THUMB_DISPLAY_SIZE);
    expect(ideal).toBeGreaterThanOrEqual(17);
    expect(
      pickOfflinePackZoom({ zooms: [14, 15, 16] }, smallFieldPlot, PLOT_LIST_THUMB_DISPLAY_SIZE),
    ).toBe(16);
  });

  it('picks a tile whose geo bounds cover the full thumbnail frame', () => {
    const offsetPlot: Plot = {
      ...smallFieldPlot,
      id: 'plot-offset',
      points: [
        { latitude: 4.71205, longitude: -74.07225 },
        { latitude: 4.71235, longitude: -74.07155 },
        { latitude: 4.71195, longitude: -74.07145 },
        { latitude: 4.71165, longitude: -74.07215 },
      ],
    };
    const tile = pickPlotListSatelliteTile(offsetPlot, PLOT_LIST_THUMB_DISPLAY_SIZE);
    expect(tile).not.toBeNull();
    const layout = layoutOnlineTileForPlot(offsetPlot, PLOT_LIST_THUMB_DISPLAY_SIZE);
    expect(layout).not.toBeNull();
    expect(layout!.left).toBeLessThanOrEqual(0);
    expect(layout!.top).toBeLessThanOrEqual(0);
    expect(layout!.left + layout!.width).toBeGreaterThanOrEqual(PLOT_LIST_THUMB_DISPLAY_SIZE);
    expect(layout!.top + layout!.height).toBeGreaterThanOrEqual(PLOT_LIST_THUMB_DISPLAY_SIZE);
    const bounds = tileGeoBounds(tile!.z, tile!.x, tile!.y);
    expect(bounds.north).toBeGreaterThan(offsetPlot.points[1]!.latitude);
    expect(bounds.south).toBeLessThan(offsetPlot.points[3]!.latitude);
  });
});
