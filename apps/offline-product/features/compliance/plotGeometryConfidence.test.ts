import { describe, expect, it } from 'vitest';

import { assessGeometryConfidence } from './plotGeometryConfidence';

const square: { latitude: number; longitude: number }[] = [
  { latitude: 14.1, longitude: -87.2 },
  { latitude: 14.101, longitude: -87.2 },
  { latitude: 14.101, longitude: -87.199 },
  { latitude: 14.1, longitude: -87.199 },
];

describe('assessGeometryConfidence', () => {
  it('rates manual draw on satellite as high when polygon is valid', () => {
    const result = assessGeometryConfidence({
      captureMethod: 'draw',
      kind: 'polygon',
      precisionMeters: 18,
      points: square,
      areaHa: 1.2,
    });
    expect(result.tier).toBe('high');
    expect(result.reasons).toContain('manual_trace_assisted');
    expect(result.recommendedAction).toBe('none');
  });

  it('downgrades walked polygons with poor GPS', () => {
    const result = assessGeometryConfidence({
      captureMethod: 'walk',
      kind: 'polygon',
      precisionMeters: 16,
      points: square,
      areaHa: 2,
    });
    expect(result.tier).not.toBe('high');
    expect(result.reasons).toContain('gps_poor');
    expect(result.recommendedAction).toBe('use_manual_trace');
  });

  it('caps pin plots at moderate and suggests retry when GPS is very poor', () => {
    const result = assessGeometryConfidence({
      captureMethod: 'pin',
      kind: 'point',
      precisionMeters: 20,
      points: [{ latitude: 14.1, longitude: -87.2 }],
      areaHa: 0,
    });
    expect(result.tier).toBe('low');
    expect(result.reasons).toContain('point_uncertainty');
    expect(result.recommendedAction).toBe('retry_capture');
  });

  it('flags declared area drift as a confidence reason', () => {
    const result = assessGeometryConfidence({
      captureMethod: 'walk',
      kind: 'polygon',
      precisionMeters: 4,
      points: square,
      areaHa: 2.5,
      declaredAreaHa: 2,
    });
    expect(result.reasons).toContain('area_discrepancy');
  });
});
