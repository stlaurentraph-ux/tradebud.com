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
export function formatGeometryQualityUserMessage(
  issue: Pick<GeometryQualityIssue, 'code' | 'details'>,
): string {
  switch (issue.code) {
    case 'GEO-104':
      return 'Your boundary crosses itself. Walk the perimeter again without cutting across your path.';
    case 'GEO-105': {
      const plotName = String(issue.details?.overlapPlotName ?? 'another plot');
      return `This boundary overlaps "${plotName}". Move the line or remove the duplicate parcel.`;
    }
    case 'GEO-106':
      if (issue.details?.areaHa != null) {
        return 'This parcel is too small for a walked boundary. Use a single GPS point for very small plots, or walk the edge again.';
      }
      return 'This shape looks like a bad GPS walk (thin sliver). Walk the perimeter again at a steady pace.';
    default:
      return 'Invalid boundary. Please walk or redraw the perimeter.';
  }
}

export function buildPolygonQualityIssues(params: {
  metrics: GeometryQualityMetrics;
  overlaps: Array<{ plotId: string; plotName: string; farmerId: string; overlapHa: number; smallerAreaHa: number }>;
}): GeometryQualityIssue[] {
  const issues: GeometryQualityIssue[] = [];
  const { metrics, overlaps } = params;
  if (metrics.isSimple === false) {
    const details = { kind: 'self_intersection' as const };
    issues.push({
      code: 'GEO-104',
      severity: 'error',
      message: formatGeometryQualityUserMessage({ code: 'GEO-104', details }),
      details,
    });
  }
  for (const overlap of overlaps) {
    const ratio = overlap.smallerAreaHa > 0 ? overlap.overlapHa / overlap.smallerAreaHa : overlap.overlapHa;
    if (overlap.overlapHa >= MIN_PARCEL_OVERLAP_HA || ratio >= MIN_PARCEL_OVERLAP_RATIO) {
      const details = {
        overlapPlotId: overlap.plotId,
        overlapPlotName: overlap.plotName,
        overlapFarmerId: overlap.farmerId,
        overlapHa: overlap.overlapHa,
        overlapRatio: ratio,
      };
      issues.push({
        code: 'GEO-105',
        severity: 'error',
        message: formatGeometryQualityUserMessage({ code: 'GEO-105', details }),
        details,
      });
    }
  }
  if (metrics.areaHa != null && metrics.areaHa > 0 && metrics.areaHa < MIN_POLYGON_AREA_HA) {
    const details = { areaHa: metrics.areaHa, minAreaHa: MIN_POLYGON_AREA_HA, kind: 'micro_area' as const };
    issues.push({
      code: 'GEO-106',
      severity: 'error',
      message: formatGeometryQualityUserMessage({ code: 'GEO-106', details }),
      details,
    });
  }
  if (metrics.compactness != null && metrics.compactness < MIN_POLYGON_COMPACTNESS && metrics.areaHa != null && metrics.areaHa >= MIN_POLYGON_AREA_HA) {
    const details = {
      compactness: metrics.compactness,
      minCompactness: MIN_POLYGON_COMPACTNESS,
      kind: 'sliver' as const,
    };
    issues.push({
      code: 'GEO-106',
      severity: 'error',
      message: formatGeometryQualityUserMessage({ code: 'GEO-106', details }),
      details,
    });
  }
  return issues;
}
