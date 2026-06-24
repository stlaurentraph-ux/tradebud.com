import { getAccessTokenFromSupabase, getTracebudApiBaseUrl } from '@/features/api/syncAuthSession';
import {
  cacheBustUrl,
  isSuccessfulApiResponse,
  TRACEBUD_NO_CACHE_HEADERS,
} from '@/features/network/apiFetchResponse';
import type {
  FieldEnumerationPackResponse,
  SyncEnumerationProvisionalResult,
} from '@/features/enumeration/fieldEnumerationPackTypes';

export type FetchFieldEnumerationPackResult =
  | { ok: true; pack: FieldEnumerationPackResponse }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string };

export async function fetchFieldEnumerationPack(
  campaignId?: string | null,
): Promise<FetchFieldEnumerationPackResult> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  const apiBase = getTracebudApiBaseUrl();
  const query = campaignId?.trim()
    ? `?campaignId=${encodeURIComponent(campaignId.trim())}`
    : '';
  const url = cacheBustUrl(`${apiBase}/v1/me/field-enumeration-pack${query}`);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...TRACEBUD_NO_CACHE_HEADERS,
      },
    });
    if (!isSuccessfulApiResponse(res.status)) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Enumeration pack fetch failed (${res.status})`;
      return { ok: false, reason: 'server_error', message };
    }
    const pack = (await res.json()) as FieldEnumerationPackResponse;
    return { ok: true, pack };
  } catch (e) {
    return {
      ok: false,
      reason: 'network_error',
      message: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function syncEnumerationProvisionalMember(params: {
  farmerId: string;
  fullName: string;
  village: string;
  phone?: string | null;
  nationalId?: string | null;
  email?: string | null;
  campaignId?: string | null;
}): Promise<
  | { ok: true; result: SyncEnumerationProvisionalResult }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string }
> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  const apiBase = getTracebudApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/v1/me/field-enumeration-provisional-sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!isSuccessfulApiResponse(res.status)) {
      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Provisional sync failed (${res.status})`;
      return { ok: false, reason: 'server_error', message };
    }
    const result = (await res.json()) as SyncEnumerationProvisionalResult;
    return { ok: true, result };
  } catch (e) {
    return {
      ok: false,
      reason: 'network_error',
      message: e instanceof Error ? e.message : 'Network error',
    };
  }
}
