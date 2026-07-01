import * as FileSystem from 'expo-file-system/legacy';

import { buildFieldMapTileUrl } from '@/features/mapping/fieldMapTiles';
import {
  layoutTileInThumbnail,
  pickOfflinePackZoom,
  pickPlotListSatelliteTile,
  plotCentroid,
  type PlotListSatelliteTileLayout,
} from '@/features/mapping/plotListSatelliteTileLayout';
import { findPackCoveringCoordinate } from '@/features/offlineTiles/manualTraceImagery';
import {
  listOfflineTilePacks,
  OFFLINE_TILES_PACKS_DIR,
  type OfflineTilesPackMeta,
} from '@/features/offlineTiles/offlineTiles';
import type { Plot } from '@/features/state/AppStateContext';

export type { PlotListSatelliteTileLayout } from '@/features/mapping/plotListSatelliteTileLayout';
export {
  layoutOnlineTileForPlot,
  pickListThumbnailZoom,
  pickOfflinePackZoom,
  pickPlotListSatelliteTile,
  plotCentroid,
  thumbPointsFromGeo,
  tileGeoBounds,
} from '@/features/mapping/plotListSatelliteTileLayout';

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
  const onlineTile = pickPlotListSatelliteTile(plot, size);
  if (!onlineTile) return null;

  if (options?.offlineTilesEnabled) {
    const packs = options.listPacks ? await options.listPacks() : await listOfflineTilePacks();
    const pack = findPackCoveringCoordinate(
      packs,
      centroid.latitude,
      centroid.longitude,
      options.offlineTilesPackId,
    );
    if (pack) {
      const offlineZ = pickOfflinePackZoom(pack, plot, size);
      const offlineTile = pickPlotListSatelliteTile(plot, size, offlineZ);
      if (offlineTile) {
        const localPath = offlineTilePath(pack.id, offlineTile.z, offlineTile.x, offlineTile.y);
        const info = await FileSystem.getInfoAsync(localPath).catch(() => null);
        if (info?.exists) {
          return layoutTileInThumbnail(
            plot,
            size,
            offlineTile.z,
            offlineTile.x,
            offlineTile.y,
            localPath,
          );
        }
      }
    }
  }

  const { z, x, y } = onlineTile;
  const onlineUri = buildFieldMapTileUrl(z, x, y);
  let tileUri = onlineUri;
  if (options?.cacheOnlineTileLocally) {
    const cached = await cacheOnlineTileLocally(z, x, y, onlineUri);
    tileUri = cached ?? onlineUri;
  }
  return layoutTileInThumbnail(plot, size, z, x, y, tileUri);
}
