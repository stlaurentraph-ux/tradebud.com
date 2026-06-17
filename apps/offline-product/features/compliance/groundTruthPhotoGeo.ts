import { isValidWgs84LatLng } from '@/features/geo/coordinates';
import type { Plot } from '@/features/state/AppStateContext';
import type { PlotPhoto } from '@/features/state/persistence.native';

export const GROUND_TRUTH_DIRECTIONS = ['north', 'east', 'south', 'west'] as const;
export type GroundTruthPhotoDirection = (typeof GROUND_TRUTH_DIRECTIONS)[number];

/** Farmer-facing photo slots (stored with legacy direction keys for upsert). */
export const GROUND_TRUTH_PHOTO_SLOT_COUNT = GROUND_TRUTH_DIRECTIONS.length;

/** Compass heading (degrees) the camera should face for each slot. */
export const TARGET_HEADING_BY_DIRECTION: Record<GroundTruthPhotoDirection, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

export const DEFAULT_POINT_PLOT_PHOTO_RADIUS_M = 25;
/** EUDR: walked polygon required at or above this area; inward photo standoff applies here. */
export const POLYGON_CAPTURE_MIN_HECTARES = 4;
/** Target minimum distance from plot border for photo standpoint (plots ≥ 4 ha). */
export const DEFAULT_MIN_INWARD_FROM_BORDER_M = 20;
/** Smallest inward requirement on very small plots (metres). */
export const MIN_INWARD_FROM_BORDER_FLOOR_M = 5;
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

function distancePointToSegmentM(
  latitude: number,
  longitude: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const x = longitude * cosLat;
  const y = latitude;
  const x1 = lon1 * cosLat;
  const y1 = lat1;
  const x2 = lon2 * cosLat;
  const y2 = lat2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-20) {
    return haversineMeters(latitude, longitude, lat1, lon1);
  }
  let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projLat = y1 + t * dy;
  const projLon = (x1 + t * dx) / cosLat;
  return haversineMeters(latitude, longitude, projLat, projLon);
}

/** Metres from the point to the nearest polygon edge (inside or outside the ring). */
export function distanceToPolygonBorderM(
  latitude: number,
  longitude: number,
  ring: Array<{ latitude: number; longitude: number }>,
): number | null {
  if (ring.length < 2) return null;
  let min = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const d = distancePointToSegmentM(
      latitude,
      longitude,
      ring[i].latitude,
      ring[i].longitude,
      ring[j].latitude,
      ring[j].longitude,
    );
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : null;
}

/** Metres from the point to the plot border (inside the plot = positive clearance). */
export function distanceToPlotBorderM(
  latitude: number,
  longitude: number,
  plot: Plot,
): number | null {
  if (!plot.points.length) return null;
  if (plot.kind === 'point') {
    const anchor = plot.points[plot.points.length - 1];
    const radiusM = plot.precisionMetersAtSave ?? DEFAULT_POINT_PLOT_PHOTO_RADIUS_M;
    const distCenter = haversineMeters(latitude, longitude, anchor.latitude, anchor.longitude);
    return Math.max(0, radiusM - distCenter);
  }
  if (!isPointInPolygonRing(latitude, longitude, plot.points)) {
    return 0;
  }
  return distanceToPolygonBorderM(latitude, longitude, plot.points);
}

/** Best inward clearance available near plot centre (for scaling small-plot rules). */
export function estimatePlotMaxInwardM(plot: Plot): number {
  if (!plot.points.length) return 0;
  if (plot.kind === 'point') {
    const radiusM = plot.precisionMetersAtSave ?? DEFAULT_POINT_PLOT_PHOTO_RADIUS_M;
    return Math.max(0, radiusM - MIN_INWARD_FROM_BORDER_FLOOR_M);
  }
  const centroid = computePlotPhotoStandpoint(plot);
  if (!centroid) return 0;
  if (!isPointInPolygonRing(centroid.latitude, centroid.longitude, plot.points)) {
    return MIN_INWARD_FROM_BORDER_FLOOR_M;
  }
  return distanceToPolygonBorderM(centroid.latitude, centroid.longitude, plot.points) ?? 0;
}

/** Plots ≥ 4 ha must walk the boundary; photos also require standoff from the edge. */
export function plotRequiresInwardPhotoStandoff(plot: Plot): boolean {
  return plot.areaHectares >= POLYGON_CAPTURE_MIN_HECTARES;
}

/** Required metres inside the border before the camera may open. */
export function resolveRequiredInwardFromBorderM(plot: Plot): number {
  if (!plotRequiresInwardPhotoStandoff(plot)) {
    return 0;
  }
  const maxInward = estimatePlotMaxInwardM(plot);
  if (maxInward >= DEFAULT_MIN_INWARD_FROM_BORDER_M) {
    return DEFAULT_MIN_INWARD_FROM_BORDER_M;
  }
  return Math.max(MIN_INWARD_FROM_BORDER_FLOOR_M, maxInward * 0.5);
}

/** True when coordinates lie inside the plot geography. */
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

/** True when the farmer is inside the plot and far enough from the edge to take photos. */
export function isPhotoStandpointReady(
  latitude: number,
  longitude: number,
  plot: Plot,
): boolean {
  if (!isAtPhotoCaptureLocation(latitude, longitude, plot)) {
    return false;
  }
  if (!plotRequiresInwardPhotoStandoff(plot)) {
    return true;
  }
  const clearance = distanceToPlotBorderM(latitude, longitude, plot);
  if (clearance == null) return false;
  return clearance >= resolveRequiredInwardFromBorderM(plot);
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
  return countClearanceVerifiedGroundTruthPhotos(photos, plot) >= GROUND_TRUTH_PHOTO_SLOT_COUNT;
}

/** Next slot index (0–3) without a clearance-verified photo, or null when complete. */
export function nextGroundTruthPhotoSlotIndex(
  photos: PlotPhoto[],
  plot: Plot,
): number | null {
  for (let i = 0; i < GROUND_TRUTH_DIRECTIONS.length; i++) {
    const dir = GROUND_TRUTH_DIRECTIONS[i];
    if (!isDirectionPhotoGeoVerified(photoForDirection(photos, dir), plot)) {
      return i;
    }
  }
  return null;
}

export function directionForSlotIndex(index: number): GroundTruthPhotoDirection {
  return GROUND_TRUTH_DIRECTIONS[index] ?? GROUND_TRUTH_DIRECTIONS[0];
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
