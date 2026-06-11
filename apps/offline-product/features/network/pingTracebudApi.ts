import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

const PING_TIMEOUT_MS = 8_000;

/** True when the Tracebud API health endpoint responds (no auth required). */
export async function pingTracebudApi(): Promise<boolean> {
  try {
    const base = getTracebudApiBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/health`, { method: 'GET', signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
