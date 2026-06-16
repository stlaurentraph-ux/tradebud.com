import type { MapCoordinate } from '@/features/mapping/fieldMapRegion';

/** Resolve the farmer position marker on the walk map. */
export function resolveYouPosition(params: {
  liveTrail: MapCoordinate[];
  userPosition?: MapCoordinate | null;
  vertices: MapCoordinate[];
}): MapCoordinate | null {
  if (params.liveTrail.length > 0) {
    return params.liveTrail[params.liveTrail.length - 1];
  }
  if (params.userPosition) {
    return params.userPosition;
  }
  if (params.vertices.length > 0) {
    return params.vertices[params.vertices.length - 1];
  }
  return null;
}
