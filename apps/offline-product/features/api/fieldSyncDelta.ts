import { getAccessTokenFromSupabase } from './auth';
import { getTracebudApiBaseUrl } from './runtimeGuards';

export type FieldSyncDeltaResponse = {
  serverTime: string;
  since?: string | null;
  farmers: Array<{
    farmerId: string;
    plots: Array<{ id: string; updatedAt: string }>;
    voucherIds: string[];
    latestAuditAt: string | null;
  }>;
};

export async function fetchFieldSyncDelta(sinceMs?: number): Promise<FieldSyncDeltaResponse> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for field sync delta');
  }
  const query =
    sinceMs != null && Number.isFinite(sinceMs) && sinceMs > 0
      ? `?since=${encodeURIComponent(String(Math.floor(sinceMs)))}`
      : '';
  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/me/field-sync-delta${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.message === 'string' ? body.message : `Field sync delta failed (${res.status})`,
    );
  }
  return res.json() as Promise<FieldSyncDeltaResponse>;
}
