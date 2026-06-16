import { getAccessTokenFromSupabase, getTracebudApiBaseUrl, hasSyncAuthSession } from '@/features/api/syncAuthSession';

export async function bootstrapFieldAppProducer(params: {
  farmerId: string;
  fullName?: string;
  countryCode?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) {
    return { ok: false, message: 'sign_in_oauth_failed' };
  }

  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, message: 'Sign in to sync your plots to Tracebud.' };
  }

  const apiBase = getTracebudApiBaseUrl();
  const res = await fetch(`${apiBase}/v1/me/field-app-bootstrap`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      farmerId,
      fullName: params.fullName?.trim() || undefined,
      countryCode: params.countryCode?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403 || res.status === 409) {
      return { ok: false, message: 'sign_in_field_bootstrap_failed' };
    }
    return {
      ok: false,
      message: body || `Field app bootstrap failed (${res.status})`,
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
