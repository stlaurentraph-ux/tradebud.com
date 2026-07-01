import * as FileSystem from 'expo-file-system';

import { buildFieldMapTileUrl } from '@/features/mapping/fieldMapTiles';
import {
  projectGeoToThumbnail,
  readThumbnailGeoFrame,
  type PlotThumbnailPoint,
} from '@/features/mapping/plotThumbnailGeometry';
import { findPackCoveringCoordinate } from '@/features/offlineTiles/manualTraceImagery';
import {
  listOfflineTilePacks,
  OFFLINE_TILES_PACKS_DIR,
  type OfflineTilesPackMeta,
} from '@/features/offlineTiles/offlineTiles';
import type { Plot } from '@/features/state/AppStateContext';

export type PlotListSatelliteTileLayout = {
  uri: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

function latToTileY(lat: number, z: number): number {
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

export function pickListThumbnailZoom(plot: Plot): number {
  const lats = plot.points.map((point) => point.latitude);
  const lons = plot.points.map((point) => point.longitude);
  const span = Math.max(
    Math.max(...lats) - Math.min(...lats),
    Math.max(...lons) - Math.min(...lons),
  );
  if (span > 0.05) return 12;
  if (span > 0.02) return 13;
  if (span > 0.008) return 14;
  if (span > 0.003) return 15;
  return 16;
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

function layoutTileInThumbnail(
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

function offlineTilePath(packId: string, z: number, x: number, y: number): string {
  return `${OFFLINE_TILES_PACKS_DIR}/${packId}/tiles/${z}/${x}/${y}.png`;
}

const fsAny = FileSystem as { documentDirectory?: string | null };

async function cacheOnlineTileLocally(z: number, x: number, y: number, onlineUri: string): Promise<string | null> {
  if (!fsAny.documentDirectory) return null;
  const cacheDir = `${fsAny.documentDirectory}plot-list-thumbs/tiles`;
  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => undefined);
  const cachePath = `${cacheDir}/${z}-${x}-${y}.png`;
  const info = await FileSystem.getInfoAsync(cachePath).catch(() => null);
  if (info?.exists) return cachePath;
  const downloaded = await FileSystem.downloadAsync(onlineUri, cachePath).catch(() => null);
  return downloaded?.uri ?? null;
}

export async function resolvePlotListSatelliteTileLayout(
  plot: Plot,
  size: number,
  options?: {
    offlineTilesEnabled?: boolean;
    offlineTilesPackId?: string | null;
    listPacks?: () => Promise<OfflineTilesPackMeta[]>;
    /** Download Esri tile to disk first — reliable for list rows and view-shot backfill. */
    cacheOnlineTileLocally?: boolean;
  },
): Promise<PlotListSatelliteTileLayout | null> {
  if (plot.points.length === 0) return null;

  const centroid = plotCentroid(plot);
  const z = pickListThumbnailZoom(plot);
  const x = lonToTileX(centroid.longitude, z);
  const y = latToTileY(centroid.latitude, z);

  if (options?.offlineTilesEnabled) {
    const packs = options.listPacks ? await options.listPacks() : await listOfflineTilePacks();
    const pack = findPackCoveringCoordinate(
      packs,
      centroid.latitude,
      centroid.longitude,
      options.offlineTilesPackId,
    );
    if (pack) {
      const localPath = offlineTilePath(pack.id, z, x, y);
      const info = await FileSystem.getInfoAsync(localPath).catch(() => null);
      if (info?.exists) {
        return layoutTileInThumbnail(plot, size, z, x, y, localPath);
      }
    }
  }

  const onlineUri = buildFieldMapTileUrl(z, x, y);
  let tileUri = onlineUri;
  if (options?.cacheOnlineTileLocally) {
    const cached = await cacheOnlineTileLocally(z, x, y, onlineUri);
    if (!cached) return null;
    tileUri = cached;
  }
  return layoutTileInThumbnail(plot, size, z, x, y, tileUri);
}

/** @internal test helper */
export function layoutOnlineTileForPlot(plot: Plot, size: number): PlotListSatelliteTileLayout | null {
  const centroid = plotCentroid(plot);
  const z = pickListThumbnailZoom(plot);
  const x = lonToTileX(centroid.longitude, z);
  const y = latToTileY(centroid.latitude, z);
  return layoutTileInThumbnail(plot, size, z, x, y, buildFieldMapTileUrl(z, x, y));
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
