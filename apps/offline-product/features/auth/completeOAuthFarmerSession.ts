import {
  clearPersistedSyncAuth,
  saveAndApplyOAuthSyncAuth,
  testBackendLogin,
} from '@/features/api/syncAuthSession';
import type { Plot } from '@/features/state/AppStateContext';
import type { UploadUnsyncedPlotsResult } from '@/features/sync/plotServerSync';
import { resolveFarmerDisplayName } from '@/features/auth/farmerProfileBootstrap';
import { ensureFarmerOAuthProfile, getEmailFromSession, getNameFromSession } from '@/features/auth/oauthSession';
import type { SignInSyncResult } from '@/features/auth/signInSync';
import { registerFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';
import type { Session } from '@supabase/supabase-js';

export async function completeOAuthFarmerSession(params: {
  session: Session;
  fullName?: string;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  const email = getEmailFromSession(params.session);
  const refreshToken = params.session.refresh_token ?? '';

  if (!refreshToken) {
    return { ok: false, message: 'sign_in_oauth_failed' };
  }
  if (!email) {
    return { ok: false, message: 'sign_in_oauth_needs_signup' };
  }

  const nameFromSession =
    resolveFarmerDisplayName({
      fullName: params.fullName || getNameFromSession(params.session),
      email,
    }) ?? '';

  await saveAndApplyOAuthSyncAuth(
    email,
    refreshToken,
    params.session.access_token,
    params.session.expires_at,
  );
  if (nameFromSession) {
    await ensureFarmerOAuthProfile(nameFromSession);
  } else {
    await ensureFarmerOAuthProfile();
  }

  const res = await testBackendLogin();
  if (!res.ok) {
    await clearPersistedSyncAuth();
    return { ok: false, message: 'sign_in_oauth_failed' };
  }

  void registerFarmerPushToken();

  return { ok: true, sync: null, missingName: !nameFromSession };
}
