import { describe, expect, it } from 'vitest';

import { projectPlotToThumbnail, thumbnailPointsToSvg } from '@/features/mapping/plotThumbnailGeometry';
import type { Plot } from '@/features/state/AppStateContext';

const polygonPlot: Plot = {
  id: 'plot-1',
  name: 'North field',
  kind: 'polygon',
  farmerId: 'farmer-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  areaHectares: 1.2,
  areaSquareMeters: 12000,
  points: [
    { latitude: -1.0, longitude: 30.0 },
    { latitude: -1.001, longitude: 30.0 },
    { latitude: -1.001, longitude: 30.001 },
    { latitude: -1.0, longitude: 30.001 },
  ],
};

describe('plotThumbnailGeometry', () => {
  it('projects polygon points into thumbnail bounds', () => {
    const projected = projectPlotToThumbnail(polygonPlot, 88);
    expect(projected).toHaveLength(4);
    for (const point of projected) {
      expect(point.x).toBeGreaterThanOrEqual(8);
      expect(point.x).toBeLessThanOrEqual(80);
      expect(point.y).toBeGreaterThanOrEqual(8);
      expect(point.y).toBeLessThanOrEqual(80);
    }
  });

  it('formats svg point list', () => {
    const projected = projectPlotToThumbnail(polygonPlot, 88);
    expect(thumbnailPointsToSvg(projected)).toMatch(/^\d+\.\d+,\d+\.\d+( \d+\.\d+,\d+\.\d+)*$/);
  });
});
