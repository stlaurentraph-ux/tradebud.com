/**
 * Harvest management API module - handles harvest recording and delivery tracking.
 * Extracted from postPlot.ts for better separation of concerns.
 */

import { getAccessTokenFromSupabase } from './auth';
import { validateHarvestKg } from '@/features/validation/validators';
import { logError } from '@/features/errors/ErrorLogger';
import { getTracebudApiBaseUrl } from './runtimeGuards';

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

export async function postHarvestToBackend(params: {
  farmerId: string;
  plotId: string;
  kg: number;
  harvestDate?: string;
  note?: string;
  hlcTimestamp?: string;
  clientEventId?: string;
}) {
  // Validate harvest weight
  const kgValidation = validateHarvestKg(params.kg);
  if (!kgValidation.ok) {
    const error = new Error(`Invalid harvest weight: ${kgValidation.error}`);
    logError(error, { context: 'postHarvest', farmerId: params.farmerId, plotId: params.plotId });
    throw error;
  }

  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for harvest sync');
  }

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      farmerId: params.farmerId,
      plotId: params.plotId,
      kg: kgValidation.value,
      harvestDate: params.harvestDate ?? null,
      note: params.note ?? null,
      hlcTimestamp: params.hlcTimestamp ?? null,
      clientEventId: params.clientEventId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message ?? `Harvest error: ${res.status}`;
    logError(new Error(message), {
      context: 'postHarvest',
      statusCode: res.status,
      farmerId: params.farmerId,
      plotId: params.plotId,
      kg: kgValidation.value,
    });
    throw new Error(message);
  }

  return res.json();
}

export async function fetchVouchersForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for vouchers');
  }

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest/vouchers?farmerId=${encodeURIComponent(farmerId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `Voucher fetch error: ${res.status}`), {
      context: 'fetchVouchers',
      statusCode: res.status,
      farmerId,
    });
    throw new Error(body.message ?? `Voucher fetch error: ${res.status}`);
  }

  return res.json();
}

export async function fetchVoucherByQrRef(qrRef: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for voucher lookup');
  }

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest/vouchers/by-qr?qrRef=${encodeURIComponent(qrRef)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `Voucher lookup error: ${res.status}`), {
      context: 'fetchVoucherByQr',
      statusCode: res.status,
      qrRef,
    });
    throw new Error(body.message ?? `Voucher lookup error: ${res.status}`);
  }

  return res.json();
}

export async function fetchDdsPackagesForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest/packages?farmerId=${encodeURIComponent(farmerId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `DDS package fetch error: ${res.status}`), {
      context: 'fetchDdsPackages',
      statusCode: res.status,
      farmerId,
    });
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
    `${getTracebudApiBaseUrl()}/v1/harvest/packages/${encodeURIComponent(packageId)}/traces-json`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `DDS TRACES JSON error: ${res.status}`), {
      context: 'fetchDdsTracesJson',
      statusCode: res.status,
      packageId,
    });
    throw new Error(body.message ?? `DDS TRACES JSON error: ${res.status}`);
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

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest/packages`, {
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
    logError(new Error(body.message ?? `DDS package error: ${res.status}`), {
      context: 'createDdsPackage',
      statusCode: res.status,
      farmerId: params.farmerId,
      voucherCount: params.voucherIds.length,
    });
    throw new Error(body.message ?? `DDS package error: ${res.status}`);
  }

  return res.json();
}

export async function submitDdsPackage(packageId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for DDS packages');
  }

  const res = await fetch(`${getTracebudApiBaseUrl()}/v1/harvest/packages/${encodeURIComponent(packageId)}/submit`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logError(new Error(body.message ?? `Submit DDS package error: ${res.status}`), {
      context: 'submitDdsPackage',
      statusCode: res.status,
      packageId,
    });
    throw new Error(body.message ?? `Submit DDS package error: ${res.status}`);
  }

  return res.json();
}
