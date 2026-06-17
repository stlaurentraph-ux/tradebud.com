import { describe, expect, it } from 'vitest';

import {
  geometryCaptureNeedsReview,
  normalizePlotGeometryCapture,
} from './plot-geometry-capture';

describe('plot-geometry-capture', () => {
  it('normalizes snake_case API payload', () => {
    const row = normalizePlotGeometryCapture({
      geometry_confidence_tier: 'low',
      geometry_confidence_score: 41,
      horizontal_uncertainty_m: 16,
      capture_method: 'MOBILE_GPS',
      imagery_source: null,
      offline_tiles_pack_id: null,
      recorded_at: 1_700_000_000_000,
    });
    expect(row?.geometryConfidenceTier).toBe('low');
    expect(row?.horizontalUncertaintyM).toBe(16);
  });

  it('flags low and moderate tiers for review', () => {
    expect(
      geometryCaptureNeedsReview({
        geometryConfidenceTier: 'low',
        geometryConfidenceScore: 30,
        horizontalUncertaintyM: 20,
        captureMethod: 'MOBILE_GPS',
        imagerySource: null,
        offlineTilesPackId: null,
        recordedAt: null,
      }),
    ).toBe(true);
    expect(
      geometryCaptureNeedsReview({
        geometryConfidenceTier: 'high',
        geometryConfidenceScore: 90,
        horizontalUncertaintyM: 4,
        captureMethod: 'WEB_DRAW',
        imagerySource: 'esri_online',
        offlineTilesPackId: null,
        recordedAt: null,
      }),
    ).toBe(false);
  });
});
