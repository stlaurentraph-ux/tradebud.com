import { getAccessTokenFromSupabase } from '@/features/api/syncAuthSession';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import {
  cacheBustUrl,
  isSuccessfulApiResponse,
  tracebudFetchWithTimeout,
  TRACEBUD_NO_CACHE_HEADERS,
} from '@/features/network/apiFetchResponse';

const PING_TIMEOUT_MS = 15_000;
const PING_ATTEMPTS = 2;

async function pingHealthOnce(): Promise<boolean> {
  const base = getTracebudApiBaseUrl();
  const res = await tracebudFetchWithTimeout(
    cacheBustUrl(`${base}/health`),
    {
      method: 'GET',
      headers: TRACEBUD_NO_CACHE_HEADERS,
    },
    PING_TIMEOUT_MS,
  );
  return res != null && isSuccessfulApiResponse(res.status);
}

/** True when the API accepted the bearer token (2xx/304) or rejected scope (403), not 401. */
export function isAcceptedSyncAccessTokenResponse(status: number): boolean {
  return isSuccessfulApiResponse(status) || status === 403;
}

/** True when an authenticated Tracebud GET accepts the bearer token. */
async function probeAuthenticatedTracebudApi(accessToken: string): Promise<boolean> {
  const base = getTracebudApiBaseUrl();
  const res = await tracebudFetchWithTimeout(
    cacheBustUrl(`${base}/v1/me/field-farmer-ids`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...TRACEBUD_NO_CACHE_HEADERS,
      },
    },
    PING_TIMEOUT_MS,
  );
  return res != null && isAcceptedSyncAccessTokenResponse(res.status);
}

/** Confirms a Supabase access token is still valid for Tracebud API calls. */
export async function probeSyncAccessTokenAccepted(accessToken: string): Promise<boolean> {
  const token = accessToken.trim();
  if (!token) return false;
  return probeAuthenticatedTracebudApi(token);
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
 * Confirms Tracebud API transport is up. When an access token is known, prefer an
 * authenticated GET (more reliable than `/health` on some mobile networks).
 */
export async function probeTracebudApiReachable(options?: {
  accessToken?: string | null;
}): Promise<boolean> {
  const providedToken = options?.accessToken?.trim() || null;
  if (providedToken && (await probeAuthenticatedTracebudApi(providedToken))) {
    return true;
  }

  if (await pingTracebudApi()) {
    return true;
  }

  if (providedToken) {
    return false;
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

  return probeAuthenticatedTracebudApi(accessToken);
}
