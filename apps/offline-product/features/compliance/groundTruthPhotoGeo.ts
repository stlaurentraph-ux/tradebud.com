import { isValidWgs84LatLng } from '@/features/geo/coordinates';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';

export const GROUND_TRUTH_DIRECTIONS = ['north', 'east', 'south', 'west'] as const;
export type GroundTruthPhotoDirection = (typeof GROUND_TRUTH_DIRECTIONS)[number];

/** Compass heading (degrees) the camera should face for each slot. */
export const TARGET_HEADING_BY_DIRECTION: Record<GroundTruthPhotoDirection, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

export const DEFAULT_POINT_PLOT_PHOTO_RADIUS_M = 25;
/** EUDR deforestation cutoff — photos must be taken after this date. */
export const EUDR_PHOTO_CUTOFF_MS = Date.parse('2020-12-31T23:59:59.999Z');
const EARTH_RADIUS_M = 6_371_000;

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Ray-casting point-in-polygon for a single ring (WGS84). */
export function isPointInPolygonRing(
  latitude: number,
  longitude: number,
  ring: Array<{ latitude: number; longitude: number }>,
): boolean {
  if (ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i].latitude;
    const xi = ring[i].longitude;
    const yj = ring[j].latitude;
    const xj = ring[j].longitude;
    const intersects =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Photo capture standpoint shown on the map (centroid or GPS point). */
export function computePlotPhotoStandpoint(plot: Plot): MapCoordinate | null {
  if (!plot.points.length) return null;
  if (plot.kind === 'point') {
    const anchor = plot.points[plot.points.length - 1];
    return { latitude: anchor.latitude, longitude: anchor.longitude };
  }
  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  return {
    latitude: lats.reduce((sum, v) => sum + v, 0) / lats.length,
    longitude: lons.reduce((sum, v) => sum + v, 0) / lons.length,
  };
}

/** True when the device may open the camera shutter for this plot. */
export function isAtPhotoCaptureLocation(
  latitude: number,
  longitude: number,
  plot: Plot,
): boolean {
  if (!isValidWgs84LatLng(latitude, longitude) || !plot.points.length) {
    return false;
  }
  if (plot.kind === 'point') {
    const anchor = plot.points[plot.points.length - 1];
    const radiusM = plot.precisionMetersAtSave ?? DEFAULT_POINT_PLOT_PHOTO_RADIUS_M;
    return haversineMeters(latitude, longitude, anchor.latitude, anchor.longitude) <= radiusM;
  }
  return isPointInPolygonRing(latitude, longitude, plot.points);
}

export function distanceToPhotoStandpointM(
  latitude: number,
  longitude: number,
  plot: Plot,
): number | null {
  const standpoint = computePlotPhotoStandpoint(plot);
  if (!standpoint || !isValidWgs84LatLng(latitude, longitude)) return null;
  return haversineMeters(
    latitude,
    longitude,
    standpoint.latitude,
    standpoint.longitude,
  );
}

export function normalizePhotoDirection(value: unknown): GroundTruthPhotoDirection | null {
  if (value === 'north' || value === 'east' || value === 'south' || value === 'west') {
    return value;
  }
  return null;
}

export function photoForDirection(
  photos: PlotPhoto[],
  direction: GroundTruthPhotoDirection,
): PlotPhoto | undefined {
  const tagged = photos.find((p) => normalizePhotoDirection(p.direction) === direction);
  if (tagged) return tagged;
  const idx = GROUND_TRUTH_DIRECTIONS.indexOf(direction);
  return idx >= 0 ? photos[idx] : undefined;
}

export function isGroundTruthPhotoAfterCutoff(photo: PlotPhoto): boolean {
  if (!Number.isFinite(photo.takenAt)) return false;
  return photo.takenAt > EUDR_PHOTO_CUTOFF_MS;
}

export function isGroundTruthPhotoOnPlot(photo: PlotPhoto, plot: Plot): boolean {
  const lat = photo.latitude;
  const lng = photo.longitude;
  if (lat == null || lng == null || !isValidWgs84LatLng(lat, lng)) {
    return false;
  }
  return isAtPhotoCaptureLocation(lat, lng, plot);
}

export function isDirectionPhotoGeoVerified(
  photo: PlotPhoto | undefined,
  plot: Plot,
): boolean {
  if (!photo) return false;
  return isGroundTruthPhotoOnPlot(photo, plot) && isGroundTruthPhotoAfterCutoff(photo);
}

export function countGeoVerifiedGroundTruthDirections(
  photos: PlotPhoto[],
  plot: Plot,
): number {
  return GROUND_TRUTH_DIRECTIONS.filter((dir) =>
    isDirectionPhotoGeoVerified(photoForDirection(photos, dir), plot),
  ).length;
}

export function isGroundTruthPhotoSetComplete(
  photos: PlotPhoto[],
  plot: Plot | null,
): boolean {
  if (!plot) return false;
  return countGeoVerifiedGroundTruthDirections(photos, plot) >= GROUND_TRUTH_DIRECTIONS.length;
}

export function countGeoVerifiedGroundTruthPhotos(photos: PlotPhoto[], plot: Plot | null): number {
  if (!plot) return 0;
  return photos.filter((photo) => isGroundTruthPhotoOnPlot(photo, plot)).length;
}

export function countClearanceVerifiedGroundTruthPhotos(
  photos: PlotPhoto[],
  plot: Plot | null,
): number {
  if (!plot) return 0;
  return photos.filter(
    (photo) => isGroundTruthPhotoOnPlot(photo, plot) && isGroundTruthPhotoAfterCutoff(photo),
  ).length;
}

export function countGeoTaggedGroundTruthPhotos(photos: PlotPhoto[]): number {
  return photos.filter(
    (photo) =>
      photo.latitude != null &&
      photo.longitude != null &&
      isValidWgs84LatLng(photo.latitude, photo.longitude),
  ).length;
}

/** Signed delta (-180..180) from current device heading to the target cardinal direction. */
export function headingDeltaToDirection(
  currentHeadingDeg: number,
  direction: GroundTruthPhotoDirection,
): number {
  const target = TARGET_HEADING_BY_DIRECTION[direction];
  const current = ((currentHeadingDeg % 360) + 360) % 360;
  let delta = target - current;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

export function isFacingDirection(
  currentHeadingDeg: number | null,
  direction: GroundTruthPhotoDirection,
  toleranceDeg = 25,
): boolean {
  if (currentHeadingDeg == null || !Number.isFinite(currentHeadingDeg)) return true;
  return Math.abs(headingDeltaToDirection(currentHeadingDeg, direction)) <= toleranceDeg;
}
