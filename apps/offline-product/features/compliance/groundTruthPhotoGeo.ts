import { isValidWgs84LatLng } from '@/features/geo/coordinates';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';

const DEFAULT_POINT_PLOT_PHOTO_RADIUS_M = 25;
/** EUDR deforestation cutoff — photos must be taken after this date. */
export const EUDR_PHOTO_CUTOFF_MS = Date.parse('2020-12-31T23:59:59.999Z');
const EARTH_RADIUS_M = 6_371_000;

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
  if (!plot.points.length) {
    return false;
  }
  if (plot.kind === 'point') {
    const anchor = plot.points[plot.points.length - 1];
    const radiusM = plot.precisionMetersAtSave ?? DEFAULT_POINT_PLOT_PHOTO_RADIUS_M;
    return haversineMeters(lat, lng, anchor.latitude, anchor.longitude) <= radiusM;
  }
  return isPointInPolygonRing(lat, lng, plot.points);
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
