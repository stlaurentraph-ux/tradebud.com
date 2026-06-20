import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import { API_FETCH_NO_CACHE, isSuccessfulApiResponse } from '@/features/network/apiFetchResponse';

const PING_TIMEOUT_MS = 8_000;

/** True when the Tracebud API health endpoint responds (no auth required). */
export async function pingTracebudApi(): Promise<boolean> {
  try {
    const base = getTracebudApiBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/health`, {
        method: 'GET',
        signal: controller.signal,
        ...API_FETCH_NO_CACHE,
      });
      return isSuccessfulApiResponse(res.status);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
