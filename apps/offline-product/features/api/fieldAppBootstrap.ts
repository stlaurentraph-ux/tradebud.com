import { getAccessTokenFromSupabase, getTracebudApiBaseUrl, hasSyncAuthSession } from '@/features/api/syncAuthSession';
import {
  cacheBustUrl,
  isSuccessfulApiResponse,
  TRACEBUD_NO_CACHE_HEADERS,
} from '@/features/network/apiFetchResponse';

const BOOTSTRAP_TIMEOUT_MS = 12_000;
/** Skip repeat bootstrap POSTs during a single sync session (plot upload calls this per plot). */
const BOOTSTRAP_CACHE_MS = 15 * 60 * 1000;

const bootstrappedAtByFarmerId = new Map<string, number>();
const inflightByFarmerId = new Map<string, Promise<{ ok: true } | { ok: false; message: string }>>();
let lastOwnedFarmerIds: string[] = [];
let ownedFarmerIdsSessionCache: string[] | null = null;
let ownedFarmerIdsSessionDepth = 0;

export function beginOwnedFarmerIdsSessionCache(): void {
  ownedFarmerIdsSessionDepth += 1;
}

export function endOwnedFarmerIdsSessionCache(): void {
  ownedFarmerIdsSessionDepth = Math.max(0, ownedFarmerIdsSessionDepth - 1);
  if (ownedFarmerIdsSessionDepth === 0) {
    ownedFarmerIdsSessionCache = null;
  }
}

export function clearFieldProducerBootstrapCache(): void {
  bootstrappedAtByFarmerId.clear();
  inflightByFarmerId.clear();
  lastOwnedFarmerIds = [];
  ownedFarmerIdsSessionCache = null;
  ownedFarmerIdsSessionDepth = 0;
}

export function getBootstrapOwnedFarmerIds(): string[] {
  return [...lastOwnedFarmerIds];
}

function rememberOwnedFarmerIds(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  const raw = (body as { owned_farmer_ids?: unknown }).owned_farmer_ids;
  if (!Array.isArray(raw)) return;
  const ids = raw.map((id) => String(id).trim()).filter(Boolean);
  if (ids.length > 0) {
    lastOwnedFarmerIds = ids;
  }
}

function isBootstrapCached(farmerId: string): boolean {
  const at = bootstrappedAtByFarmerId.get(farmerId);
  return at != null && Date.now() - at < BOOTSTRAP_CACHE_MS;
}

export async function bootstrapFieldAppProducer(
  params: {
    farmerId: string;
    fullName?: string;
    countryCode?: string;
  },
  options?: { timeoutMs?: number; force?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) {
    return { ok: false, message: 'sign_in_oauth_failed' };
  }

  if (!options?.force && isBootstrapCached(farmerId)) {
    return { ok: true };
  }

  const inflight = inflightByFarmerId.get(farmerId);
  if (!options?.force && inflight) {
    return inflight;
  }

  const run = (async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    const accessToken = await getAccessTokenFromSupabase();
    if (!accessToken) {
      return { ok: false, message: 'Sign in to sync your plots to Tracebud.' };
    }

    const apiBase = getTracebudApiBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? BOOTSTRAP_TIMEOUT_MS);

    try {
      const res = await fetch(`${apiBase}/v1/me/field-app-bootstrap`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId,
          fullName: params.fullName?.trim() || undefined,
          countryCode: params.countryCode?.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        rememberOwnedFarmerIds(body);
        bootstrappedAtByFarmerId.set(farmerId, Date.now());
        return { ok: true };
      }

      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Field app bootstrap failed (${res.status})`;

      if (res.status === 429 && isBootstrapCached(farmerId)) {
        return { ok: true };
      }

      if (res.status === 403 || res.status === 409) {
        return { ok: false, message: 'sign_in_field_bootstrap_failed' };
      }

      return { ok: false, message };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return { ok: false, message: 'Request timeout' };
      }
      if (isBootstrapCached(farmerId)) {
        return { ok: true };
      }
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Network error',
      };
    } finally {
      clearTimeout(timeout);
    }
  })();

  inflightByFarmerId.set(farmerId, run);
  try {
    return await run;
  } finally {
    inflightByFarmerId.delete(farmerId);
  }
}

/** Best-effort server link before plot sync (creates farmer_profile when missing). */
export async function ensureFieldProducerBootstrapped(
  farmerId: string,
  options?: { fullName?: string; force?: boolean },
): Promise<void> {
  const scopedFarmerId = farmerId.trim();
  if (!scopedFarmerId || !hasSyncAuthSession()) {
    return;
  }
  const fullName = options?.fullName?.trim() || undefined;
  await bootstrapFieldAppProducer(
    {
      farmerId: scopedFarmerId,
      fullName,
    },
    { force: options?.force === true },
  ).catch(() => undefined);
}

/** Lightweight lookup of linked farmer profiles (works without parsing bootstrap POST body). */
export async function fetchOwnedFarmerIdsFromApi(): Promise<string[]> {
  if (ownedFarmerIdsSessionDepth > 0 && ownedFarmerIdsSessionCache) {
    return [...ownedFarmerIdsSessionCache];
  }

  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return [];
  }

  const apiBase = getTracebudApiBaseUrl();
  try {
    const res = await fetch(cacheBustUrl(`${apiBase}/v1/me/field-farmer-ids`), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...TRACEBUD_NO_CACHE_HEADERS,
      },
    });
    if (!isSuccessfulApiResponse(res.status)) {
      return [];
    }
    if (res.status === 304) {
      return lastOwnedFarmerIds.length > 0 ? [...lastOwnedFarmerIds] : [];
    }
    const body = (await res.json().catch(() => ({}))) as {
      farmerIds?: unknown;
      farmer_ids?: unknown;
      owned_farmer_ids?: unknown;
    };
    const raw = body.farmerIds ?? body.farmer_ids ?? body.owned_farmer_ids;
    if (!Array.isArray(raw)) {
      return [];
    }
    const ids = raw.map((id) => String(id).trim()).filter(Boolean);
    if (ids.length > 0) {
      lastOwnedFarmerIds = ids;
      if (ownedFarmerIdsSessionDepth > 0) {
        ownedFarmerIdsSessionCache = ids;
      }
    }
    return ids;
  } catch {
    return [];
  }
}
