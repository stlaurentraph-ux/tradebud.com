import { normalizeWgs84Point, isValidWgs84LatLng } from '@/features/geo/coordinates';
import { getAccessTokenFromSupabase } from './syncAuthSession';
import { getTracebudApiBaseUrl as getRuntimeGuardedApiBaseUrl } from './runtimeGuards';
import { ensureFieldProducerBootstrapped } from './fieldAppBootstrap';

export {
  clearPersistedSyncAuth,
  getAuthCredentials,
  hydrateSyncAuthFromSettings,
  saveAndApplySyncAuth,
  setAuthCredentials,
  testBackendLogin,
} from './syncAuthSession';

export type GeoJSONPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
};

export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][]; // [[[lon, lat], ...]]
};

/** Minimal plot shape for building GeoJSON to POST /v1/plots (avoids importing app state). */
export type LocalPlotForUpload = {
  kind: 'point' | 'polygon';
  points: { latitude: number; longitude: number }[];
};

/** EUDR / Tracebud — polygon required at or above this declared area. */
export const POLYGON_REQUIRED_MIN_AREA_HA = 4;

/** Build GeoJSON from a locally saved plot (same rules as Record / walk flow). */
export function buildGeometryFromLocalPlot(
  plot: LocalPlotForUpload,
  options?: { declaredAreaHectares?: number | null },
): GeoJSONPoint | GeoJSONPolygon {
  if (!plot.points.length) {
    throw new Error('Plot has no GPS points to upload.');
  }
  if (plot.kind === 'point') {
    if (
      options?.declaredAreaHectares != null &&
      Number.isFinite(options.declaredAreaHectares) &&
      options.declaredAreaHectares >= POLYGON_REQUIRED_MIN_AREA_HA
    ) {
      throw new Error(
        'Plots of 4 hectares or more must use a walked or drawn polygon boundary, not a point centroid.',
      );
    }
    const last = normalizeWgs84Point(plot.points[plot.points.length - 1]);
    if (!isValidWgs84LatLng(last.latitude, last.longitude)) {
      throw new Error('Plot has invalid GPS coordinates.');
    }
    return {
      type: 'Point',
      coordinates: [last.longitude, last.latitude],
    };
  }
  const pts = plot.points.map(normalizeWgs84Point);
  for (const p of pts) {
    if (!isValidWgs84LatLng(p.latitude, p.longitude)) {
      throw new Error('Plot has invalid GPS coordinates.');
    }
  }
  return {
    type: 'Polygon',
    coordinates: [
      [
        ...pts.map((p) => [p.longitude, p.latitude] as [number, number]),
        [pts[0].longitude, pts[0].latitude],
      ],
    ],
  };
}

export type PostPlotToBackendResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'no_access_token' | 'network_error' | 'server_error';
      message?: string;
    };

const API_BASE_URL = getRuntimeGuardedApiBaseUrl();

/** Resolved API root (includes `/api`). Use in Settings to show which server the app calls. */
export function getTracebudApiBaseUrl(): string {
  return API_BASE_URL;
}

/** NestJS often returns `{ message: string | string[] }` on 4xx/5xx. */
function messageFromBackendJson(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { message?: unknown; code?: unknown };
  const raw = record.message;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'message' in (raw as object)) {
    const nested = (raw as { message?: unknown }).message;
    if (typeof nested === 'string') return nested;
  }
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

  await ensureFieldProducerBootstrapped(params.farmerId);

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
      const message =
        messageFromBackendJson(body) ?? `Plot upload failed (${res.status})`;
      return { ok: false, reason: 'server_error', message };
    }
    return { ok: true };
  } catch (e) {
    const base = getTracebudApiBaseUrl();
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
    throw new Error(body.message ?? `Photo sync error: ${res.status}`);
  }

  return res.json();
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

  const res = await fetch(
    `${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}`,
    {
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
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Plot edit error: ${res.status}`);
  }

  return res.json();
}

export async function fetchPlotsForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for plot sync');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/plots?farmerId=${encodeURIComponent(farmerId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Plot fetch error: ${res.status}`);
  }

  return res.json();
}

export async function postHarvestToBackend(params: {
  farmerId: string;
  plotId: string;
  kg: number;
  harvestDate?: string;
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for harvest sync');
  }

  const res = await fetch(`${API_BASE_URL}/v1/harvest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      farmerId: params.farmerId,
      plotId: params.plotId,
      kg: params.kg,
      harvestDate: params.harvestDate ?? null,
      note: params.note ?? null,
      hlcTimestamp: params.hlcTimestamp ?? null,
      clientEventId: params.clientEventId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Harvest error: ${res.status}`);
  }

  return res.json();
}

