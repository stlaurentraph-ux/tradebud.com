export type ProducerConsentGrant = {
  id: string;
  farmer_id: string;
  grantee_tenant_id: string;
  grantee_org_name: string | null;
  purpose_code: string;
  data_scope: string[];
  status: 'pending' | 'active' | 'revoked' | 'denied';
  granted_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
  sold_lineage_retention_years?: number;
  sold_lineage_retention_until?: string | null;
};

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function resolveProducerFarmerId(email: string): Promise<string | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;
  try {
    const body = await requestJson<{ farmer_id?: string }>(
      `/api/farmers/resolve?email=${encodeURIComponent(trimmed)}`,
    );
    return body.farmer_id ?? null;
  } catch {
    return null;
  }
}

export async function listProducerConsentGrants(farmerProfileId: string): Promise<ProducerConsentGrant[]> {
  const body = await requestJson<{ items?: ProducerConsentGrant[] }>(
    `/api/farmers/${encodeURIComponent(farmerProfileId)}/consent-grants`,
  );
  return Array.isArray(body.items) ? body.items : [];
}

export async function requestProducerDataAccess(params: {
  farmerProfileId: string;
  granteeOrgName?: string | null;
}): Promise<ProducerConsentGrant> {
  const body = await requestJson<{
    consent_grant_id: string;
    status: ProducerConsentGrant['status'];
    farmer_id: string;
    grantee_tenant_id: string;
  }>(`/api/farmers/${encodeURIComponent(params.farmerProfileId)}/consent-requests`, {
    method: 'POST',
    body: JSON.stringify({
      grantee_org_name: params.granteeOrgName ?? null,
      purpose_code: 'COMPLIANCE_COLLECTION',
    }),
  });
  return {
    id: body.consent_grant_id,
    farmer_id: body.farmer_id,
    grantee_tenant_id: body.grantee_tenant_id,
    grantee_org_name: params.granteeOrgName ?? null,
    purpose_code: 'COMPLIANCE_COLLECTION',
    data_scope: ['identity', 'plots', 'evidence'],
    status: body.status,
    granted_at: null,
    revoked_at: null,
    revocation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
