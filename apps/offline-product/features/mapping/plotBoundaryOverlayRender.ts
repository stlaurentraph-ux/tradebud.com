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

/**
 * Open or closed stroke chain for boundary preview.
 * Closing the ring on custom map tiles can crash native MapView on iOS/Android.
 */
export function boundaryStrokeCoordinates(
  vertices: MapCoordinate[],
  options?: { closeRing?: boolean },
): MapCoordinate[] {
  const safe = sanitizeMapCoordinates(vertices);
  if (safe.length < 2) return [];
  const closeRing = options?.closeRing === true;
  if (safe.length >= 3 && closeRing) {
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
