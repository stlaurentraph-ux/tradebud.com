import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type GeoJSONPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
};

type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][]; // [[[lon, lat], ...]]
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4001/api';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_EMAIL = process.env.EXPO_PUBLIC_TRACEBUD_TEST_EMAIL ?? '';
const DEFAULT_PASSWORD = process.env.EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD ?? '';

let supabaseClient: SupabaseClient | null = null;
let cachedAccessToken: string | null = null;
let cachedExpiresAt: number | null = null;
let currentEmail = DEFAULT_EMAIL;
let currentPassword = DEFAULT_PASSWORD;

function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or ANON key not configured');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

async function getAccessTokenFromSupabase(): Promise<string | null> {
  if (!currentEmail || !currentPassword) {
    return null;
  }

  const now = Date.now() / 1000;
  if (cachedAccessToken && cachedExpiresAt && cachedExpiresAt - now > 60) {
    return cachedAccessToken;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });

  if (error || !data.session) {
    return null;
  }

  cachedAccessToken = data.session.access_token;
  cachedExpiresAt = data.session.expires_at ?? null;

  return cachedAccessToken;
}

export function setAuthCredentials(email: string, password: string) {
  currentEmail = email.trim();
  currentPassword = password;
  cachedAccessToken = null;
  cachedExpiresAt = null;
}

export function getAuthCredentials() {
  return { email: currentEmail, password: currentPassword };
}

export async function postPlotToBackend(params: {
  farmerId: string;
  clientPlotId: string;
  geometry: GeoJSONPoint | GeoJSONPolygon;
  declaredAreaHa: number | null;
  precisionMeters: number | null;
}) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return;
  }

  await fetch(`${API_BASE_URL}/v1/plots`, {
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
    }),
  }).catch(() => {
    // best-effort sync; ignore network errors for now
  });
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






