import {
  assertPointGeometryAllowed,
  pointBufferRadiusMeters,
  POLYGON_REQUIRED_MIN_AREA_HA,
  requiresPolygonGeometry,
} from './plot-geometry-policy';

describe('plot-geometry-policy', () => {
  it('requires polygon at 4 ha and above', () => {
    expect(requiresPolygonGeometry(3.99)).toBe(false);
    expect(requiresPolygonGeometry(POLYGON_REQUIRED_MIN_AREA_HA)).toBe(true);
    expect(requiresPolygonGeometry(10)).toBe(true);
  });

  it('rejects point geometry when declared area is >= 4 ha', () => {
    expect(() =>
      assertPointGeometryAllowed({ declaredAreaHa: 4, computedAreaHa: null }),
    ).toThrow('GEO-103');
    expect(() => assertPointGeometryAllowed({ declaredAreaHa: 1.2 })).not.toThrow();
  });

  it('uses 1 ha circular buffer radius (~56.4 m)', () => {
    expect(pointBufferRadiusMeters(1)).toBeCloseTo(56.42, 1);
  });
});
