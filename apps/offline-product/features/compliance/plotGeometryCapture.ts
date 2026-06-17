import type { GeometryConfidenceAssessment } from '@/features/compliance/plotGeometryConfidence';
import type { ManualTraceImagerySource } from '@/features/offlineTiles/manualTraceImagery';

export type PlotGeometryCaptureMethod = 'MOBILE_GPS' | 'WEB_DRAW';

export type PlotGeometryCaptureImagerySource = 'esri_online' | 'offline_pack';

export type PlotGeometryCaptureMetadata = {
  geometryConfidenceTier: 'high' | 'moderate' | 'low';
  geometryConfidenceScore: number;
  horizontalUncertaintyM: number | null;
  captureMethod: PlotGeometryCaptureMethod;
  imagerySource?: PlotGeometryCaptureImagerySource | null;
  offlineTilesPackId?: string | null;
  recordedAt: number;
};

export type MobileCaptureMethod = 'walk' | 'pin' | 'draw' | 'centroid';

export function mapMobileCaptureMethodToApi(
  method: MobileCaptureMethod,
): PlotGeometryCaptureMethod {
  return method === 'draw' ? 'WEB_DRAW' : 'MOBILE_GPS';
}

export function buildPlotGeometryCaptureMetadata(params: {
  captureMethod: MobileCaptureMethod;
  assessment: GeometryConfidenceAssessment;
  manualTraceImagery?: {
    imagerySource: ManualTraceImagerySource;
    packId: string | null;
  } | null;
  precisionMeters?: number | null;
  recordedAt?: number;
}): PlotGeometryCaptureMetadata {
  const imagerySource =
    params.captureMethod === 'draw' ? (params.manualTraceImagery?.imagerySource ?? null) : null;
  const offlineTilesPackId =
    params.captureMethod === 'draw' ? (params.manualTraceImagery?.packId ?? null) : null;

  return {
    geometryConfidenceTier: params.assessment.tier,
    geometryConfidenceScore: params.assessment.score,
    horizontalUncertaintyM:
      params.assessment.horizontalUncertaintyM ??
      (typeof params.precisionMeters === 'number' && Number.isFinite(params.precisionMeters)
        ? params.precisionMeters
        : null),
    captureMethod: mapMobileCaptureMethodToApi(params.captureMethod),
    imagerySource,
    offlineTilesPackId,
    recordedAt: params.recordedAt ?? Date.now(),
  };
}

export function parsePlotGeometryCaptureMetadata(
  raw: unknown,
): PlotGeometryCaptureMetadata | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return parsePlotGeometryCaptureMetadata(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const tier = row.geometryConfidenceTier;
  if (tier !== 'high' && tier !== 'moderate' && tier !== 'low') return null;
  const score = Number(row.geometryConfidenceScore);
  if (!Number.isFinite(score)) return null;
  const captureMethod = row.captureMethod;
  if (captureMethod !== 'MOBILE_GPS' && captureMethod !== 'WEB_DRAW') return null;

  const horizontalRaw = row.horizontalUncertaintyM;
  const horizontalUncertaintyM =
    horizontalRaw == null
      ? null
      : Number.isFinite(Number(horizontalRaw))
        ? Number(horizontalRaw)
        : null;

  const imagerySource = row.imagerySource;
  const parsedImagery =
    imagerySource === 'esri_online' || imagerySource === 'offline_pack' ? imagerySource : null;

  return {
    geometryConfidenceTier: tier,
    geometryConfidenceScore: score,
    horizontalUncertaintyM,
    captureMethod,
    imagerySource: parsedImagery,
    offlineTilesPackId:
      typeof row.offlineTilesPackId === 'string' && row.offlineTilesPackId.length > 0
        ? row.offlineTilesPackId
        : null,
    recordedAt:
      typeof row.recordedAt === 'number' && Number.isFinite(row.recordedAt)
        ? row.recordedAt
        : Date.now(),
  };
}
