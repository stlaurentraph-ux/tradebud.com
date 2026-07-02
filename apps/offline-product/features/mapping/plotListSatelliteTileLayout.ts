import { buildFieldMapTileUrl, FIELD_MAP_TILE_MAX_ZOOM } from '@/features/mapping/fieldMapTiles';
import { PLOT_LIST_THUMB_DISPLAY_SIZE } from '@/features/mapping/plotListThumbnailStore';
import {
  projectGeoToThumbnail,
  readThumbnailGeoFrame,
  type PlotThumbnailPoint,
} from '@/features/mapping/plotThumbnailGeometry';
import type { Plot } from '@/features/state/AppStateContext';

/** Lowest Esri zoom used when a plot spans multiple tiles at higher levels. */
export const PLOT_LIST_THUMB_MIN_TILE_ZOOM = 6;

export type PlotListSatelliteTileLayout = {
  uri: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Geo frame scale shared with polygon projection (tile + boundary stay aligned). */
  geoMarginScale: number;
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

/** Geo bounds used for tile selection — matches the centered thumbnail frame. */
export function paddedPlotGeoBounds(
  plot: Plot,
  size: number = PLOT_LIST_THUMB_DISPLAY_SIZE,
): { north: number; south: number; west: number; east: number } | null {
  const frame = readThumbnailGeoFrame(plot, size);
  if (!frame) return null;
  return {
    north: frame.maxLat,
    south: frame.minLat,
    west: frame.minLon,
    east: frame.maxLon,
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

/** True when a projected tile fills the square thumbnail canvas (no grey bands). */
export function tileLayoutCoversThumbnailCanvas(
  layout: PlotListSatelliteTileLayout,
  size: number,
): boolean {
  const slack = 2;
  return (
    layout.left <= slack &&
    layout.top <= slack &&
    layout.left + layout.width >= size - slack &&
    layout.top + layout.height >= size - slack
  );
}

/** Scale a tile layout uniformly so it fully covers the thumbnail canvas (no grey bands). */
export function ensureTileLayoutCoversCanvas(
  layout: PlotListSatelliteTileLayout,
  size: number,
): PlotListSatelliteTileLayout {
  if (tileLayoutCoversThumbnailCanvas(layout, size)) return layout;

  const centerX = layout.left + layout.width / 2;
  const centerY = layout.top + layout.height / 2;
  const scale = Math.max(
    1,
    (2 * centerX) / layout.width,
    (2 * centerY) / layout.height,
    (2 * (size - centerX)) / layout.width,
    (2 * (size - centerY)) / layout.height,
  );
  const width = layout.width * scale;
  const height = layout.height * scale;
  return {
    uri: layout.uri,
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
    geoMarginScale: layout.geoMarginScale,
  };
}

const THUMB_TILE_MARGIN_SCALES = [1, 0.94, 0.88, 0.82, 0.76, 0.7] as const;

function layoutTileInThumbnailAtMarginScale(
  plot: Plot,
  size: number,
  z: number,
  x: number,
  y: number,
  uri: string,
  marginScale: number,
): PlotListSatelliteTileLayout | null {
  const frame = readThumbnailGeoFrame(plot, size, 10, marginScale);
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
    geoMarginScale: marginScale,
  };
}

function pickSingleTileCoveringBounds(
  bbox: { north: number; south: number; west: number; east: number },
  zValues: number[],
): { z: number; x: number; y: number } | null {
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
  return null;
}

function pickCentroidTileCoveringCanvas(
  plot: Plot,
  size: number,
  zValues: number[],
): { z: number; x: number; y: number } | null {
  const centroid = plotCentroid(plot);
  for (const z of zValues) {
    const x = lonToTileX(centroid.longitude, z);
    const y = latToTileY(centroid.latitude, z);
    const layout = layoutTileInThumbnail(plot, size, z, x, y, 'tile://probe');
    if (layout && tileLayoutCoversThumbnailCanvas(layout, size)) {
      return { z, x, y };
    }
  }
  return null;
}

/** Try adjacent tiles when centroid tile leaves grey bands near a Web Mercator edge. */
function pickNeighborTileCoveringCanvas(
  plot: Plot,
  size: number,
  zValues: number[],
): { z: number; x: number; y: number } | null {
  const bbox = paddedPlotGeoBounds(plot, size);
  if (!bbox) return null;

  for (const z of zValues) {
    const xMin = lonToTileX(bbox.west, z);
    const xMax = lonToTileX(bbox.east, z);
    const yNorth = latToTileY(bbox.north, z);
    const ySouth = latToTileY(bbox.south, z);

    for (let x = xMin - 1; x <= xMax + 1; x++) {
      if (x < 0) continue;
      for (let y = Math.max(0, yNorth - 1); y <= ySouth + 1; y++) {
        const layout = layoutTileInThumbnail(plot, size, z, x, y, 'tile://probe');
        if (layout && tileLayoutCoversThumbnailCanvas(layout, size)) {
          return { z, x, y };
        }
      }
    }
  }
  return null;
}

function descendingZoomRange(maxZ: number, minZ: number): number[] {
  const span = Math.max(0, maxZ - minZ + 1);
  return Array.from({ length: span }, (_, i) => maxZ - i);
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
      : descendingZoomRange(FIELD_MAP_TILE_MAX_ZOOM, PLOT_LIST_THUMB_MIN_TILE_ZOOM);

  const covering = pickSingleTileCoveringBounds(bbox, zValues);
  if (covering) return covering;

  const centroidCovering = pickCentroidTileCoveringCanvas(plot, size, zValues);
  if (centroidCovering) return centroidCovering;

  const neighborCovering = pickNeighborTileCoveringCanvas(plot, size, zValues);
  if (neighborCovering) return neighborCovering;

  if (forcedZ != null) {
    const centroid = plotCentroid(plot);
    return {
      z: forcedZ,
      x: lonToTileX(centroid.longitude, forcedZ),
      y: latToTileY(centroid.latitude, forcedZ),
    };
  }

  const centroid = plotCentroid(plot);
  const z = PLOT_LIST_THUMB_MIN_TILE_ZOOM;
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
  for (const marginScale of THUMB_TILE_MARGIN_SCALES) {
    const layout = layoutTileInThumbnailAtMarginScale(plot, size, z, x, y, uri, marginScale);
    if (layout && tileLayoutCoversThumbnailCanvas(layout, size)) {
      return layout;
    }
  }

  const fallback =
    layoutTileInThumbnailAtMarginScale(plot, size, z, x, y, uri, 1) ??
    layoutTileInThumbnailAtMarginScale(plot, size, z, x, y, uri, THUMB_TILE_MARGIN_SCALES.at(-1)!);
  if (!fallback) return null;
  return ensureTileLayoutCoversCanvas(fallback, size);
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
  marginScale = 1,
): PlotThumbnailPoint[] {
  const frame = readThumbnailGeoFrame(plot, size, 10, marginScale);
  if (!frame) return [];
  return plot.points.map((point) =>
    projectGeoToThumbnail(point.latitude, point.longitude, frame),
  );
}
