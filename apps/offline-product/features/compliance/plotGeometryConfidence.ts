import { hasSelfIntersection, type LatLng } from '@/features/compliance/plotGeometryQuality';

export type GeometryCaptureMethod = 'walk' | 'pin' | 'draw' | 'centroid';

export type GeometryConfidenceTier = 'high' | 'moderate' | 'low';

export type GeometryConfidenceReasonCode =
  | 'gps_poor'
  | 'gps_unknown'
  | 'sparse_boundary'
  | 'point_uncertainty'
  | 'area_discrepancy'
  | 'self_intersection'
  | 'manual_trace_assisted';

export type GeometryConfidenceRecommendedAction =
  | 'none'
  | 'retry_capture'
  | 'use_manual_trace'
  | 'review_on_upload';

export type GeometryConfidenceAssessment = {
  tier: GeometryConfidenceTier;
  /** 0–100; higher is more trustworthy for compliance screening. */
  score: number;
  horizontalUncertaintyM: number | null;
  reasons: GeometryConfidenceReasonCode[];
  recommendedAction: GeometryConfidenceRecommendedAction;
};

const POOR_GPS_M = 10;
const VERY_POOR_GPS_M = 15;

function verticesPerHa(vertexCount: number, areaHa: number): number {
  if (areaHa <= 0) return vertexCount;
  return vertexCount / areaHa;
}

function tierFromScore(score: number): GeometryConfidenceTier {
  if (score >= 75) return 'high';
  if (score >= 50) return 'moderate';
  return 'low';
}

/**
 * Estimates how trustworthy a captured boundary is for EUDR filing without
 * silently reshaping geometry. Human manual trace on satellite is treated as
 * high intent; GPS walk/pin scores depend on precision and vertex density.
 */
export function assessGeometryConfidence(params: {
  captureMethod: GeometryCaptureMethod;
  kind: 'point' | 'polygon';
  precisionMeters: number | null;
  points: LatLng[];
  areaHa: number;
  declaredAreaHa?: number | null;
}): GeometryConfidenceAssessment {
  const reasons: GeometryConfidenceReasonCode[] = [];
  let score = 80;

  const vertexCount = params.points.length;
  const precision = params.precisionMeters;

  if (params.kind === 'point' || params.captureMethod === 'pin') {
    score = 62;
    reasons.push('point_uncertainty');
    if (precision == null) {
      score -= 12;
      reasons.push('gps_unknown');
    } else if (precision > VERY_POOR_GPS_M) {
      score -= 22;
      reasons.push('gps_poor');
    } else if (precision > POOR_GPS_M) {
      score -= 12;
      reasons.push('gps_poor');
    }
  } else if (params.captureMethod === 'draw') {
    score = 88;
    reasons.push('manual_trace_assisted');
    if (vertexCount < 3) {
      score = 20;
    } else if (hasSelfIntersection(params.points)) {
      score = 25;
      reasons.push('self_intersection');
    }
  } else {
    if (precision == null) {
      score -= 10;
      reasons.push('gps_unknown');
    } else if (precision > VERY_POOR_GPS_M) {
      score -= 28;
      reasons.push('gps_poor');
    } else if (precision > POOR_GPS_M) {
      score -= 16;
      reasons.push('gps_poor');
    }

    if (vertexCount >= 3 && params.areaHa >= 1 && verticesPerHa(vertexCount, params.areaHa) < 8) {
      score -= 12;
      reasons.push('sparse_boundary');
    }

    if (vertexCount >= 3 && hasSelfIntersection(params.points)) {
      score = Math.min(score, 30);
      if (!reasons.includes('self_intersection')) {
        reasons.push('self_intersection');
      }
    }
  }

  if (
    params.declaredAreaHa != null &&
    Number.isFinite(params.declaredAreaHa) &&
    params.declaredAreaHa > 0 &&
    params.areaHa > 0
  ) {
    const pct = (Math.abs(params.areaHa - params.declaredAreaHa) / params.declaredAreaHa) * 100;
    if (pct > 3) {
      score -= Math.min(20, Math.round(pct));
      reasons.push('area_discrepancy');
    }
  }

  score = Math.max(0, Math.min(100, score));
  const tier = tierFromScore(score);

  let recommendedAction: GeometryConfidenceRecommendedAction = 'none';
  if (tier === 'low') {
    if (params.captureMethod === 'walk' || params.captureMethod === 'centroid') {
      recommendedAction = 'use_manual_trace';
    } else if (params.captureMethod === 'pin') {
      recommendedAction = 'retry_capture';
    } else if (params.captureMethod === 'draw' && reasons.includes('self_intersection')) {
      recommendedAction = 'retry_capture';
    } else {
      recommendedAction = 'review_on_upload';
    }
  } else if (tier === 'moderate' && reasons.includes('gps_poor')) {
    recommendedAction =
      params.captureMethod === 'walk' ? 'use_manual_trace' : 'review_on_upload';
  }

  return {
    tier,
    score,
    horizontalUncertaintyM: precision,
    reasons,
    recommendedAction,
  };
}
