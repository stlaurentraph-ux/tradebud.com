import { getAccessTokenFromSupabase } from '@/features/api/syncAuthSession';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

export type ConsentGrantStatus = 'pending' | 'active' | 'revoked' | 'denied';

export type ConsentGrant = {
  id: string;
  farmer_id: string;
  grantee_tenant_id: string;
  grantee_org_name: string | null;
  purpose_code: string;
  data_scope: string[];
  status: ConsentGrantStatus;
  consent_mechanism: string | null;
  granted_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE_URL = getTracebudApiBaseUrl();

async function authHeaders(): Promise<HeadersInit | null> {
  const token = await getAccessTokenFromSupabase();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchMyConsentGrants(): Promise<
  { ok: true; items: ConsentGrant[] } | { ok: false; reason: 'no_token' | 'network' | 'server'; message?: string }
> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, reason: 'no_token' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/consent-grants`, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, reason: 'server', message: body || res.statusText };
    }
    const json = (await res.json()) as { items?: ConsentGrant[] };
    return { ok: true, items: Array.isArray(json.items) ? json.items : [] };
  } catch (e) {
    return {
      ok: false,
      reason: 'network',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function approveConsentGrant(
  grantId: string,
): Promise<{ ok: true } | { ok: false; message?: string }> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, message: 'no_token' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/consent-grants/${encodeURIComponent(grantId)}/approve`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, message: body || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function denyConsentGrant(
  grantId: string,
): Promise<{ ok: true } | { ok: false; message?: string }> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, message: 'no_token' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/consent-grants/${encodeURIComponent(grantId)}/deny`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, message: body || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function requestGdprErasure(details: string): Promise<
  | { ok: true; message: string; sold_lineage_retention_years: number }
  | { ok: false; message?: string }
> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, message: 'no_token' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/gdpr-erasure-request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ details }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, message: body || res.statusText };
    }
    const json = (await res.json()) as {
      message?: string;
      sold_lineage_retention_years?: number;
    };
    return {
      ok: true,
      message: json.message ?? 'Request recorded.',
      sold_lineage_retention_years: json.sold_lineage_retention_years ?? 5,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function revokeConsentGrant(
  grantId: string,
  revocationReason: string,
): Promise<{ ok: true } | { ok: false; message?: string }> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, message: 'no_token' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/consent-grants/${encodeURIComponent(grantId)}/revoke`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ revocation_reason: revocationReason }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, message: body || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
