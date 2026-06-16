import { describe, expect, it } from 'vitest';

import { computeRegionFromPlot } from './plotMapRegion';

describe('computeRegionFromPlot', () => {
  it('centers on polygon bounds with padding', () => {
    const region = computeRegionFromPlot({
      id: 'p1',
      farmerId: 'f1',
      name: 'North',
      kind: 'polygon',
      areaHectares: 2,
      areaSquareMeters: 20000,
      points: [
        { latitude: 1, longitude: 1 },
        { latitude: 1.001, longitude: 1 },
        { latitude: 1.001, longitude: 1.001 },
      ],
      createdAt: 0,
    });
    expect(region).toBeDefined();
    expect(region!.latitude).toBeCloseTo(1.0005, 4);
    expect(region!.longitude).toBeCloseTo(1.0005, 4);
    expect(region!.latitudeDelta).toBeGreaterThan(0);
  });

  it('returns undefined when plot has no points', () => {
    expect(
      computeRegionFromPlot({
        id: 'p2',
        farmerId: 'f1',
        name: 'Empty',
        kind: 'point',
        areaHectares: 0,
        areaSquareMeters: 0,
        points: [],
        createdAt: 0,
      }),
    ).toBeUndefined();
  });
});
