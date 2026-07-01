import { buildFieldMapTileUrl } from '@/features/mapping/fieldMapTiles';

/** Esri tile probe — short timeout so offline farmers see the banner quickly. */
export const FIELD_MAP_IMAGERY_PING_TIMEOUT_MS = 2_500;

/** True when Esri (or configured) field-map tiles respond — proxy for online satellite trace. */
export async function pingFieldMapImagery(
  timeoutMs: number = FIELD_MAP_IMAGERY_PING_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const url = buildFieldMapTileUrl(10, 300, 520);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      return blob.size > 256;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
