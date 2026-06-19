import type { Plot } from '@/features/state/AppStateContext';

export type PlotThumbnailPoint = { x: number; y: number };

/** Project plot coordinates into SVG viewBox space for list thumbnails. */
export function projectPlotToThumbnail(
  plot: Plot,
  size: number,
  padding = 8,
): PlotThumbnailPoint[] {
  if (plot.points.length === 0) return [];

  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latSpan = Math.max(maxLat - minLat, plot.kind === 'point' ? 0.0008 : 0.0004);
  const lonSpan = Math.max(maxLon - minLon, plot.kind === 'point' ? 0.0008 : 0.0004);
  const inner = Math.max(size - padding * 2, 1);

  return plot.points.map((point) => {
    const xNorm = lonSpan > 0 ? (point.longitude - minLon) / lonSpan : 0.5;
    const yNorm = latSpan > 0 ? (point.latitude - minLat) / latSpan : 0.5;
    return {
      x: padding + xNorm * inner,
      y: padding + (1 - yNorm) * inner,
    };
  });
}

export function thumbnailPointsToSvg(points: PlotThumbnailPoint[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}
