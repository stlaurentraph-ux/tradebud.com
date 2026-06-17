import { describe, expect, it } from 'vitest';

import type { LatLng } from './plot-map-preview-geometry';
import {
  areaVariancePercent,
  polygonAreaHectares,
  simplifyPolygonRing,
} from './plot-geometry-simplify';

const square: LatLng[] = [
  { lat: 14.1, lng: -87.2 },
  { lat: 14.101, lng: -87.2 },
  { lat: 14.101, lng: -87.199 },
  { lat: 14.1, lng: -87.199 },
  { lat: 14.1, lng: -87.2 },
];

describe('plot-geometry-simplify', () => {
  it('reduces vertex count for noisy rings', () => {
    const noisy: LatLng[] = [
      { lat: 14.1, lng: -87.2 },
      { lat: 14.1002, lng: -87.1999 },
      { lat: 14.1005, lng: -87.1998 },
      { lat: 14.1008, lng: -87.1997 },
      { lat: 14.101, lng: -87.2 },
      { lat: 14.101, lng: -87.199 },
      { lat: 14.1, lng: -87.199 },
      { lat: 14.1, lng: -87.2 },
    ];
    const simplified = simplifyPolygonRing(noisy, 3);
    expect(simplified.length).toBeLessThan(6);
  });

  it('keeps area close for a square under moderate tolerance', () => {
    const simplified = simplifyPolygonRing(square, 8);
    const before = polygonAreaHectares(square);
    const after = polygonAreaHectares(simplified);
    const variance = areaVariancePercent(before, after);
    expect(variance).not.toBeNull();
    expect(variance!).toBeLessThan(5);
  });
});
