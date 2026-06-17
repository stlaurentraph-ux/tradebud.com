import { normalizePlotGeometryCaptureInput } from './plot-geometry-capture';

describe('plot-geometry-capture', () => {
  it('normalizes mobile geometry capture payload', () => {
    const payload = normalizePlotGeometryCaptureInput({
      geometryConfidenceTier: 'low',
      geometryConfidenceScore: 44,
      horizontalUncertaintyM: 17,
      captureMethod: 'MOBILE_GPS',
      imagerySource: null,
      offlineTilesPackId: null,
      recordedAt: 1_700_000_000_000,
    });
    expect(payload).toEqual({
      geometry_confidence_tier: 'low',
      geometry_confidence_score: 44,
      horizontal_uncertainty_m: 17,
      capture_method: 'MOBILE_GPS',
      imagery_source: null,
      offline_tiles_pack_id: null,
      recorded_at: 1_700_000_000_000,
    });
  });

  it('rejects invalid tier', () => {
    expect(
      normalizePlotGeometryCaptureInput({
        geometryConfidenceTier: 'unknown',
        geometryConfidenceScore: 10,
        captureMethod: 'MOBILE_GPS',
      }),
    ).toBeNull();
  });
});
