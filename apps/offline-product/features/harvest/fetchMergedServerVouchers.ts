import { fetchVouchersForFarmer } from '@/features/api/postPlot';
import {
  getAccessTokenFromSupabaseWithTimeout,
  getTracebudApiBaseUrl,
} from '@/features/api/syncAuthSession';
import { TRACEBUD_NO_CACHE_HEADERS, cacheBustUrl, isSuccessfulApiResponse } from '@/features/network/apiFetchResponse';
import { getSyncQueueLockSnapshot } from '@/features/sync/syncQueueMutex';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { supplementVoucherHarvestDatesFromSupabase } from '@/features/harvest/supplementVoucherHarvestDates';
import { voucherId } from '@/features/harvest/voucherRowFields';

function uniqueIds(candidates: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of candidates) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export class FieldVouchersMineUnsupportedError extends Error {
  constructor() {
    super('FIELD_VOUCHERS_MINE_UNSUPPORTED');
    this.name = 'FieldVouchersMineUnsupportedError';
  }
}

/** Preferred field-app API: all vouchers for every farmer profile owned by the signed-in user. */
export async function fetchFieldAppHarvestVouchers(): Promise<unknown[]> {
  const accessToken = await getAccessTokenFromSupabaseWithTimeout();
  if (!accessToken) {
    throw new Error('No access token available for vouchers');
  }

  const res = await fetch(
    cacheBustUrl(`${getTracebudApiBaseUrl()}/v1/harvest/vouchers/mine`),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...TRACEBUD_NO_CACHE_HEADERS,
      },
    },
  );

  if (res.status === 404) {
    throw new FieldVouchersMineUnsupportedError();
  }

  if (!isSuccessfulApiResponse(res.status)) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.message === 'string'
        ? body.message
        : `Voucher fetch error: ${res.status}`,
    );
  }

  return normalizeVoucherRows(await res.json().catch(() => ({})));
}

async function fetchMergedServerVouchersLegacy(farmerIds: readonly string[]): Promise<unknown[]> {
  const ids = uniqueIds(farmerIds);
  if (ids.length === 0) return [];

  const results = await Promise.allSettled(ids.map((farmerId) => fetchVouchersForFarmer(farmerId)));
  const seen = new Set<string>();
  const merged: unknown[] = [];
  let lastError: unknown = null;

  for (const result of results) {
    if (result.status === 'rejected') {
      lastError = result.reason;
      continue;
    }
    for (const row of normalizeVoucherRows(result.value)) {
      const id = String((row as { id?: unknown })?.id ?? '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(row);
    }
  }

  if (merged.length === 0 && lastError != null) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  return merged;
}

function mergeVoucherRows(into: Map<string, unknown>, payload: unknown): void {
  for (const row of normalizeVoucherRows(payload)) {
    const id = voucherId(row);
    if (!id || into.has(id)) continue;
    into.set(id, row);
  }
}

const VOUCHERS_FETCH_CACHE_MS = 45_000;
let vouchersFetchCache: { at: number; rows: unknown[] } | null = null;

/** Test hook. */
export function resetMergedServerVouchersCacheForTests(): void {
  vouchersFetchCache = null;
}

/** Merges voucher rows from /vouchers/mine and every linked farmer profile. */
export async function fetchMergedServerVouchers(farmerIds: readonly string[]): Promise<unknown[]> {
  if (getSyncQueueLockSnapshot().locked) {
    if (vouchersFetchCache) {
      return [...vouchersFetchCache.rows];
    }
    return [];
  }

  const now = Date.now();
  if (vouchersFetchCache && now - vouchersFetchCache.at < VOUCHERS_FETCH_CACHE_MS) {
    return [...vouchersFetchCache.rows];
  }

  const merged = new Map<string, unknown>();
  let mineUnsupported = false;
  let mineError: unknown = null;

  try {
    mergeVoucherRows(merged, await fetchFieldAppHarvestVouchers());
  } catch (error) {
    if (error instanceof FieldVouchersMineUnsupportedError) {
      mineUnsupported = true;
    } else {
      mineError = error;
    }
  }

  try {
    mergeVoucherRows(merged, await fetchMergedServerVouchersLegacy(farmerIds));
  } catch (legacyError) {
    if (merged.size === 0) {
      throw mineError ?? legacyError;
    }
  }

  if (merged.size === 0 && mineUnsupported) {
    vouchersFetchCache = { at: now, rows: [] };
    return [];
  }

  const rows = await supplementVoucherHarvestDatesFromSupabase([...merged.values()]);
  vouchersFetchCache = { at: now, rows };
  return rows;
}
