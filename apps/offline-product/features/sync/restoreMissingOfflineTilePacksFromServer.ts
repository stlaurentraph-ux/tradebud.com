import * as FileSystem from 'expo-file-system';

import type { OfflineTilesPackMeta } from '@/features/offlineTiles/offlineTiles';
import {
  downloadOfflineTilePack,
  listOfflineTilePacks,
  packMetaPath,
} from '@/features/offlineTiles/offlineTiles';

export type RestoreMissingOfflineTilePacksResult = {
  queuedDownloads: number;
};

/** Re-download tile packs whose manifest exists on server but files are missing locally. */
export async function restoreMissingOfflineTilePacksFromServer(params: {
  packs: OfflineTilesPackMeta[];
}): Promise<RestoreMissingOfflineTilePacksResult> {
  const localPacks = await listOfflineTilePacks().catch(() => [] as OfflineTilesPackMeta[]);
  const localIds = new Set(localPacks.map((pack) => pack.id));
  let queuedDownloads = 0;

  for (const pack of params.packs) {
    if (!pack?.id || localIds.has(pack.id)) continue;
    const metaExists = await FileSystem.getInfoAsync(packMetaPath(pack.id)).catch(() => ({
      exists: false,
    }));
    if (metaExists.exists) continue;

    queuedDownloads += 1;
    void downloadOfflineTilePack({
      packId: pack.id,
      label: pack.label,
      bbox: pack.bbox,
      zooms: pack.zooms,
    }).catch(() => undefined);
  }

  return { queuedDownloads };
}
