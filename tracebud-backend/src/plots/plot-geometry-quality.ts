export type GeometryQualityCode = 'GEO-104' | 'GEO-105' | 'GEO-106';
export type GeometryQualitySeverity = 'error' | 'warning';
export type GeometryQualityIssue = {
  code: GeometryQualityCode;
  severity: GeometryQualitySeverity;
  message: string;
  details?: Record<string, unknown>;
};
export type GeometryQualityMetrics = {
  areaHa: number | null;
  perimeterM: number | null;
  vertexCount: number | null;
  compactness: number | null;
  isSimple: boolean | null;
};
export const MIN_POLYGON_AREA_HA = 0.01;
export const MIN_POLYGON_COMPACTNESS = 0.02;
export const MIN_PARCEL_OVERLAP_HA = 0.01;
export const MIN_PARCEL_OVERLAP_RATIO = 0.05;
export function polygonCompactness(areaHa: number, perimeterM: number): number | null {
  if (!Number.isFinite(areaHa) || !Number.isFinite(perimeterM) || areaHa <= 0 || perimeterM <= 0) return null;
  const areaM2 = areaHa * 10_000;
  return (4 * Math.PI * areaM2) / (perimeterM * perimeterM);
}
export function buildPolygonQualityIssues(params: {
  metrics: GeometryQualityMetrics;
  overlaps: Array<{ plotId: string; plotName: string; farmerId: string; overlapHa: number; smallerAreaHa: number }>;
}): GeometryQualityIssue[] {
  const issues: GeometryQualityIssue[] = [];
  const { metrics, overlaps } = params;
  if (metrics.isSimple === false) {
    issues.push({
      code: 'GEO-104',
      severity: 'error',
      message: 'GEO-104: Polygon boundary self-intersects. Walk or draw the perimeter again without crossing your own path.',
    });
  }
  for (const overlap of overlaps) {
    const ratio = overlap.smallerAreaHa > 0 ? overlap.overlapHa / overlap.smallerAreaHa : overlap.overlapHa;
    if (overlap.overlapHa >= MIN_PARCEL_OVERLAP_HA || ratio >= MIN_PARCEL_OVERLAP_RATIO) {
      issues.push({
        code: 'GEO-105',
        severity: 'error',
        message: 'GEO-105: Polygon overlaps another registered plot. Adjust the boundary or retire the duplicate parcel.',
        details: {
          overlapPlotId: overlap.plotId,
          overlapPlotName: overlap.plotName,
          overlapFarmerId: overlap.farmerId,
          overlapHa: overlap.overlapHa,
          overlapRatio: ratio,
        },
      });
    }
  }
  if (metrics.areaHa != null && metrics.areaHa > 0 && metrics.areaHa < MIN_POLYGON_AREA_HA) {
    issues.push({
      code: 'GEO-106',
      severity: 'error',
      message: 'GEO-106: Captured area is too small for a reliable polygon. Re-walk the boundary or use centroid capture for micro-plots.',
      details: { areaHa: metrics.areaHa, minAreaHa: MIN_POLYGON_AREA_HA },
    });
  }
  if (metrics.compactness != null && metrics.compactness < MIN_POLYGON_COMPACTNESS && metrics.areaHa != null && metrics.areaHa >= MIN_POLYGON_AREA_HA) {
    issues.push({
      code: 'GEO-106',
      severity: 'error',
      message: 'GEO-106: Polygon shape looks like a GPS sliver (bad capture). Re-walk the perimeter with steady pacing.',
      details: { compactness: metrics.compactness, minCompactness: MIN_POLYGON_COMPACTNESS },
    });
  }
  return issues;
}
