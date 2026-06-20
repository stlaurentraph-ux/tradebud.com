import type { TranslateFn } from '@/features/i18n/translate';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type LocalPlotPolygonRef = {
  id: string;
  name: string;
  points: LatLng[];
  areaHectares?: number;
};

export type LocalGeometryQualityCode = 'GEO-104' | 'GEO-105' | 'GEO-106';
export type LocalGeometryQualitySeverity = 'error' | 'warning';

export type LocalGeometryQualityIssue = {
  code: LocalGeometryQualityCode;
  severity: LocalGeometryQualitySeverity;
  message: string;
  details?: Record<string, unknown>;
};

export const MIN_POLYGON_AREA_HA = 0.01;
export const MIN_POLYGON_COMPACTNESS = 0.02;
export const MIN_PARCEL_OVERLAP_HA = 0.01;
export const MIN_PARCEL_OVERLAP_RATIO = 0.05;
/** Two point plots closer than this are treated as duplicate parcels. */
export const MIN_POINT_PLOT_SEPARATION_M = 25;

type XY = { x: number; y: number };

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function projectRing(points: LatLng[]): XY[] {
  if (points.length === 0) return [];
  const lat0 = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const lat0Rad = toRad(lat0);
  return points.map((p) => ({
    x: EARTH_RADIUS_M * toRad(p.longitude) * Math.cos(lat0Rad),
    y: EARTH_RADIUS_M * toRad(p.latitude),
  }));
}

export function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

  const d1x = p2.latitude - p1.latitude;
  const d1y = p2.longitude - p1.longitude;
  const d2x = p4.latitude - p3.latitude;
  const d2y = p4.longitude - p3.longitude;

  const denominator = cross(d1x, d1y, d2x, d2y);
  if (denominator === 0) {
    return false;
  }

  const dx = p3.latitude - p1.latitude;
  const dy = p3.longitude - p1.longitude;

  const t = cross(dx, dy, d2x, d2y) / denominator;
  const u = cross(dx, dy, d1x, d1y) / denominator;

  return t > 0 && t < 1 && u > 0 && u < 1;
}

export function hasSelfIntersection(points: LatLng[]): boolean {
  if (points.length < 4) {
    return false;
  }

  const n = points.length;

  for (let i = 0; i < n; i++) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      const b1 = points[j];
      const b2 = points[(j + 1) % n];

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue;
      }

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

function polygonAreaM2(ring: XY[]): number {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i].x * ring[j].y - ring[j].x * ring[i].y;
  }
  return Math.abs(area) / 2;
}

function polygonPerimeterM(ring: XY[]): number {
  if (ring.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const dx = ring[j].x - ring[i].x;
    const dy = ring[j].y - ring[i].y;
    perimeter += Math.hypot(dx, dy);
  }
  return perimeter;
}

export function polygonCompactness(areaHa: number, perimeterM: number): number | null {
  if (!Number.isFinite(areaHa) || !Number.isFinite(perimeterM) || areaHa <= 0 || perimeterM <= 0) {
    return null;
  }
  const areaM2 = areaHa * 10_000;
  return (4 * Math.PI * areaM2) / (perimeterM * perimeterM);
}

