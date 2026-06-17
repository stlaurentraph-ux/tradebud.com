import { getAccessTokenFromSupabase, getTracebudApiBaseUrl, hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { safeAuthenticatedFetch } from '@/features/errors/safeFetch';

const BOOTSTRAP_TIMEOUT_MS = 12_000;

export async function bootstrapFieldAppProducer(
  params: {
    farmerId: string;
    fullName?: string;
    countryCode?: string;
  },
  options?: { timeoutMs?: number },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) {
    return { ok: false, message: 'sign_in_oauth_failed' };
  }

  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, message: 'Sign in to sync your plots to Tracebud.' };
  }

  const apiBase = getTracebudApiBaseUrl();
  const res = await safeAuthenticatedFetch(`${apiBase}/v1/me/field-app-bootstrap`, accessToken, {
    method: 'POST',
    timeout: options?.timeoutMs ?? BOOTSTRAP_TIMEOUT_MS,
    body: JSON.stringify({
      farmerId,
      fullName: params.fullName?.trim() || undefined,
      countryCode: params.countryCode?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    if (res.statusCode === 403 || res.statusCode === 409) {
      return { ok: false, message: 'sign_in_field_bootstrap_failed' };
    }
    if (res.message === 'Request timeout' || res.message === 'Network error') {
      return { ok: false, message: res.message };
    }
    return {
      ok: false,
      message: res.message || `Field app bootstrap failed (${res.statusCode ?? 'unknown'})`,
    };
  }

  return { ok: true };
}

/** Best-effort server link before plot sync (creates farmer_profile when missing). */
export async function ensureFieldProducerBootstrapped(farmerId: string): Promise<void> {
  const scopedFarmerId = farmerId.trim();
  if (!scopedFarmerId || !hasSyncAuthSession()) {
    return;
  }
  await bootstrapFieldAppProducer({ farmerId: scopedFarmerId }).catch(() => undefined);
}
