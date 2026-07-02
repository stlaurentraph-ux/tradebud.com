import { describe, expect, it } from 'vitest';

import type { Plot } from '@/features/state/AppStateContext';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailStore';
import {
  plotThumbnailPointsFitInnerFrame,
  projectPlotCentroidToThumbnail,
  projectPlotToThumbnail,
} from '@/features/mapping/plotThumbnailGeometry';

const polygonPlot: Plot = {
  id: 'plot-polygon',
  name: 'Plot 2',
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

const elongatedPlot: Plot = {
  ...polygonPlot,
  id: 'plot-elongated',
  points: [
    { latitude: 4.7120, longitude: -74.0725 },
    { latitude: 4.7120, longitude: -74.0715 },
    { latitude: 4.7118, longitude: -74.0715 },
    { latitude: 4.7118, longitude: -74.0725 },
  ],
};

describe('plotThumbnailGeometry', () => {
  it('centers the plot centroid in the thumbnail frame', () => {
    const size = PLOT_LIST_THUMB_DISPLAY_SIZE;
    const centroid = projectPlotCentroidToThumbnail(polygonPlot, size);
    expect(centroid).not.toBeNull();
    expect(centroid!.x).toBeCloseTo(size / 2, 0);
    expect(centroid!.y).toBeCloseTo(size / 2, 0);
  });

  it('keeps polygon vertices inside the safe inner frame with margin', () => {
    const size = PLOT_LIST_THUMB_DISPLAY_SIZE;
    const points = projectPlotToThumbnail(polygonPlot, size);
    expect(plotThumbnailPointsFitInnerFrame(points, size, 10, 2)).toBe(true);
  });

  it('keeps elongated polygons fully visible with symmetric square framing', () => {
    const size = PLOT_LIST_THUMB_DISPLAY_SIZE;
    const points = projectPlotToThumbnail(elongatedPlot, size);
    expect(plotThumbnailPointsFitInnerFrame(points, size, 10, 2)).toBe(true);
    const centroid = projectPlotCentroidToThumbnail(elongatedPlot, size);
    expect(centroid!.x).toBeCloseTo(size / 2, 0);
    expect(centroid!.y).toBeCloseTo(size / 2, 0);
  });
});