function pointInRing(point: XY, ring: XY[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x;
    const yi = ring[i].y;
    const xj = ring[j].x;
    const yj = ring[j].y;
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringBbox(ring: XY[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (ring.length === 0) return null;
  let minX = ring[0].x;
  let maxX = ring[0].x;
  let minY = ring[0].y;
  let maxY = ring[0].y;
  for (const p of ring) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function intersectBbox(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const minX = Math.max(a.minX, b.minX);
  const minY = Math.max(a.minY, b.minY);
  const maxX = Math.min(a.maxX, b.maxX);
  const maxY = Math.min(a.maxY, b.maxY);
  if (minX >= maxX || minY >= maxY) return null;
  return { minX, minY, maxX, maxY };
}

function ringsMayOverlap(ringA: XY[], ringB: XY[]): boolean {
  const bboxA = ringBbox(ringA);
  const bboxB = ringBbox(ringB);
  if (!bboxA || !bboxB || !intersectBbox(bboxA, bboxB)) return false;

  for (const p of ringA) {
    if (pointInRing(p, ringB)) return true;
  }
  for (const p of ringB) {
    if (pointInRing(p, ringA)) return true;
  }

  for (let i = 0; i < ringA.length; i++) {
    const a1 = ringA[i];
    const a2 = ringA[(i + 1) % ringA.length];
    for (let j = 0; j < ringB.length; j++) {
      const b1 = ringB[j];
      const b2 = ringB[(j + 1) % ringB.length];
      const denominator = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
      if (denominator === 0) continue;
      const t =
        ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / denominator;
      const u =
        ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / denominator;
      if (t > 0 && t < 1 && u > 0 && u < 1) return true;
    }
  }

  return false;
}

function estimateIntersectionAreaM2(ringA: XY[], ringB: XY[]): number {
  const bboxA = ringBbox(ringA);
  const bboxB = ringBbox(ringB);
  if (!bboxA || !bboxB) return 0;
  const bbox = intersectBbox(bboxA, bboxB);
  if (!bbox) return 0;

  const steps = 36;
  const dx = (bbox.maxX - bbox.minX) / steps;
  const dy = (bbox.maxY - bbox.minY) / steps;
  if (dx <= 0 || dy <= 0) return 0;

  let insideCount = 0;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const p = { x: bbox.minX + (i + 0.5) * dx, y: bbox.minY + (j + 0.5) * dy };
      if (pointInRing(p, ringA) && pointInRing(p, ringB)) insideCount += 1;
    }
  }

  return insideCount * dx * dy;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function latLngToXY(point: LatLng): XY {
  const ring = projectRing([point]);
  return ring[0] ?? { x: 0, y: 0 };
}

function pointInsidePolygon(point: LatLng, polygonPoints: LatLng[]): boolean {
  if (polygonPoints.length < 3) return false;
  return pointInRing(latLngToXY(point), projectRing(polygonPoints));
}

function pushOverlapIssue(
  overlaps: Array<{
    plotId: string;
    plotName: string;
    overlapHa: number;
    smallerAreaHa: number;
  }>,
  params: {
    plotId: string;
    plotName: string;
    overlapHa: number;
    candidateAreaHa: number;
    otherAreaHa: number;
  },
) {
  const existing = overlaps.find((row) => row.plotId === params.plotId);
  if (existing) return;
  overlaps.push({
    plotId: params.plotId,
    plotName: params.plotName,
    overlapHa: params.overlapHa,
    smallerAreaHa: Math.min(params.candidateAreaHa, params.otherAreaHa),
  });
}

export function findLocalPlotOverlaps(params: {
  candidatePoints: LatLng[];
  candidateAreaHa: number;
  candidateKind?: 'point' | 'polygon';
  otherPlots: LocalPlotPolygonRef[];
  excludePlotId?: string;
}): Array<{
  plotId: string;
  plotName: string;
  overlapHa: number;
  smallerAreaHa: number;
}> {
  const candidateKind =
    params.candidateKind ?? (params.candidatePoints.length < 3 ? 'point' : 'polygon');
  const candidateRing = projectRing(params.candidatePoints);
  const candidateAreaHa =
    params.candidateAreaHa > 0
      ? params.candidateAreaHa
      : candidateKind === 'polygon' && candidateRing.length >= 3
        ? polygonAreaM2(candidateRing) / 10_000
        : 0;
  const overlaps: Array<{
    plotId: string;
    plotName: string;
    overlapHa: number;
    smallerAreaHa: number;
  }> = [];

  if (candidateKind === 'point' && params.candidatePoints.length > 0) {
    const candidatePoint = params.candidatePoints[params.candidatePoints.length - 1];
    for (const plot of params.otherPlots) {
      if (params.excludePlotId && plot.id === params.excludePlotId) continue;
      if (plot.points.length === 0) continue;

      const otherAreaHa =
        plot.areaHectares != null && plot.areaHectares > 0
          ? plot.areaHectares
          : plot.points.length >= 3
            ? polygonAreaM2(projectRing(plot.points)) / 10_000
            : 0;

      if (plot.points.length >= 3) {
        if (pointInsidePolygon(candidatePoint, plot.points)) {
          pushOverlapIssue(overlaps, {
            plotId: plot.id,
            plotName: plot.name,
            overlapHa: Math.max(candidateAreaHa, otherAreaHa, MIN_PARCEL_OVERLAP_HA),
            candidateAreaHa,
            otherAreaHa,
          });
        }
        continue;
      }

      const otherPoint = plot.points[plot.points.length - 1];
      const distanceM = haversineMeters(
        candidatePoint.latitude,
        candidatePoint.longitude,
        otherPoint.latitude,
        otherPoint.longitude,
      );
      if (distanceM < MIN_POINT_PLOT_SEPARATION_M) {
        pushOverlapIssue(overlaps, {
          plotId: plot.id,
          plotName: plot.name,
          overlapHa: MIN_PARCEL_OVERLAP_HA,
          candidateAreaHa,
          otherAreaHa,
        });
      }
    }

    return overlaps;
  }

  for (const plot of params.otherPlots) {
    if (params.excludePlotId && plot.id === params.excludePlotId) continue;
    if (plot.points.length === 0) continue;

    const otherAreaHa =
      plot.areaHectares != null && plot.areaHectares > 0
        ? plot.areaHectares
        : plot.points.length >= 3
          ? polygonAreaM2(projectRing(plot.points)) / 10_000
          : 0;

    if (plot.points.length < 3) {
      const otherPoint = plot.points[plot.points.length - 1];
      if (pointInsidePolygon(otherPoint, params.candidatePoints)) {
        pushOverlapIssue(overlaps, {
          plotId: plot.id,
          plotName: plot.name,
          overlapHa: Math.max(candidateAreaHa, otherAreaHa, MIN_PARCEL_OVERLAP_HA),
          candidateAreaHa,
          otherAreaHa,
        });
      }
      continue;
    }

    const otherRing = projectRing(plot.points);
    if (!ringsMayOverlap(candidateRing, otherRing)) continue;

    const overlapM2 = estimateIntersectionAreaM2(candidateRing, otherRing);
    if (overlapM2 <= 0) continue;

    pushOverlapIssue(overlaps, {
      plotId: plot.id,
      plotName: plot.name,
      overlapHa: overlapM2 / 10_000,
      candidateAreaHa,
      otherAreaHa,
    });
  }

  return overlaps;
}

export function formatLocalGeometryQualityMessage(
  issue: Pick<LocalGeometryQualityIssue, 'code' | 'details'>,
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

export function resolveLocalGeometryQualityMessage(
  t: TranslateFn,
  issue: LocalGeometryQualityIssue,
): string {
  switch (issue.code) {
    case 'GEO-104':
      return t('geo_quality_self_intersect');
    case 'GEO-105':
      return t('geo_quality_overlap', {
        plotName: String(issue.details?.overlapPlotName ?? t('geo_quality_overlap_unknown')),
      });
    case 'GEO-106':
      return issue.details?.areaHa != null ? t('geo_quality_micro_area') : t('geo_quality_sliver');
    default:
      return issue.message;
  }
}

function buildLocalPolygonQualityIssues(params: {
  points: LatLng[];
  areaHa: number;
  overlaps: ReturnType<typeof findLocalPlotOverlaps>;
  sliverSeverity: LocalGeometryQualitySeverity;
  checkSelfIntersection?: boolean;
}): LocalGeometryQualityIssue[] {
  const ring = projectRing(params.points);
  const perimeterM = polygonPerimeterM(ring);
  const compactness = polygonCompactness(params.areaHa, perimeterM);
  const issues: LocalGeometryQualityIssue[] = [];

  if (params.checkSelfIntersection !== false && hasSelfIntersection(params.points)) {
    const details = { kind: 'self_intersection' as const };
    issues.push({
      code: 'GEO-104',
      severity: 'error',
      message: formatLocalGeometryQualityMessage({ code: 'GEO-104', details }),
      details,
    });
  }

  for (const overlap of params.overlaps) {
    const ratio =
      overlap.smallerAreaHa > 0 ? overlap.overlapHa / overlap.smallerAreaHa : overlap.overlapHa;
    if (overlap.overlapHa >= MIN_PARCEL_OVERLAP_HA || ratio >= MIN_PARCEL_OVERLAP_RATIO) {
      const details = {
        overlapPlotId: overlap.plotId,
        overlapPlotName: overlap.plotName,
        overlapHa: overlap.overlapHa,
        overlapRatio: ratio,
      };
      issues.push({
        code: 'GEO-105',
        severity: 'error',
        message: formatLocalGeometryQualityMessage({ code: 'GEO-105', details }),
        details,
      });
    }
  }

  if (params.areaHa > 0 && params.areaHa < MIN_POLYGON_AREA_HA) {
    const details = { areaHa: params.areaHa, minAreaHa: MIN_POLYGON_AREA_HA, kind: 'micro_area' as const };
    issues.push({
      code: 'GEO-106',
      severity: params.sliverSeverity,
      message: formatLocalGeometryQualityMessage({ code: 'GEO-106', details }),
      details,
    });
  }

  if (
    compactness != null &&
    compactness < MIN_POLYGON_COMPACTNESS &&
    params.areaHa >= MIN_POLYGON_AREA_HA
  ) {
    const details = {
      compactness,
      minCompactness: MIN_POLYGON_COMPACTNESS,
      kind: 'sliver' as const,
    };
    issues.push({
      code: 'GEO-106',
      severity: params.sliverSeverity,
      message: formatLocalGeometryQualityMessage({ code: 'GEO-106', details }),
      details,
    });
  }

  return issues;
}

export function localPlotRefsForGeometry(
  plots: Array<Pick<LocalPlotPolygonRef, 'id' | 'name' | 'points' | 'areaHectares'>>,
  excludePlotId?: string,
): LocalPlotPolygonRef[] {
  return plots
    .filter((plot) => plot.id !== excludePlotId && plot.points.length > 0)
    .map((plot) => ({
      id: plot.id,
      name: plot.name,
      points: plot.points,
      areaHectares: plot.areaHectares,
    }));
}

export function assessPlotGeometryQuality(params: {
  kind: 'point' | 'polygon';
  points: LatLng[];
  areaHa: number;
  otherPlots: LocalPlotPolygonRef[];
  excludePlotId?: string;
  /** Sliver / micro-area issues are warnings on save, errors on upload. */
  phase: 'save' | 'upload';
}): {
  blockingIssues: LocalGeometryQualityIssue[];
  warnings: LocalGeometryQualityIssue[];
  allIssues: LocalGeometryQualityIssue[];
} {
  const overlaps = findLocalPlotOverlaps({
    candidatePoints: params.points,
    candidateAreaHa: params.areaHa,
    candidateKind: params.kind,
    otherPlots: params.otherPlots,
    excludePlotId: params.excludePlotId,
  });
  const sliverSeverity: LocalGeometryQualitySeverity = params.phase === 'upload' ? 'error' : 'warning';
  const allIssues = buildLocalPolygonQualityIssues({
    points: params.kind === 'polygon' ? params.points : [],
    areaHa: params.areaHa,
    overlaps,
    sliverSeverity,
    checkSelfIntersection: params.kind === 'polygon',
  });
  const blockingIssues = allIssues.filter((issue) => issue.severity === 'error');
  const warnings = allIssues.filter((issue) => issue.severity === 'warning');
  return { blockingIssues, warnings, allIssues };
}

export function assessLocalPolygonQuality(params: {
  points: LatLng[];
  areaHa: number;
  otherPlots: LocalPlotPolygonRef[];
  excludePlotId?: string;
  /** Sliver / micro-area issues are warnings on save, errors on upload. */
  phase: 'save' | 'upload';
}): {
  blockingIssues: LocalGeometryQualityIssue[];
  warnings: LocalGeometryQualityIssue[];
  allIssues: LocalGeometryQualityIssue[];
} {
  return assessPlotGeometryQuality({
    kind: 'polygon',
    points: params.points,
    areaHa: params.areaHa,
    otherPlots: params.otherPlots,
    excludePlotId: params.excludePlotId,
    phase: params.phase,
  });
}

export function localPolygonQualityMessage(
  issues: LocalGeometryQualityIssue[],
  t?: TranslateFn,
): string {
  return issues
    .map((issue) => (t ? resolveLocalGeometryQualityMessage(t, issue) : issue.message))
    .join('\n\n');
}

export const TRACEBUD_SUPPORT_EMAIL = 'support@tracebud.com';

export type PlotUploadBlockDetails = {
  message: string;
  code?: string;
  overlapPlotName?: string;
};

export function buildPlotOverlapSupportMailto(params: {
  plotName: string;
  otherPlotName: string;
  plotId: string;
  farmerEmail?: string;
}): string {
  const subject = encodeURIComponent(
    `Plot boundary overlap — ${params.plotName} / ${params.otherPlotName}`,
  );
  const body = encodeURIComponent(
    [
      'Hi Tracebud support,',
      '',
      `The app blocked uploading "${params.plotName}" because it overlaps "${params.otherPlotName}", but I believe these boundaries do not overlap on the ground.`,
      '',
      `Plot id: ${params.plotId}`,
      params.farmerEmail ? `Account: ${params.farmerEmail}` : null,
      '',
      'Please review my plot geometry.',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return `mailto:${TRACEBUD_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

/** Farmer-facing upload block copy — overlap messages name both plots. */
export function resolvePlotUploadBlockMessage(params: {
  plotName: string;
  issues: LocalGeometryQualityIssue[];
  t: TranslateFn;
}): PlotUploadBlockDetails | null {
  const blocking = params.issues.filter((issue) => issue.severity === 'error');
  if (blocking.length === 0) return null;

  const overlap = blocking.find((issue) => issue.code === 'GEO-105');
  if (overlap) {
    const otherPlotName = String(
      overlap.details?.overlapPlotName ?? params.t('geo_quality_overlap_unknown'),
    );
    return {
      code: 'GEO-105',
      overlapPlotName: otherPlotName,
      message: params.t('geo_quality_overlap_upload', {
        plotName: params.plotName,
        otherPlotName,
      }),
    };
  }

  const first = blocking[0];
  const plotName = params.plotName;

  if (first.code === 'GEO-104') {
    return {
      code: 'GEO-104',
      message: params.t('geo_quality_self_intersect_upload', { plotName }),
    };
  }

  if (first.code === 'GEO-106') {
    return {
      code: 'GEO-106',
      message:
        first.details?.areaHa != null
          ? params.t('geo_quality_micro_area_upload', { plotName })
          : params.t('geo_quality_sliver_upload', { plotName }),
    };
  }

  return {
    code: first.code,
    message: resolveLocalGeometryQualityMessage(params.t, first),
  };
}
