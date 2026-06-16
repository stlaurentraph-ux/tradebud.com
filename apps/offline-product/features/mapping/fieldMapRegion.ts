import type { Region } from 'react-native-maps';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/** Fit map camera to coordinates with a minimum zoom so field edges stay visible. */
export function regionFromCoordinates(
  coords: MapCoordinate[],
  paddingFactor = 1.45,
): Region {
  if (coords.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (coords.length === 1) {
    return {
      latitude: coords[0].latitude,
      longitude: coords[0].longitude,
      latitudeDelta: 0.00075,
      longitudeDelta: 0.00075,
    };
  }

  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latSpan = Math.max((maxLat - minLat) * paddingFactor, 0.00065);
  const lonSpan = Math.max((maxLon - minLon) * paddingFactor, 0.00065);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latSpan,
    longitudeDelta: lonSpan,
  };
}
