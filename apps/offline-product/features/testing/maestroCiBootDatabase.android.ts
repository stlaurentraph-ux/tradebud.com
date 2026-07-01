// Expo SDK 55 throws when legacy helpers are imported from the main entry — CI APK boot must use /legacy.
import * as FileSystem from 'expo-file-system/legacy';

const DB_NAME = 'tracebud_offline.db';
const BUNDLED_BOOT_DB = 'maestro/tracebud_offline.db';
const fsAny = FileSystem as { documentDirectory?: string | null };

function sqliteDirectory(): string {
  return `${fsAny.documentDirectory ?? ''}SQLite`;
}

function sqliteDatabasePath(): string {
  return `${sqliteDirectory()}/${DB_NAME}`;
}

/**
 * Copy golden-path minimal SQLite from APK assets before expo-sqlite opens the DB.
 * The DB is copied into android/app/src/main/assets at assemble time (not Metro-bundled).
 */
export async function ensureMaestroCiBootDatabase(): Promise<void> {
  const dbPath = sqliteDatabasePath();
  const existing = await FileSystem.getInfoAsync(dbPath);
  if (existing.exists) {
    console.warn('[MaestroBoot] using existing SQLite at boot');
    return;
  }

  const bundleDir = FileSystem.bundleDirectory ?? null;
  const sourceUri = `${bundleDir ?? ''}${BUNDLED_BOOT_DB}`;
  console.warn(`[MaestroBoot] bundleDirectory=${bundleDir ?? 'null'} sourceUri=${sourceUri}`);
  const bundled = await FileSystem.getInfoAsync(sourceUri);
  if (!bundled.exists) {
    throw new Error(
      `Maestro CI boot DB missing from APK assets: sourceUri=${sourceUri} bundleDirectory=${bundleDir ?? 'null'} BUNDLED_BOOT_DB=${BUNDLED_BOOT_DB}`,
    );
  }

  await FileSystem.makeDirectoryAsync(sqliteDirectory(), { intermediates: true });
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: dbPath });
  } catch (copyError) {
    throw new Error(
      `Maestro CI boot DB copy failed: from=${sourceUri} to=${dbPath} error=${String(copyError)}`,
    );
  }
  console.warn('[MaestroBoot] copied bundled golden-path SQLite from APK assets');
}
