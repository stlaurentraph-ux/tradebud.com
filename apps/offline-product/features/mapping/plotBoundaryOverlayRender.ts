import type { MapCoordinate } from '@/features/mapping/fieldMapRegion';

export function isValidMapCoordinate(coord: MapCoordinate): boolean {
  return (
    Number.isFinite(coord.latitude) &&
    Number.isFinite(coord.longitude) &&
    Math.abs(coord.latitude) <= 90 &&
    Math.abs(coord.longitude) <= 180
  );
}

export function sanitizeMapCoordinates(coords: MapCoordinate[]): MapCoordinate[] {
  return coords.filter(isValidMapCoordinate);
}

/** Closed ring for stroke preview while tracing (avoids filled Polygon on custom tiles). */
export function boundaryStrokeCoordinates(vertices: MapCoordinate[]): MapCoordinate[] {
  const safe = sanitizeMapCoordinates(vertices);
  if (safe.length < 2) return [];
  if (safe.length >= 3) {
    return [...safe, safe[0]];
  }
  return safe;
}

export function shouldShowStartMarker(params: {
  showStartMarker: boolean;
  showVertexMarkers: boolean;
  vertexCount: number;
}): boolean {
  return params.showStartMarker && params.vertexCount > 0 && !params.showVertexMarkers;
}