export async function fetchVouchersForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for vouchers');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/harvest/vouchers?farmerId=${encodeURIComponent(farmerId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Voucher fetch error: ${res.status}`);
  }

  return res.json();
}

export async function fetchVoucherByQrRef(qrRef: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for voucher lookup');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/harvest/vouchers/by-qr?qrRef=${encodeURIComponent(qrRef)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Voucher lookup error: ${res.status}`);
  }

  return res.json();
}

export async function fetchDdsPackagesForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/harvest/packages?farmerId=${encodeURIComponent(farmerId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `DDS package fetch error: ${res.status}`);
  }

  return res.json();
}

export async function fetchDdsPackageTracesJson(packageId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/harvest/packages/${encodeURIComponent(
      packageId,
    )}/traces-json`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `DDS TRACES JSON error: ${res.status}`);
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
    throw new Error(body.message ?? `GFW check error: ${res.status}`);
  }

  return res.json();
}

export async function createDdsPackageForFarmer(params: {
  farmerId: string;
  voucherIds: string[];
  label?: string;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(`${API_BASE_URL}/v1/harvest/packages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voucherIds: params.voucherIds,
      label: params.label ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `DDS package error: ${res.status}`);
  }

  return res.json();
}

export async function submitDdsPackage(packageId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/harvest/packages/${encodeURIComponent(packageId)}/submit`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Submit DDS package error: ${res.status}`);
  }

  return res.json();
}

export async function fetchAuditForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for audit log');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/audit?farmerId=${encodeURIComponent(farmerId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Audit fetch error: ${res.status}`);
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

  const res = await fetch(
    `${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}/legal-sync`,
    {
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
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Legality sync error: ${res.status}`);
  }

  return res.json();
}

export type PlotTenureParseStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'MANUAL_REQUIRED';

export type PlotTenureVerificationRecord = {
  id: string;
  plot_id: string;
  storage_path: string;
  mime_type: string | null;
  evidence_label: string | null;
  parse_status: PlotTenureParseStatus;
  parse_result: Record<string, unknown> | null;
  parse_confidence: number | null;
  parse_reviewed_by: string | null;
  parse_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchPlotTenureVerification(
  plotId: string,
): Promise<PlotTenureVerificationRecord[]> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return [];
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/plots/${encodeURIComponent(plotId)}/tenure-verification`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) {
    return [];
  }
  const body = await res.json().catch(() => []);
  return Array.isArray(body) ? body : [];
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

  const res = await fetch(
    `${API_BASE_URL}/v1/plots/${encodeURIComponent(params.plotId)}/evidence-sync`,
    {
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
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Evidence sync error: ${res.status}`);
  }

  return res.json();
}

export type PostAuditEventResult =
  | { ok: true; id?: string; timestamp?: string }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string };

/** Append a row to the server audit_log (e.g. declaration bundle snapshot). */
export async function postAuditEventToBackend(params: {
  eventType: string;
  payload: Record<string, unknown>;
  deviceId?: string | null;
}): Promise<PostAuditEventResult> {
  let accessToken: string | null;
  try {
    accessToken = await getAccessTokenFromSupabase();
  } catch {
    accessToken = null;
  }
  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/audit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: params.eventType,
        payload: params.payload,
        deviceId: params.deviceId ?? undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        reason: 'server_error',
        message: messageFromBackendJson(body) ?? `Audit POST failed (${res.status})`,
      };
    }

    const row = (await res.json().catch(() => ({}))) as { id?: string; timestamp?: string };
    return { ok: true, id: row.id, timestamp: row.timestamp };
  } catch (e) {
    return {
      ok: false,
      reason: 'network_error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export type AssessmentRequestStatus =
  | 'sent'
  | 'opened'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'needs_changes'
  | 'cancelled';

export type FarmerAssessmentRequest = {
  id: string;
  pathway: 'annuals' | 'rice';
  farmer_user_id: string;
  questionnaire_id?: string | null;
  status: AssessmentRequestStatus;
  title: string;
  instructions: string;
  due_at: string | null;
  updated_at: string;
};

export async function fetchAssignedAssessmentRequests(): Promise<FarmerAssessmentRequest[]> {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for assessment requests');
  }

  const res = await fetch(`${API_BASE_URL}/v1/integrations/assessments/requests?assignedToMe=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Assessment request fetch error: ${res.status}`);
  }
  const body = (await res.json()) as { items?: FarmerAssessmentRequest[] };
  return body.items ?? [];
}

export async function updateAssessmentRequestStatus(params: {
  requestId: string;
  status: AssessmentRequestStatus;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for assessment requests');
  }

  const res = await fetch(
    `${API_BASE_URL}/v1/integrations/assessments/requests/${encodeURIComponent(params.requestId)}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: params.status }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Assessment request status update error: ${res.status}`);
  }
  return res.json();
}



