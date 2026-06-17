export type PlotGeometryCaptureRecord = {
  geometryConfidenceTier: 'high' | 'moderate' | 'low';
  geometryConfidenceScore: number;
  horizontalUncertaintyM: number | null;
  captureMethod: 'MOBILE_GPS' | 'WEB_DRAW';
  imagerySource: 'esri_online' | 'offline_pack' | null;
  offlineTilesPackId: string | null;
  recordedAt: number | null;
};

export function normalizePlotGeometryCapture(
  raw: unknown,
): PlotGeometryCaptureRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const tier = row.geometry_confidence_tier ?? row.geometryConfidenceTier;
  if (tier !== 'high' && tier !== 'moderate' && tier !== 'low') return null;

  const scoreRaw = row.geometry_confidence_score ?? row.geometryConfidenceScore;
  const score = Number(scoreRaw);
  if (!Number.isFinite(score)) return null;

  const captureRaw = row.capture_method ?? row.captureMethod;
  if (captureRaw !== 'MOBILE_GPS' && captureRaw !== 'WEB_DRAW') return null;

  const horizontalRaw = row.horizontal_uncertainty_m ?? row.horizontalUncertaintyM;
  const horizontalUncertaintyM =
    horizontalRaw == null
      ? null
      : Number.isFinite(Number(horizontalRaw))
        ? Number(horizontalRaw)
        : null;

  const imageryRaw = row.imagery_source ?? row.imagerySource;
  const imagerySource =
    imageryRaw === 'esri_online' || imageryRaw === 'offline_pack' ? imageryRaw : null;

  const packRaw = row.offline_tiles_pack_id ?? row.offlineTilesPackId;
  const offlineTilesPackId =
    typeof packRaw === 'string' && packRaw.length > 0 ? packRaw : null;

  const recordedRaw = row.recorded_at ?? row.recordedAt;
  const recordedAt =
    recordedRaw == null
      ? null
      : Number.isFinite(Number(recordedRaw))
        ? Number(recordedRaw)
        : null;

  return {
    geometryConfidenceTier: tier,
    geometryConfidenceScore: score,
    horizontalUncertaintyM,
    captureMethod: captureRaw,
    imagerySource,
    offlineTilesPackId,
    recordedAt,
  };
}

export function geometryCaptureNeedsReview(
  capture: PlotGeometryCaptureRecord | null | undefined,
): boolean {
  return capture?.geometryConfidenceTier === 'low' || capture?.geometryConfidenceTier === 'moderate';
}
