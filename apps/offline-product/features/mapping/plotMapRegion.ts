import type { Region } from 'react-native-maps';

import type { Plot } from '@/features/state/AppStateContext';

/** Fit map camera to plot points with padding for list thumbnails and detail hero. */
export function computeRegionFromPlot(plot: Plot): Region | undefined {
  if (plot.points.length === 0) return undefined;

  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latDelta = Math.max((maxLat - minLat) * 1.8, plot.kind === 'point' ? 0.002 : 0.0012);
  const lonDelta = Math.max((maxLon - minLon) * 1.8, plot.kind === 'point' ? 0.002 : 0.0012);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}
