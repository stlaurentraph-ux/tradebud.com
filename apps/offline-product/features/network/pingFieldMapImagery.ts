import { buildFieldMapTileUrl } from '@/features/mapping/fieldMapTiles';

const PING_TIMEOUT_MS = 6_000;

/** True when Esri (or configured) field-map tiles respond — proxy for online satellite trace. */
export async function pingFieldMapImagery(): Promise<boolean> {
  try {
    const url = buildFieldMapTileUrl(10, 300, 520);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
