import * as FileSystem from 'expo-file-system';

export type OfflineTilesDownloadPreset = {
  id: string;
  label: string;
  bbox: { west: number; south: number; east: number; north: number };
  zooms: number[];
};

export type OfflineTilesBbox = { west: number; south: number; east: number; north: number };

export type OfflineTilesPackMeta = {
  id: string;
  label: string;
  source: 'osm_raster' | 'mbtiles_extract';
  bbox: OfflineTilesBbox;
  zooms: number[];
  createdAt: number;
  downloadedAt?: number;
  tileCount?: number;
};

export type OfflineTilesProgress = {
  total: number;
  done: number;
  downloaded: number;
  skipped: number;
  lastZ?: number;
};

const fsAny = FileSystem as any;
export const OFFLINE_TILES_ROOT = `${(fsAny.documentDirectory ?? '') as string}offlineTiles`;
export const OFFLINE_TILES_PACKS_DIR = `${OFFLINE_TILES_ROOT}/packs`;
const LEGACY_OSM_DIR = `${OFFLINE_TILES_ROOT}/osm`;

export const OFFLINE_TILE_PRESETS: OfflineTilesDownloadPreset[] = [
  {
    id: 'tegucigalpa-demo',
    label: 'Tegucigalpa (demo area)',
    bbox: {
      west: -87.235,
      south: 14.03,
      east: -87.09,
      north: 14.16,
    },
    zooms: [12, 13, 14, 15],
  },
];

function lonToTileX(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}

function latToTileY(lat: number, z: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, z);
  return Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
}

function packTilesDir(packId: string) {
  return `${OFFLINE_TILES_PACKS_DIR}/${packId}/tiles`;
}

function packMetaPath(packId: string) {
  return `${OFFLINE_TILES_PACKS_DIR}/${packId}/meta.json`;
}

function tilePath(tilesDir: string, z: number, x: number, y: number) {
  return `${tilesDir}/${z}/${x}/${y}.png`;
}

function ensureDir(path: string) {
  return FileSystem.makeDirectoryAsync(path, { intermediates: true }).catch(() => undefined);
}

export function estimateTilesForBbox(bbox: OfflineTilesBbox, zooms: number[]) {
  let total = 0;
  for (const z of zooms) {
    const xMin = lonToTileX(bbox.west, z);
    const xMax = lonToTileX(bbox.east, z);
    const yMin = latToTileY(bbox.north, z);
    const yMax = latToTileY(bbox.south, z);
    total += (xMax - xMin + 1) * (yMax - yMin + 1);
  }
  return total;
}

export async function getOfflineTilesStats(): Promise<{
  downloadedAt: number | null;
  fileCount: number;
}> {
  // Backwards-compatible stats for the legacy single-cache folder (still useful as a quick sanity check).
  const metaPath = `${LEGACY_OSM_DIR}/_meta.json`;
  const meta = await FileSystem.readAsStringAsync(metaPath).catch(() => null);
  let downloadedAt: number | null = null;
  if (meta) {
    try {
      const parsed = JSON.parse(meta);
      downloadedAt = typeof parsed?.downloadedAt === 'number' ? parsed.downloadedAt : null;
    } catch {
      downloadedAt = null;
    }
  }

  const rootInfo = await FileSystem.getInfoAsync(LEGACY_OSM_DIR).catch(() => ({ exists: false }));
  if (!rootInfo.exists) {
    return { downloadedAt, fileCount: 0 };
  }

  let fileCount = 0;
  const zDirs = await FileSystem.readDirectoryAsync(LEGACY_OSM_DIR).catch(() => []);
  for (const zDir of zDirs) {
    if (zDir.startsWith('_')) continue;
    const xDirs = await FileSystem.readDirectoryAsync(`${LEGACY_OSM_DIR}/${zDir}`).catch(() => []);
    for (const xDir of xDirs) {
      const yFiles = await FileSystem.readDirectoryAsync(`${LEGACY_OSM_DIR}/${zDir}/${xDir}`).catch(
        () => [],
      );
      fileCount += yFiles.length;
    }
  }

  return { downloadedAt, fileCount };
}

export async function clearOfflineTiles(): Promise<void> {
  await FileSystem.deleteAsync(LEGACY_OSM_DIR, { idempotent: true }).catch(() => undefined);
}

