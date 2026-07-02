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
  centroidLat: number;
  centroidLon: number;
};

/** Minimum geo half-span (degrees) so point plots still get a usable preview. */
const POINT_PLOT_MIN_HALF_SPAN = 0.0004;
/** Minimum geo half-span (degrees) for walked polygons. */
const POLYGON_MIN_HALF_SPAN = 0.0002;
/** Extra margin beyond the tight polygon bounds (fraction of half-span). */
export const PLOT_THUMB_GEO_MARGIN_RATIO = 0.22;

function plotCentroid(plot: Plot): { latitude: number; longitude: number } {
  const latitude =
    plot.points.reduce((sum, point) => sum + point.latitude, 0) / plot.points.length;
  const longitude =
    plot.points.reduce((sum, point) => sum + point.longitude, 0) / plot.points.length;
  return { latitude, longitude };
}

function minHalfSpanForPlot(plot: Plot): number {
  return plot.kind === 'point' ? POINT_PLOT_MIN_HALF_SPAN : POLYGON_MIN_HALF_SPAN;
}

/**
 * Square geo frame centered on the plot centroid with symmetric margin so polygons
 * and point markers stay fully inside the thumbnail with visible edge padding.
 */
export function readThumbnailGeoFrame(
  plot: Plot,
  size: number,
  padding = 10,
  marginScale = 1,
): ThumbnailGeoFrame | null {
  if (plot.points.length === 0) return null;

  const lats = plot.points.map((p) => p.latitude);
  const lons = plot.points.map((p) => p.longitude);
  const { latitude: centroidLat, longitude: centroidLon } = plotCentroid(plot);

  const halfLatExtent = Math.max(
    ...lats.map((lat) => Math.abs(lat - centroidLat)),
    minHalfSpanForPlot(plot),
  );
  const halfLonExtent = Math.max(
    ...lons.map((lon) => Math.abs(lon - centroidLon)),
    minHalfSpanForPlot(plot),
  );

  const halfSpan =
    Math.max(halfLatExtent, halfLonExtent) *
    (1 + PLOT_THUMB_GEO_MARGIN_RATIO) *
    marginScale;

  const latSpan = halfSpan * 2;
  const lonSpan = halfSpan * 2;

  return {
    minLat: centroidLat - halfSpan,
    maxLat: centroidLat + halfSpan,
    minLon: centroidLon - halfSpan,
    maxLon: centroidLon + halfSpan,
    latSpan,
    lonSpan,
    padding,
    inner: Math.max(size - padding * 2, 1),
    centroidLat,
    centroidLon,
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
  padding = 10,
  marginScale = 1,
): PlotThumbnailPoint[] {
  if (plot.points.length === 0) return [];

  const frame = readThumbnailGeoFrame(plot, size, padding, marginScale);
  if (!frame) return [];

  return plot.points.map((point) =>
    projectGeoToThumbnail(point.latitude, point.longitude, frame),
  );
}

/** True when polygon vertices collapse to a point in thumbnail space. */
export function plotThumbnailPointsAreDegenerate(
  points: PlotThumbnailPoint[],
): boolean {
  if (points.length === 0) return true;
  const first = points[0];
  return points.every(
    (point) =>
      Math.abs(point.x - first.x) < 0.5 && Math.abs(point.y - first.y) < 0.5,
  );
}

export function thumbnailPointsToSvg(points: PlotThumbnailPoint[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/** @internal test helper — centroid should land near thumbnail center. */
export function projectPlotCentroidToThumbnail(
  plot: Plot,
  size: number,
  padding = 10,
  marginScale = 1,
): PlotThumbnailPoint | null {
  const frame = readThumbnailGeoFrame(plot, size, padding, marginScale);
  if (!frame) return null;
  return projectGeoToThumbnail(frame.centroidLat, frame.centroidLon, frame);
}

/** True when every projected vertex sits inside the safe inner frame. */
export function plotThumbnailPointsFitInnerFrame(
  points: PlotThumbnailPoint[],
  size: number,
  padding = 10,
  slack = 1,
): boolean {
  const innerMin = padding + slack;
  const innerMax = size - padding - slack;
  return points.every(
    (point) =>
      point.x >= innerMin &&
      point.x <= innerMax &&
      point.y >= innerMin &&
      point.y <= innerMax,
  );
}
