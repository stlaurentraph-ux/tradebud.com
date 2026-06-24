import { describe, expect, it } from 'vitest';

import {
  isWalkStartGateReady,
  resolveWalkLiveHint,
  shouldSuggestAlternateCapture,
  walkStartGateSecondsRemaining,
  WALK_CAPTURE_WEAK_GPS_SUGGEST_SECONDS,
} from './walkCaptureCoaching';

describe('walkCaptureCoaching', () => {
  it('requires stable good GPS for start gate unless overridden', () => {
    expect(
      isWalkStartGateReady({ precisionMeters: 8, stableSeconds: 5, override: false }),
    ).toBe(true);
    expect(
      isWalkStartGateReady({ precisionMeters: 8, stableSeconds: 3, override: false }),
    ).toBe(false);
    expect(
      isWalkStartGateReady({ precisionMeters: 14, stableSeconds: 10, override: false }),
    ).toBe(false);
    expect(
      isWalkStartGateReady({ precisionMeters: null, stableSeconds: 10, override: false }),
    ).toBe(false);
    expect(
      isWalkStartGateReady({ precisionMeters: 20, stableSeconds: 0, override: true }),
    ).toBe(true);
  });

  it('counts down start gate seconds remaining', () => {
    expect(walkStartGateSecondsRemaining(0)).toBe(5);
    expect(walkStartGateSecondsRemaining(4)).toBe(1);
    expect(walkStartGateSecondsRemaining(5)).toBe(0);
  });

  it('prioritises intersection warning over GPS hints', () => {
    const hint = resolveWalkLiveHint({
      isRecording: true,
      pointCount: 4,
      areaHectares: 0.5,
      precisionMeters: 20,
      speedMps: 3,
      gpsFixDropped: true,
      boundaryPoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 },
        { latitude: 1, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ],
    });
    expect(hint?.key).toBe('walk_coach_intersection');
    expect(hint?.tone).toBe('warning');
  });

  it('shows GPS paused when fixes are dropped', () => {
    const hint = resolveWalkLiveHint({
      isRecording: true,
      pointCount: 2,
      areaHectares: 0,
      precisionMeters: 14,
      speedMps: 1,
      gpsFixDropped: true,
      boundaryPoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 0.001, longitude: 0 },
      ],
    });
    expect(hint?.key).toBe('walk_coach_gps_paused');
  });

  it('suggests alternate capture after prolonged weak GPS', () => {
    expect(
      shouldSuggestAlternateCapture({
        isRecording: true,
        alreadySuggested: false,
        weakGpsSeconds: WALK_CAPTURE_WEAK_GPS_SUGGEST_SECONDS,
      }),
    ).toBe(true);
    expect(
      shouldSuggestAlternateCapture({
        isRecording: true,
        alreadySuggested: true,
        weakGpsSeconds: 120,
      }),
    ).toBe(false);
  });
});
