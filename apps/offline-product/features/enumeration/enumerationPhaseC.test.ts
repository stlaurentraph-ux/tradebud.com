import { describe, expect, it } from 'vitest';

import { buildPlotGeometryCaptureMetadata } from '@/features/compliance/plotGeometryCapture';
import { assessGeometryConfidence } from '@/features/compliance/plotGeometryConfidence';
import { resolveCaptureIntent } from '@/features/enumeration/resolveCaptureIntent';

describe('resolveCaptureIntent', () => {
  it('uses eudr_minimum for pin/point captures under 4 ha', () => {
    expect(
      resolveCaptureIntent({
        kind: 'point',
        captureMethod: 'pin',
        declaredAreaHa: 2.5,
      }),
    ).toBe('eudr_minimum');
  });

  it('uses full_boundary for walked polygons under 4 ha', () => {
    expect(
      resolveCaptureIntent({
        kind: 'polygon',
        captureMethod: 'walk',
        declaredAreaHa: 1.2,
      }),
    ).toBe('full_boundary');
  });

  it('uses full_boundary for polygons at or above 4 ha', () => {
    expect(
      resolveCaptureIntent({
        kind: 'polygon',
        captureMethod: 'draw',
        declaredAreaHa: 6,
      }),
    ).toBe('full_boundary');
  });
});

describe('geometryCapture metadata', () => {
  it('persists captureIntent on geometryCapture payload', () => {
    const assessment = assessGeometryConfidence({
      captureMethod: 'pin',
      kind: 'point',
      precisionMeters: 8,
      points: [{ latitude: 14.1, longitude: -87.2 }],
      areaHa: 0,
      declaredAreaHa: 2,
    });
    const metadata = buildPlotGeometryCaptureMetadata({
      captureMethod: 'pin',
      assessment,
      captureIntent: 'eudr_minimum',
    });
    expect(metadata.captureIntent).toBe('eudr_minimum');
  });
});
