import type { OfflineTilesPackMeta, OfflineTilesProgress } from './offlineTiles';

export async function extractMbtilesToPack(_params: {
  mbtilesUri: string;
  packId: string;
  label: string;
  bbox: { west: number; south: number; east: number; north: number };
  zooms: number[];
  onProgress?: (p: OfflineTilesProgress) => void;
  shouldCancel?: () => boolean;
}): Promise<{ meta: OfflineTilesPackMeta; downloaded: number; skipped: number; total: number }> {
  throw new Error('MBTiles import is not supported on web. Use the iOS/Android app.');
}

