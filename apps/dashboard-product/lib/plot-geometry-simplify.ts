import type { LatLng } from './plot-map-preview-geometry';

const EARTH_RADIUS_M = 6_371_000;

function toLocalMeters(point: LatLng, origin: LatLng): { x: number; y: number } {
  const lat0 = (origin.lat * Math.PI) / 180;
  const lat = (point.lat * Math.PI) / 180;
  const lng = (point.lng * Math.PI) / 180;
  const lng0 = (origin.lng * Math.PI) / 180;
  return {
    x: EARTH_RADIUS_M * (lng - lng0) * Math.cos(lat0),
    y: EARTH_RADIUS_M * (lat - (origin.lat * Math.PI) / 180),
  };
}

function perpendicularDistanceMeters(point: LatLng, start: LatLng, end: LatLng): number {
  const origin = start;
  const p = toLocalMeters(point, origin);
  const a = toLocalMeters(start, origin);
  const b = toLocalMeters(end, origin);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function douglasPeucker(points: LatLng[], toleranceM: number): LatLng[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i += 1) {
    const distance = perpendicularDistanceMeters(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= toleranceM) {
    return [points[0], points[end]];
  }

  const left = douglasPeucker(points.slice(0, index + 1), toleranceM);
  const right = douglasPeucker(points.slice(index), toleranceM);
  return [...left.slice(0, -1), ...right];
}

function stripClosingVertex(points: LatLng[]): LatLng[] {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) {
    return points.slice(0, -1);
  }
  return points;
}

export function simplifyPolygonRing(points: LatLng[], toleranceM: number): LatLng[] {
  const open = stripClosingVertex(points);
  if (open.length < 4) return points;
  const simplified = douglasPeucker(open, Math.max(0.5, toleranceM));
  if (simplified.length < 3) return points;
  return simplified;
}

export function polygonAreaHectares(points: LatLng[]): number {
  const open = stripClosingVertex(points);
  if (open.length < 3) return 0;
  const origin = open[0];
  const ring = open.map((p) => toLocalMeters(p, origin));
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const j = (i + 1) % ring.length;
    area += ring[i].x * ring[j].y - ring[j].x * ring[i].y;
  }
  return Math.abs(area) / 2 / 10_000;
}

export function areaVariancePercent(beforeHa: number, afterHa: number): number | null {
  if (beforeHa <= 0 || afterHa < 0) return null;
  return (Math.abs(afterHa - beforeHa) / beforeHa) * 100;
}

export function polygonToGeoJson(points: LatLng[]): {
  type: 'Polygon';
  coordinates: [number, number][][];
} {
  const open = stripClosingVertex(points);
  const ring: [number, number][] = open.map((p) => [p.lng, p.lat]);
  if (ring.length > 0) {
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) {
      ring.push([firstLng, firstLat]);
    }
  }
  return { type: 'Polygon', coordinates: [ring] };
}
