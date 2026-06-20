import { getAccessTokenFromSupabase } from '@/features/api/syncAuthSession';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import {
  cacheBustUrl,
  isSuccessfulApiResponse,
  TRACEBUD_NO_CACHE_HEADERS,
} from '@/features/network/apiFetchResponse';

const PING_TIMEOUT_MS = 8_000;
const PING_ATTEMPTS = 2;

async function pingHealthOnce(): Promise<boolean> {
  const base = getTracebudApiBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(cacheBustUrl(`${base}/health`), {
      method: 'GET',
      signal: controller.signal,
      headers: TRACEBUD_NO_CACHE_HEADERS,
    });
    return isSuccessfulApiResponse(res.status);
  } finally {
    clearTimeout(timeout);
  }
}

/** True when the Tracebud API health endpoint responds (no auth required). */
export async function pingTracebudApi(): Promise<boolean> {
  try {
    for (let attempt = 0; attempt < PING_ATTEMPTS; attempt += 1) {
      if (await pingHealthOnce()) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Health ping, then an authenticated GET if needed — any HTTP response counts as reachable.
 * Avoids false "couldn't reach Tracebud" when `/health` 304s but the API is up.
 */
export async function probeTracebudApiReachable(): Promise<boolean> {
  if (await pingTracebudApi()) {
    return true;
  }

  let accessToken: string | null = null;
  try {
    accessToken = await getAccessTokenFromSupabase();
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    return false;
  }

  try {
    const base = getTracebudApiBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      await fetch(cacheBustUrl(`${base}/v1/me/field-farmer-ids`), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...TRACEBUD_NO_CACHE_HEADERS,
        },
      });
      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}
