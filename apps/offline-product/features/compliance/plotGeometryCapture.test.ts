import { describe, expect, it } from 'vitest';

import {
  buildPlotGeometryCaptureMetadata,
  mapMobileCaptureMethodToApi,
  parsePlotGeometryCaptureMetadata,
} from './plotGeometryCapture';

describe('plotGeometryCapture', () => {
  it('maps draw to WEB_DRAW and walk to MOBILE_GPS', () => {
    expect(mapMobileCaptureMethodToApi('draw')).toBe('WEB_DRAW');
    expect(mapMobileCaptureMethodToApi('walk')).toBe('MOBILE_GPS');
  });

  it('builds metadata with offline imagery for manual trace', () => {
    const meta = buildPlotGeometryCaptureMetadata({
      captureMethod: 'draw',
      assessment: {
        tier: 'high',
        score: 88,
        horizontalUncertaintyM: 14,
        reasons: ['manual_trace_assisted'],
        recommendedAction: 'none',
      },
      manualTraceImagery: { imagerySource: 'offline_pack', packId: 'near-123' },
      recordedAt: 1_700_000_000_000,
    });
    expect(meta.captureMethod).toBe('WEB_DRAW');
    expect(meta.imagerySource).toBe('offline_pack');
    expect(meta.offlineTilesPackId).toBe('near-123');
    expect(meta.geometryConfidenceTier).toBe('high');
  });

  it('round-trips through JSON parse helper', () => {
    const meta = buildPlotGeometryCaptureMetadata({
      captureMethod: 'walk',
      assessment: {
        tier: 'low',
        score: 42,
        horizontalUncertaintyM: 18,
        reasons: ['gps_poor'],
        recommendedAction: 'use_manual_trace',
      },
    });
    const parsed = parsePlotGeometryCaptureMetadata(JSON.stringify(meta));
    expect(parsed?.geometryConfidenceTier).toBe('low');
    expect(parsed?.captureMethod).toBe('MOBILE_GPS');
  });
});
