import * as FileSystem from 'expo-file-system';

import { pingFieldMapImagery } from '@/features/network/pingFieldMapImagery';
import { resolvePlotListSatelliteTileLayout } from '@/features/mapping/plotListSatelliteTile';
import {
  plotNeedsListThumbnailBackfill,
  plotListThumbnailFilePath,
  plotListThumbnailUriBasePath,
  PLOT_LIST_THUMB_MIN_BYTES,
} from '@/features/mapping/plotListThumbnailStore';
import { listOfflineTilePacks, OFFLINE_TILES_PACKS_DIR } from '@/features/offlineTiles/offlineTiles';
import type { Plot } from '@/features/state/AppStateContext';

export const PLOT_LIST_THUMB_BACKFILL_IMAGERY_TIMEOUT_MS = 12_000;
export const PLOT_LIST_THUMB_BACKFILL_MAX_ATTEMPTS = 5;
export const PLOT_LIST_THUMB_BACKFILL_RETRY_DELAY_MS = 2_500;

const fsAny = FileSystem as { documentDirectory?: string | null };

/** Strip cache-buster query from persisted list thumbnail URI. */
export { plotListThumbnailUriBasePath } from '@/features/mapping/plotListThumbnailStore';

export async function plotListThumbnailFileExists(listThumbnailUri?: string | null): Promise<boolean> {
  const raw = listThumbnailUri?.trim();
  if (!raw) return false;
  const path = plotListThumbnailUriBasePath(raw);
  const info = await FileSystem.getInfoAsync(path).catch(() => null);
  return Boolean(info?.exists);
}

export async function plotListThumbnailFileLikelyBlank(listThumbnailUri?: string | null): Promise<boolean> {
  const raw = listThumbnailUri?.trim();
  if (!raw) return true;
  const path = plotListThumbnailUriBasePath(raw);
  const info = await FileSystem.getInfoAsync(path).catch(() => null);
  if (!info?.exists) return true;
  const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;
  return size < PLOT_LIST_THUMB_MIN_BYTES;
}

export function plotNeedsListThumbnailBackfillSync(plot: {
  points: unknown[];
  listThumbnailUri?: string | null;
}): boolean {
  return plotNeedsListThumbnailBackfill(plot);
}

/** True when Esri tiles respond on the network. */
export async function isFieldMapImageryOnline(): Promise<boolean> {
  return pingFieldMapImagery();
}

async function plotHasOfflineSatelliteTile(
  plot: Plot,
  offlineTilesPackId: string | null,
): Promise<boolean> {
  const layout = await resolvePlotListSatelliteTileLayout(plot, 88, {
    offlineTilesEnabled: true,
    offlineTilesPackId,
    listPacks: listOfflineTilePacks,
  });
  if (!layout?.uri) return false;
  if (!layout.uri.includes(OFFLINE_TILES_PACKS_DIR) && !layout.uri.startsWith('file://')) {
    return false;
  }
  const info = await FileSystem.getInfoAsync(layout.uri).catch(() => null);
  return Boolean(info?.exists);
}

/** Whether we can build a satellite-backed PNG for this plot right now. */
export async function canCapturePlotListSatelliteThumb(
  plot: Plot,
  options: {
    mapImageryOnline: boolean;
    offlineTilesEnabled: boolean;
    offlineTilesPackId: string | null;
  },
): Promise<boolean> {
  if (plot.points.length === 0) return false;
  if (options.mapImageryOnline) return true;
  if (!options.offlineTilesEnabled) return false;
  return plotHasOfflineSatelliteTile(plot, options.offlineTilesPackId);
}

export async function plotNeedsListThumbnailBackfillAsync(
  plot: Plot,
  options: {
    mapImageryOnline: boolean;
    offlineTilesEnabled: boolean;
    offlineTilesPackId: string | null;
  },
): Promise<boolean> {
  if (plot.points.length === 0) return false;

  const canCapture = await canCapturePlotListSatelliteThumb(plot, options);
  if (!canCapture) return false;

  if (!plot.listThumbnailUri?.trim()) return true;

  const exists = await plotListThumbnailFileExists(plot.listThumbnailUri);
  if (!exists) return true;

  return plotListThumbnailFileLikelyBlank(plot.listThumbnailUri);
}

export async function findNextPlotForListThumbnailBackfill(
  plots: Plot[],
  options: {
    mapImageryOnline?: boolean;
    offlineTilesEnabled: boolean;
    offlineTilesPackId: string | null;
    skipPlotIds?: Set<string>;
  },
): Promise<Plot | undefined> {
  const mapImageryOnline =
    options.mapImageryOnline ?? (await isFieldMapImageryOnline().catch(() => false));
  const resolved = { ...options, mapImageryOnline };

  for (const plot of plots) {
    if (options.skipPlotIds?.has(plot.id)) continue;
    const needs = await plotNeedsListThumbnailBackfillAsync(plot, resolved);
    if (needs) return plot;
  }
  return undefined;
}

export function plotListThumbnailDestPath(plotId: string): string | null {
  if (!fsAny.documentDirectory) return null;
  return plotListThumbnailFilePath(plotId, fsAny.documentDirectory);
}
