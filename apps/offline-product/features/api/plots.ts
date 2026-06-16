/**
 * Plot management API module - handles plot creation, updates, compliance checks.
 * Extracted from postPlot.ts for better separation of concerns.
 */

import { getAccessTokenFromSupabase } from './auth';
import { logError } from '@/features/errors/ErrorLogger';
import { getTracebudApiBaseUrl } from './runtimeGuards';
import type { GeoJSONPoint, GeoJSONPolygon } from './postPlot';

export {
  buildGeometryFromLocalPlot,
  POLYGON_REQUIRED_MIN_AREA_HA,
  type GeoJSONPoint,
  type GeoJSONPolygon,
  type LocalPlotForUpload,
} from './postPlot';

export type PostPlotToBackendResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'no_access_token' | 'network_error' | 'server_error';
      message?: string;
    };

const API_BASE_URL = getTracebudApiBaseUrl();

/** Extract error message from NestJS-style response */
function messageFromBackendJson(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const raw = (body as { message?: unknown }).message;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return raw.join(' ');
  }
  return undefined;
}

export async function postPlotToBackend(params: {
  farmerId: string;
  clientPlotId: string;
  geometry: GeoJSONPoint | GeoJSONPolygon;
  declaredAreaHa: number | null;
  precisionMeters: number | null;
  cadastralKey?: string | null;
}): Promise<PostPlotToBackendResult> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/plots`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farmerId: params.farmerId,
        clientPlotId: params.clientPlotId,
        geometry: params.geometry,
        declaredAreaHa: params.declaredAreaHa,
        precisionMeters: params.precisionMeters,
        cadastralKey: params.cadastralKey ?? null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = messageFromBackendJson(body) ?? `Plot upload failed (${res.status})`;
      logError(new Error(message), { context: 'postPlot', statusCode: res.status });
      return { ok: false, reason: 'server_error', message };
    }

    return { ok: true };
  } catch (e) {
    logError(e as Error, { context: 'postPlot', phase: 'network' });
    const base = API_BASE_URL;
    const hint =
      base.includes('localhost') || base.includes('127.0.0.1')
        ? ' If you use a real device, replace localhost with your computer IP in EXPO_PUBLIC_API_URL.'
        : '';
    return {
      ok: false,
      reason: 'network_error',
      message: `${e instanceof Error ? e.message : 'Network error'} (${base}).${hint}`,
    };
  }
}

export async function updatePlotMetadataOnBackend(params: {
  plotId: string;
  name?: string;
  reason: string;
  deviceId?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for plot edits');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: params.name,
      reason: params.reason,
      deviceId: params.deviceId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(messageFromBackendJson(body) ?? `Plot edit error: ${res.status}`), {
      context: 'updatePlotMetadata',
      statusCode: res.status,
    });
    throw new Error(body.message ?? `Plot edit error: ${res.status}`);
  }

  return res.json();
}

export async function fetchPlotsForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for plot sync');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots?farmerId=${encodeURIComponent(farmerId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(messageFromBackendJson(body) ?? `Plot fetch error: ${res.status}`), {
      context: 'fetchPlotsForFarmer',
      statusCode: res.status,
      farmerId,
    });
    throw new Error(body.message ?? `Plot fetch error: ${res.status}`);
  }

  return res.json();
}

export async function runComplianceCheckForPlot(plotId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for compliance checks');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots/${encodeURIComponent(plotId)}/compliance-check`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(messageFromBackendJson(body) ?? `Compliance check error: ${res.status}`), {
      context: 'complianceCheck',
      statusCode: res.status,
      plotId,
    });
    throw new Error(body.message ?? `Compliance check error: ${res.status}`);
  }

  return res.json();
}

export async function runGfwCheckForPlot(plotId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for GFW checks');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots/${encodeURIComponent(plotId)}/gfw-check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(messageFromBackendJson(body) ?? `GFW check error: ${res.status}`), {
      context: 'gfwCheck',
      statusCode: res.status,
      plotId,
    });
    throw new Error(body.message ?? `GFW check error: ${res.status}`);
  }

  return res.json();
}

export async function syncPlotPhotosToBackend(params: {
  plotId: string;
  kind: 'ground_truth' | 'land_title';
  photos: any[];
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for photo sync');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}/photos-sync`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: params.kind,
        photos: params.photos,
        note: params.note ?? null,
        hlcTimestamp: params.hlcTimestamp ?? null,
        clientEventId: params.clientEventId ?? null,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message ?? `Photo sync error: ${res.status}`;
    logError(new Error(message), {
      context: 'syncPhotos',
      statusCode: res.status,
      plotId: params.plotId,
      photoKind: params.kind,
    });
    throw new Error(message);
  }

  return res.json();
}

export async function syncPlotLegalToBackend(params: {
  plotId: string;
  cadastralKey: string | null;
  informalTenure: boolean | null;
  informalTenureNote: string | null;
  reason: string;
  deviceId?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for legality sync');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}/legal-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cadastralKey: params.cadastralKey,
      informalTenure: params.informalTenure,
      informalTenureNote: params.informalTenureNote,
      reason: params.reason,
      deviceId: params.deviceId ?? null,
      hlcTimestamp: params.hlcTimestamp ?? null,
      clientEventId: params.clientEventId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `Legality sync error: ${res.status}`), {
      context: 'syncLegal',
      statusCode: res.status,
      plotId: params.plotId,
    });
    throw new Error(body.message ?? `Legality sync error: ${res.status}`);
  }

  return res.json();
}

export async function syncPlotEvidenceToBackend(params: {
  plotId: string;
  kind: 'fpic_repository' | 'protected_area_permit' | 'labor_evidence' | 'tenure_evidence';
  items: any[];
  reason: string;
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for evidence sync');
  }

  const res = await fetch(`${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}/evidence-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: params.kind,
      items: params.items,
      reason: params.reason,
      note: params.note ?? null,
      hlcTimestamp: params.hlcTimestamp ?? null,
      clientEventId: params.clientEventId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `Evidence sync error: ${res.status}`), {
      context: 'syncEvidence',
      statusCode: res.status,
      plotId: params.plotId,
      evidenceKind: params.kind,
    });
    throw new Error(body.message ?? `Evidence sync error: ${res.status}`);
  }

  return res.json();
}
