import { hasSelfIntersection, type LatLng } from '@/features/compliance/plotGeometryQuality';

/** Max horizontal accuracy (m) to accept a walked vertex after the first fix. */
export const WALK_CAPTURE_MAX_ACCURACY_M = 12;
/** Start gate: require at most this accuracy (m) before walking. */
export const WALK_CAPTURE_START_GATE_MAX_M = 10;
/** Start gate: seconds of stable good GPS before auto-ready. */
export const WALK_CAPTURE_START_GATE_SECONDS = 5;
/** Walking faster than this (m/s) triggers a slow-down coach hint. */
export const WALK_CAPTURE_FAST_SPEED_MPS = 1.8;
/** Fair vs weak GPS split for live coaching (m). */
export const WALK_CAPTURE_WEAK_GPS_THRESHOLD_M = 10;
/** Poor GPS — open sky / hold phone hints (m). */
export const WALK_CAPTURE_POOR_GPS_M = 15;
/** Suggest mark-corners / trace-on-map after this many weak-GPS seconds. */
export const WALK_CAPTURE_WEAK_GPS_SUGGEST_SECONDS = 60;

export type WalkCoachHintTone = 'neutral' | 'caution' | 'warning';

export type WalkCoachHint = {
  key: string;
  tone: WalkCoachHintTone;
  params?: Record<string, string | number>;
};

export function isWalkStartGateReady(params: {
  precisionMeters: number | null;
  stableSeconds: number;
  override: boolean;
}): boolean {
  if (params.override) return true;
  if (params.precisionMeters == null) return false;
  return (
    params.precisionMeters <= WALK_CAPTURE_START_GATE_MAX_M &&
    params.stableSeconds >= WALK_CAPTURE_START_GATE_SECONDS
  );
}

export function walkStartGateSecondsRemaining(stableSeconds: number): number {
  return Math.max(0, WALK_CAPTURE_START_GATE_SECONDS - stableSeconds);
}

export function isWeakGpsForWalkCoach(precisionMeters: number | null): boolean {
  return precisionMeters == null || precisionMeters > WALK_CAPTURE_WEAK_GPS_THRESHOLD_M;
}

export function resolveWalkLiveHint(params: {
  isRecording: boolean;
  pointCount: number;
  areaHectares: number;
  precisionMeters: number | null;
  speedMps: number | null;
  gpsFixDropped: boolean;
  boundaryPoints: LatLng[];
}): WalkCoachHint | null {
  if (!params.isRecording) {
    if (params.pointCount >= 3) {
      return { key: 'walk_hint_close_loop', tone: 'neutral' };
    }
    return null;
  }

  if (params.pointCount >= 4 && hasSelfIntersection(params.boundaryPoints)) {
    return { key: 'walk_coach_intersection', tone: 'warning' };
  }

  if (params.gpsFixDropped && params.pointCount > 0) {
    return { key: 'walk_coach_gps_paused', tone: 'caution' };
  }

  if (params.speedMps != null && params.speedMps > WALK_CAPTURE_FAST_SPEED_MPS) {
    return { key: 'walk_coach_slow_down', tone: 'caution' };
  }

  if (params.precisionMeters != null && params.precisionMeters > WALK_CAPTURE_POOR_GPS_M) {
    return { key: 'walk_coach_open_sky', tone: 'caution' };
  }

  if (params.precisionMeters != null && params.precisionMeters > WALK_CAPTURE_WEAK_GPS_THRESHOLD_M) {
    return { key: 'walk_coach_fair_gps', tone: 'neutral' };
  }

  if (params.pointCount >= 3 && params.areaHectares >= 0.02) {
    return { key: 'walk_hint_close_loop', tone: 'neutral' };
  }

  return { key: 'walk_tip_walk_edge', tone: 'neutral' };
}

export function shouldSuggestAlternateCapture(params: {
  weakGpsSeconds: number;
  alreadySuggested: boolean;
  isRecording: boolean;
}): boolean {
  return (
    params.isRecording &&
    !params.alreadySuggested &&
    params.weakGpsSeconds >= WALK_CAPTURE_WEAK_GPS_SUGGEST_SECONDS
  );
}
