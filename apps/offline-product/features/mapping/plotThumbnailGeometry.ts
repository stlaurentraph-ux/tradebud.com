import type { Plot } from '@/features/state/AppStateContext';

export type PlotThumbnailPoint = { x: number; y: number };

export type ThumbnailGeoFrame = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  latSpan: number;
  lonSpan: number;
  padding: number;
  inner: number;
};

export function readThumbnailGeoFrame(
  plot: Plot,
  size: number,
  padding = 8,
): ThumbnailGeoFrame | null {
  if (plot.points.length === 0) return null;

  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = Math.max(maxLat - minLat, plot.kind === 'point' ? 0.0008 : 0.0004);
  const lonSpan = Math.max(maxLon - minLon, plot.kind === 'point' ? 0.0008 : 0.0004);

  return {
    minLat,
    maxLat,
    minLon,
    maxLon,
    latSpan,
    lonSpan,
    padding,
    inner: Math.max(size - padding * 2, 1),
  };
}

/** Map WGS84 coordinates into thumbnail pixel space (same frame as the boundary SVG). */
export function projectGeoToThumbnail(
  latitude: number,
  longitude: number,
  frame: ThumbnailGeoFrame,
): PlotThumbnailPoint {
  const xNorm = frame.lonSpan > 0 ? (longitude - frame.minLon) / frame.lonSpan : 0.5;
  const yNorm = frame.latSpan > 0 ? (latitude - frame.minLat) / frame.latSpan : 0.5;
  return {
    x: frame.padding + xNorm * frame.inner,
    y: frame.padding + (1 - yNorm) * frame.inner,
  };
}

/** Project plot coordinates into SVG viewBox space for list thumbnails. */
export function projectPlotToThumbnail(
  plot: Plot,
  size: number,
  padding = 8,
): PlotThumbnailPoint[] {
  if (plot.points.length === 0) return [];

  const frame = readThumbnailGeoFrame(plot, size, padding);
  if (!frame) return [];

  return plot.points.map((point) =>
    projectGeoToThumbnail(point.latitude, point.longitude, frame),
  );
}

export function thumbnailPointsToSvg(points: PlotThumbnailPoint[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}
