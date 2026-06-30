import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const DB_NAME = 'tracebud_offline.db';
const MAESTRO_CI_BUILD = process.env.EXPO_PUBLIC_MAESTRO_CI === '1';
const fsAny = FileSystem as { documentDirectory?: string | null };

/** Bundled at assemble time via scripts/generate-maestro-ci-boot-db.mjs */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MAESTRO_BOOT_DB_ASSET = require('../../assets/maestro/tracebud_offline.db');

function sqliteDirectory(): string {
  return `${fsAny.documentDirectory ?? ''}SQLite`;
}

function sqliteDatabasePath(): string {
  return `${sqliteDirectory()}/${DB_NAME}`;
}

/**
 * Copy golden-path minimal SQLite from APK assets before expo-sqlite opens the DB.
 * Android Maestro CI APKs are non-debuggable (embedded bundle), so host adb seeding is unreliable.
 */
export async function ensureMaestroCiBootDatabase(): Promise<void> {
  if (!MAESTRO_CI_BUILD || Platform.OS !== 'android') return;

  const dbPath = sqliteDatabasePath();
  const existing = await FileSystem.getInfoAsync(dbPath);
  if (existing.exists) {
    console.warn('[MaestroBoot] using existing SQLite at boot');
    return;
  }

  await FileSystem.makeDirectoryAsync(sqliteDirectory(), { intermediates: true });
  const asset = Asset.fromModule(MAESTRO_BOOT_DB_ASSET);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Maestro CI boot DB asset missing localUri after download');
  }
  await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
  console.warn('[MaestroBoot] copied bundled golden-path SQLite from assets');
}
