import type { Region } from 'react-native-maps';

import type { Plot } from '@/features/state/AppStateContext';

function regionFromBounds(
  lats: number[],
  lons: number[],
  minDelta: number,
): Region | undefined {
  if (lats.length === 0 || lons.length === 0) return undefined;

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latDelta = Math.max((maxLat - minLat) * 1.8, minDelta);
  const lonDelta = Math.max((maxLon - minLon) * 1.8, minDelta);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/** Fit map camera to plot points with padding for list thumbnails and detail hero. */
export function computeRegionFromPlot(plot: Plot): Region | undefined {
  if (plot.points.length === 0) return undefined;

  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  const minDelta = plot.kind === 'point' ? 0.002 : 0.0012;
  return regionFromBounds(lats, lons, minDelta);
}

/** Fit all plot boundaries into one map camera (My Plots overview). */
export function computeRegionFromPlots(plots: readonly Plot[]): Region | undefined {
  const lats: number[] = [];
  const lons: number[] = [];
  let hasPointPlot = false;

  for (const plot of plots) {
    if (plot.points.length === 0) continue;
    if (plot.kind === 'point') hasPointPlot = true;
    for (const point of plot.points) {
      lats.push(point.latitude);
      lons.push(point.longitude);
    }
  }

  return regionFromBounds(lats, lons, hasPointPlot ? 0.002 : 0.0012);
}
