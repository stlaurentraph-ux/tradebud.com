/** Normalize Supabase storage object keys from API / audit payloads. */
export function normalizeEvidenceStoragePath(storagePath: string): string {
  return storagePath
    .trim()
    .replace(/^\/+/, '')
    .replace(/^plot-evidence\//, '');
}
