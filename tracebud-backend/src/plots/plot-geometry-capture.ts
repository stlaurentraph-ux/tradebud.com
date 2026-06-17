export type PlotGeometryCapturePayload = {
  geometry_confidence_tier: 'high' | 'moderate' | 'low';
  geometry_confidence_score: number;
  horizontal_uncertainty_m: number | null;
  capture_method: 'MOBILE_GPS' | 'WEB_DRAW';
  imagery_source: 'esri_online' | 'offline_pack' | null;
  offline_tiles_pack_id: string | null;
  recorded_at: number;
};

export function normalizePlotGeometryCaptureInput(
  input: unknown,
): PlotGeometryCapturePayload | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const tier = row.geometryConfidenceTier ?? row.geometry_confidence_tier;
  if (tier !== 'high' && tier !== 'moderate' && tier !== 'low') return null;

  const scoreRaw = row.geometryConfidenceScore ?? row.geometry_confidence_score;
  const score = Number(scoreRaw);
  if (!Number.isFinite(score)) return null;

  const captureRaw = row.captureMethod ?? row.capture_method;
  if (captureRaw !== 'MOBILE_GPS' && captureRaw !== 'WEB_DRAW') return null;

  const horizontalRaw = row.horizontalUncertaintyM ?? row.horizontal_uncertainty_m;
  const horizontalUncertaintyM =
    horizontalRaw == null
      ? null
      : Number.isFinite(Number(horizontalRaw))
        ? Number(horizontalRaw)
        : null;

  const imageryRaw = row.imagerySource ?? row.imagery_source;
  const imagerySource =
    imageryRaw === 'esri_online' || imageryRaw === 'offline_pack' ? imageryRaw : null;

  const packRaw = row.offlineTilesPackId ?? row.offline_tiles_pack_id;
  const offlineTilesPackId =
    typeof packRaw === 'string' && packRaw.length > 0 ? packRaw : null;

  const recordedRaw = row.recordedAt ?? row.recorded_at;
  const recordedAt =
    typeof recordedRaw === 'number' && Number.isFinite(recordedRaw)
      ? recordedRaw
      : Date.now();

  return {
    geometry_confidence_tier: tier,
    geometry_confidence_score: Math.round(score),
    horizontal_uncertainty_m: horizontalUncertaintyM,
    capture_method: captureRaw,
    imagery_source: imagerySource,
    offline_tiles_pack_id: offlineTilesPackId,
    recorded_at: recordedAt,
  };
}