export async function downloadOfflineTiles(preset: OfflineTilesDownloadPreset): Promise<{
  downloaded: number;
  skipped: number;
}> {
  await ensureDir(LEGACY_OSM_DIR);

  let downloaded = 0;
  let skipped = 0;

  for (const z of preset.zooms) {
    const xMin = lonToTileX(preset.bbox.west, z);
    const xMax = lonToTileX(preset.bbox.east, z);
    const yMin = latToTileY(preset.bbox.north, z);
    const yMax = latToTileY(preset.bbox.south, z);

    for (let x = xMin; x <= xMax; x++) {
      const xDir = `${LEGACY_OSM_DIR}/${z}/${x}`;
      await ensureDir(xDir);
      for (let y = yMin; y <= yMax; y++) {
        const path = `${LEGACY_OSM_DIR}/${z}/${x}/${y}.png`;
        const info = await FileSystem.getInfoAsync(path).catch(() => ({ exists: false }));
        if (info.exists) {
          skipped++;
          continue;
        }

        const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        const res = await FileSystem.downloadAsync(url, path).catch(() => null);
        if (res?.status === 200) {
          downloaded++;
        } else {
          await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
        }
      }
    }
  }

  const metaPath = `${LEGACY_OSM_DIR}/_meta.json`;
  await FileSystem.writeAsStringAsync(
    metaPath,
    JSON.stringify({ downloadedAt: Date.now(), presetId: preset.id }),
  ).catch(() => undefined);

  return { downloaded, skipped };
}

export async function listOfflineTilePacks(): Promise<OfflineTilesPackMeta[]> {
  const info = await FileSystem.getInfoAsync(OFFLINE_TILES_PACKS_DIR).catch(() => ({ exists: false }));
  if (!info.exists) return [];

  const ids = await FileSystem.readDirectoryAsync(OFFLINE_TILES_PACKS_DIR).catch(() => []);
  const metas: OfflineTilesPackMeta[] = [];
  for (const id of ids) {
    const metaStr = await FileSystem.readAsStringAsync(packMetaPath(id)).catch(() => null);
    if (!metaStr) continue;
    try {
      const meta = JSON.parse(metaStr) as OfflineTilesPackMeta;
      if (meta?.id && meta?.label) metas.push(meta);
    } catch {
      // ignore
    }
  }
  metas.sort((a, b) => (b.downloadedAt ?? b.createdAt) - (a.downloadedAt ?? a.createdAt));
  return metas;
}

export async function clearOfflineTilePack(packId: string): Promise<void> {
  await FileSystem.deleteAsync(`${OFFLINE_TILES_PACKS_DIR}/${packId}`, { idempotent: true }).catch(
    () => undefined,
  );
}

export async function downloadOfflineTilePack(params: {
  packId: string;
  label: string;
  bbox: OfflineTilesBbox;
  zooms: number[];
  onProgress?: (p: OfflineTilesProgress) => void;
  shouldCancel?: () => boolean;
}): Promise<{ meta: OfflineTilesPackMeta; downloaded: number; skipped: number; total: number }> {
  await ensureDir(OFFLINE_TILES_PACKS_DIR);

  const tilesDir = packTilesDir(params.packId);
  await ensureDir(tilesDir);

  const total = estimateTilesForBbox(params.bbox, params.zooms);
  let done = 0;
  let downloaded = 0;
  let skipped = 0;

  for (const z of params.zooms) {
    const xMin = lonToTileX(params.bbox.west, z);
    const xMax = lonToTileX(params.bbox.east, z);
    const yMin = latToTileY(params.bbox.north, z);
    const yMax = latToTileY(params.bbox.south, z);

    for (let x = xMin; x <= xMax; x++) {
      if (params.shouldCancel?.()) {
        throw new Error('Cancelled');
      }
      const xDir = `${tilesDir}/${z}/${x}`;
      await ensureDir(xDir);
      for (let y = yMin; y <= yMax; y++) {
        if (params.shouldCancel?.()) {
          throw new Error('Cancelled');
        }
        const path = tilePath(tilesDir, z, x, y);
        const info = await FileSystem.getInfoAsync(path).catch(() => ({ exists: false }));
        if (info.exists) {
          skipped++;
          done++;
          params.onProgress?.({ total, done, downloaded, skipped, lastZ: z });
          continue;
        }

        const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        const res = await FileSystem.downloadAsync(url, path).catch(() => null);
        if (res?.status === 200) {
          downloaded++;
        } else {
          await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
        }
        done++;
        params.onProgress?.({ total, done, downloaded, skipped, lastZ: z });
      }
    }
  }

  const meta: OfflineTilesPackMeta = {
    id: params.packId,
    label: params.label,
    source: 'osm_raster',
    bbox: params.bbox,
    zooms: params.zooms,
    createdAt: Date.now(),
    downloadedAt: Date.now(),
    tileCount: downloaded + skipped,
  };
  await FileSystem.writeAsStringAsync(packMetaPath(params.packId), JSON.stringify(meta)).catch(
    () => undefined,
  );

  return { meta, downloaded, skipped, total };
}

export function getOfflineTilesUrlTemplate(packId?: string) {
  // `documentDirectory` is already a `file://` URL in Expo.
  if (!packId) {
    return `${LEGACY_OSM_DIR}/{z}/{x}/{y}.png`;
  }
  return `${packTilesDir(packId)}/{z}/{x}/{y}.png`;
}

