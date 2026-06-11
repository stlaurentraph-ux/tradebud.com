import { buildPolygonQualityIssues, polygonCompactness } from './plot-geometry-quality';

describe('plot-geometry-quality', () => {
  it('flags self-intersection as GEO-104', () => {
    const issues = buildPolygonQualityIssues({
      metrics: { areaHa: 1, perimeterM: 500, vertexCount: 6, compactness: 0.5, isSimple: false },
      overlaps: [],
    });
    expect(issues.some((i) => i.code === 'GEO-104')).toBe(true);
  });

  it('flags parcel overlap as GEO-105', () => {
    const issues = buildPolygonQualityIssues({
      metrics: { areaHa: 2, perimeterM: 600, vertexCount: 5, compactness: 0.4, isSimple: true },
      overlaps: [
        { plotId: 'p2', plotName: 'Other', farmerId: 'f2', overlapHa: 0.5, smallerAreaHa: 2 },
      ],
    });
    expect(issues.some((i) => i.code === 'GEO-105')).toBe(true);
    expect(issues.find((i) => i.code === 'GEO-105')?.message).toContain('Other');
  });

  it('uses farmer-friendly copy without GEO code prefix', () => {
    const issues = buildPolygonQualityIssues({
      metrics: { areaHa: 1, perimeterM: 500, vertexCount: 6, compactness: 0.5, isSimple: false },
      overlaps: [],
    });
    expect(issues[0]?.message).not.toMatch(/^GEO-/);
    expect(issues[0]?.message).toContain('crosses itself');
  });

  it('computes compactness for near-circle shapes', () => {
    expect(polygonCompactness(1, 356)).toBeCloseTo(1, 0);
  });
});
