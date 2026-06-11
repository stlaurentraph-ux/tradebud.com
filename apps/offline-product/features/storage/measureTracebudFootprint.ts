import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

import { OFFLINE_TILES_ROOT } from '@/features/offlineTiles/offlineTiles';
import { collectTracebudMediaFileUris } from '@/features/state/persistence';

export type TracebudStorageFootprint = {
  totalBytes: number;
  sqliteBytes: number;
  offlineTilesBytes: number;
  mediaBytes: number;
};

const fsAny = FileSystem as { documentDirectory?: string | null };

function normalizeLocalPath(uriOrPath: string): string | null {
  const trimmed = uriOrPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('file://')) {
    try {
      return decodeURIComponent(trimmed.replace(/^file:\/\//, ''));
    } catch {
      return trimmed.replace(/^file:\/\//, '');
    }
  }
  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

function pathWithinRoot(path: string, root: string): boolean {
  if (!root) return false;
  const normalizedRoot = root.endsWith('/') ? root.slice(0, -1) : root;
  return path === normalizedRoot || path.startsWith(`${normalizedRoot}/`);
}

async function claimDirectoryBytes(dirPath: string, claimed: Set<string>): Promise<number> {
  const normalized = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
  if (!normalized || claimed.has(normalized)) return 0;

  const info = await FileSystem.getInfoAsync(normalized).catch(() => null);
  if (!info?.exists) return 0;

  if (!info.isDirectory) {
    claimed.add(normalized);
    return info.size ?? 0;
  }

  claimed.add(normalized);
  const children = await FileSystem.readDirectoryAsync(normalized).catch(() => []);
  let total = 0;
  const prefix = `${normalized}/`;
  for (const child of children) {
    total += await claimDirectoryBytes(`${prefix}${child}`, claimed);
  }
  return total;
}

async function claimFileUriBytes(uri: string, claimed: Set<string>): Promise<number> {
  const path = normalizeLocalPath(uri);
  if (!path) return 0;

  for (const claimedPath of claimed) {
    if (pathWithinRoot(path, claimedPath)) return 0;
  }

  const info = await FileSystem.getInfoAsync(path).catch(() => null);
  if (!info?.exists) return 0;
  if (info.isDirectory) return claimDirectoryBytes(path, claimed);

  claimed.add(path);
  return info.size ?? 0;
}

export function footprintBytesToMb(bytes: number): number {
  if (bytes <= 0) return 0;
  return Math.max(1, Math.ceil(bytes / (1024 * 1024)));
}

export async function measureTracebudStorageFootprint(): Promise<TracebudStorageFootprint> {
  if (Platform.OS === 'web') {
    return { totalBytes: 0, sqliteBytes: 0, offlineTilesBytes: 0, mediaBytes: 0 };
  }

  const claimed = new Set<string>();
  const doc = fsAny.documentDirectory ?? '';

  const sqliteBytes = await claimDirectoryBytes(`${doc}SQLite`, claimed);
  const offlineTilesBytes = await claimDirectoryBytes(OFFLINE_TILES_ROOT, claimed);

  const mediaUris = await collectTracebudMediaFileUris();
  let mediaBytes = 0;
  for (const uri of mediaUris) {
    mediaBytes += await claimFileUriBytes(uri, claimed);
  }
  mediaBytes += await claimFileUriBytes(`${doc}farmer-profile.jpg`, claimed);

  const totalBytes = sqliteBytes + offlineTilesBytes + mediaBytes;
  return { totalBytes, sqliteBytes, offlineTilesBytes, mediaBytes };
}
