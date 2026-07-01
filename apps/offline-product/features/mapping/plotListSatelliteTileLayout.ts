import { buildFieldMapTileUrl, FIELD_MAP_TILE_MAX_ZOOM } from '@/features/mapping/fieldMapTiles';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailStore';
import {
  projectGeoToThumbnail,
  readThumbnailGeoFrame,
  type PlotThumbnailPoint,
} from '@/features/mapping/plotThumbnailGeometry';
import type { Plot } from '@/features/state/AppStateContext';

export type PlotListSatelliteTileLayout = {
  uri: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function latToTileY(lat: number, z: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** z,
  );
}

export function plotCentroid(plot: Plot): { latitude: number; longitude: number } {
  const latitude =
    plot.points.reduce((sum, point) => sum + point.latitude, 0) / plot.points.length;
  const longitude =
    plot.points.reduce((sum, point) => sum + point.longitude, 0) / plot.points.length;
  return { latitude, longitude };
}

/** Padded geo bounds that match the thumbnail SVG frame (with margin). */
export function paddedPlotGeoBounds(
  plot: Plot,
  size: number = PLOT_LIST_THUMB_DISPLAY_SIZE,
): { north: number; south: number; west: number; east: number } | null {
  const frame = readThumbnailGeoFrame(plot, size);
  if (!frame) return null;
  const padLat = frame.latSpan * 0.08;
  const padLon = frame.lonSpan * 0.08;
  return {
    north: frame.maxLat + padLat,
    south: frame.minLat - padLat,
    west: frame.minLon - padLon,
    east: frame.maxLon + padLon,
  };
}

function tileContainsGeoBounds(
  z: number,
  x: number,
  y: number,
  bbox: { north: number; south: number; west: number; east: number },
): boolean {
  const bounds = tileGeoBounds(z, x, y);
  return (
    bounds.north >= bbox.north &&
    bounds.south <= bbox.south &&
    bounds.west <= bbox.west &&
    bounds.east >= bbox.east
  );
}

/**
 * Pick one Web Mercator tile that fully covers the plot thumbnail geo frame.
 * Centroid-only tile selection leaves empty bands when the plot sits near a tile edge.
 */
export function pickPlotListSatelliteTile(
  plot: Plot,
  size: number = PLOT_LIST_THUMB_DISPLAY_SIZE,
  forcedZ?: number,
): { z: number; x: number; y: number } | null {
  const bbox = paddedPlotGeoBounds(plot, size);
  if (!bbox) return null;

  const zValues =
    forcedZ != null
      ? [forcedZ]
      : Array.from({ length: FIELD_MAP_TILE_MAX_ZOOM - 9 }, (_, i) => FIELD_MAP_TILE_MAX_ZOOM - i);

  for (const z of zValues) {
    const xMin = lonToTileX(bbox.west, z);
    const xMax = lonToTileX(bbox.east, z);
    const yNorth = latToTileY(bbox.north, z);
    const ySouth = latToTileY(bbox.south, z);
    if (xMin !== xMax || yNorth !== ySouth) continue;
    if (tileContainsGeoBounds(z, xMin, yNorth, bbox)) {
      return { z, x: xMin, y: yNorth };
    }
  }

  if (forcedZ != null) {
    const centroid = plotCentroid(plot);
    return {
      z: forcedZ,
      x: lonToTileX(centroid.longitude, forcedZ),
      y: latToTileY(centroid.latitude, forcedZ),
    };
  }

  const centroid = plotCentroid(plot);
  const z = 10;
  return { z, x: lonToTileX(centroid.longitude, z), y: latToTileY(centroid.latitude, z) };
}

/**
 * Pick the highest zoom where one 256px tile still covers the thumbnail geo frame.
 */
export function pickListThumbnailZoom(
  plot: Plot,
  size: number = PLOT_LIST_THUMB_DISPLAY_SIZE,
): number {
  return pickPlotListSatelliteTile(plot, size)?.z ?? 16;
}

export function tileGeoBounds(
  z: number,
  x: number,
  y: number,
): { north: number; south: number; west: number; east: number } {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { north, south, west, east };
}

export function layoutTileInThumbnail(
  plot: Plot,
  size: number,
  z: number,
  x: number,
  y: number,
  uri: string,
): PlotListSatelliteTileLayout | null {
  const frame = readThumbnailGeoFrame(plot, size);
  if (!frame) return null;

  const bounds = tileGeoBounds(z, x, y);
  const nw = projectGeoToThumbnail(bounds.north, bounds.west, frame);
  const se = projectGeoToThumbnail(bounds.south, bounds.east, frame);
  const width = se.x - nw.x;
  const height = se.y - nw.y;
  if (width <= 0 || height <= 0) return null;

  return {
    uri,
    left: nw.x,
    top: nw.y,
    width,
    height,
  };
}

/** Use the best zoom stored in the pack (packs are often z14–16; list preview must not ask z18+). */
export function pickOfflinePackZoom(
  pack: { zooms: number[] },
  plot: Plot,
  size: number,
): number {
  const ideal = pickListThumbnailZoom(plot, size);
  const descending = [...pack.zooms].sort((a, b) => b - a);
  const withinPack = descending.find((z) => z <= ideal);
  return withinPack ?? descending[0];
}

/** @internal test helper */
export function layoutOnlineTileForPlot(plot: Plot, size: number): PlotListSatelliteTileLayout | null {
  const tile = pickPlotListSatelliteTile(plot, size);
  if (!tile) return null;
  return layoutTileInThumbnail(
    plot,
    size,
    tile.z,
    tile.x,
    tile.y,
    buildFieldMapTileUrl(tile.z, tile.x, tile.y),
  );
}

export function thumbPointsFromGeo(
  plot: Plot,
  size: number,
): PlotThumbnailPoint[] {
  const frame = readThumbnailGeoFrame(plot, size);
  if (!frame) return [];
  return plot.points.map((point) =>
    projectGeoToThumbnail(point.latitude, point.longitude, frame),
  );
}
