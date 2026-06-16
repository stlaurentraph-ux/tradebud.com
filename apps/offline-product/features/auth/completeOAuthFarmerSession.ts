import type { Session } from '@supabase/supabase-js';

import { bootstrapFieldAppProducer } from '@/features/api/fieldAppBootstrap';
import {
  clearPersistedSyncAuth,
  saveAndApplyOAuthSyncAuth,
  testBackendLogin,
} from '@/features/api/syncAuthSession';
import { ensureFarmerOAuthProfile, getEmailFromSession, getNameFromSession } from '@/features/auth/oauthSession';
import type { SignInSyncResult } from '@/features/auth/signInSync';
import type { Plot } from '@/features/state/AppStateContext';
import { registerFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';
import { runAutoBackup } from '@/features/sync/runAutoBackup';

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
    params.fullName || getNameFromSession(params.session) || '';

  await saveAndApplyOAuthSyncAuth(
    email,
    refreshToken,
    params.session.access_token,
    params.session.expires_at,
  );
  await ensureFarmerOAuthProfile(nameFromSession, params.session);

  if (params.farmerId) {
    const bootstrap = await bootstrapFieldAppProducer({
      farmerId: params.farmerId,
      fullName: nameFromSession || undefined,
    });
    if (!bootstrap.ok) {
      await clearPersistedSyncAuth();
      return { ok: false, message: bootstrap.message };
    }
  }

  const res = await testBackendLogin();
  if (!res.ok) {
    await clearPersistedSyncAuth();
    return { ok: false, message: 'sign_in_oauth_failed' };
  }

  void registerFarmerPushToken();

  if (params.farmerId && params.localPlots) {
    await runAutoBackup({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
  }

  return { ok: true, missingName: !nameFromSession };
}
