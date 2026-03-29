/**
 * WGS84 coordinate handling aligned with Tracebud GIS rules (≥6 decimal places
 * for stored lat/lng; ~0.11 m precision at the equator).
 */

export const WGS84_DECIMAL_PLACES = 6;

export function roundWgs84Coordinate(value: number): number {
  return Number(Number(value).toFixed(WGS84_DECIMAL_PLACES));
}

export function normalizeWgs84Point(p: { latitude: number; longitude: number }): {
  latitude: number;
  longitude: number;
} {
  return {
    latitude: roundWgs84Coordinate(p.latitude),
    longitude: roundWgs84Coordinate(p.longitude),
  };
}

export function isValidWgs84LatLng(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
