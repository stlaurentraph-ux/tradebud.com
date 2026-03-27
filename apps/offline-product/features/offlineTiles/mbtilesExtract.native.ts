import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { fromByteArray } from 'base64-js';
import {
  OFFLINE_TILES_PACKS_DIR,
  type OfflineTilesPackMeta,
  type OfflineTilesProgress,
} from './offlineTiles';

function ensureDir(path: string) {
  return FileSystem.makeDirectoryAsync(path, { intermediates: true }).catch(() => undefined);
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

function tmsToXyzY(z: number, yTms: number) {
  const n = Math.pow(2, z);
  return n - 1 - yTms;
}

export async function extractMbtilesToPack(params: {
  mbtilesUri: string;
  packId: string;
  label: string;
  bbox: { west: number; south: number; east: number; north: number };
  zooms: number[];
  onProgress?: (p: OfflineTilesProgress) => void;
  shouldCancel?: () => boolean;
}): Promise<{ meta: OfflineTilesPackMeta; downloaded: number; skipped: number; total: number }> {
  await ensureDir(OFFLINE_TILES_PACKS_DIR);

  const tilesDir = packTilesDir(params.packId);
  await ensureDir(tilesDir);

  const fsAny = FileSystem as any;
  const dbDir = `${(fsAny.documentDirectory ?? '') as string}mbtiles`;
  await ensureDir(dbDir);
  const dbName = `${params.packId}.mbtiles`;
  const dbPath = `${dbDir}/${dbName}`;

  await FileSystem.copyAsync({ from: params.mbtilesUri, to: dbPath });

  const db = await SQLite.openDatabaseAsync(dbName, undefined, dbDir);

  const minZ = Math.min(...params.zooms);
  const maxZ = Math.max(...params.zooms);
  const countRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(1) AS c FROM tiles WHERE zoom_level BETWEEN ? AND ?;',
    [minZ, maxZ],
  );
  const total = countRow?.c ?? 0;

  let done = 0;
  let downloaded = 0;
  let skipped = 0;

  const statement = await db.prepareAsync(
    'SELECT zoom_level AS z, tile_column AS x, tile_row AS y_tms, tile_data AS data FROM tiles WHERE zoom_level BETWEEN ? AND ?;',
  );
  try {
    const result = await statement.executeAsync<{
      z: number;
      x: number;
      y_tms: number;
      data: Uint8Array;
    }>([minZ, maxZ]);

    for await (const row of result) {
      if (params.shouldCancel?.()) throw new Error('Cancelled');
      if (!params.zooms.includes(row.z)) continue;

      const y = tmsToXyzY(row.z, row.y_tms);
      const xDir = `${tilesDir}/${row.z}/${row.x}`;
      await ensureDir(xDir);

      const outPath = tilePath(tilesDir, row.z, row.x, y);
      const info = await FileSystem.getInfoAsync(outPath).catch(() => ({ exists: false }));
      if (info.exists) {
        skipped++;
        done++;
        params.onProgress?.({ total, done, downloaded, skipped, lastZ: row.z });
        continue;
      }

      const bytes = row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data as any);
      const b64 = fromByteArray(bytes);
      await FileSystem.writeAsStringAsync(outPath, b64, {
        encoding: (fsAny.EncodingType?.Base64 ?? 'base64') as any,
      });

      downloaded++;
      done++;
      params.onProgress?.({ total, done, downloaded, skipped, lastZ: row.z });
    }
  } finally {
    await statement.finalizeAsync();
    await db.closeAsync().catch(() => undefined);
  }

  const meta: OfflineTilesPackMeta = {
    id: params.packId,
    label: params.label,
    source: 'mbtiles_extract',
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

