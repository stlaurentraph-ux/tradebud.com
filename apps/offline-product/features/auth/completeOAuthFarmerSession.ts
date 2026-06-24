import type { Session } from '@supabase/supabase-js';

import { bootstrapFieldAppProducer } from '@/features/api/fieldAppBootstrap';
import {
  saveAndApplyOAuthSyncAuth,
  testBackendLogin,
} from '@/features/api/syncAuthSession';
import { isExistingAuthUserAtSignup } from '@/features/auth/oauthExistingAccount';
import { deriveDisplayNameFromEmail } from '@/features/auth/farmerProfileBootstrap';
import { ensureFarmerOAuthProfile, getFieldAppEmailFromSession, getNameFromSession } from '@/features/auth/oauthSession';
import { fieldAppBlocksDashboardOAuthSignIn } from '@/features/auth/fieldAppEligibility';
import { trackOAuthStep } from '@/features/auth/oauthTelemetry';
import type { SignInSyncResult } from '@/features/auth/signInSync';
import type { Plot } from '@/features/state/AppStateContext';
import { registerFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';
import { runAutoBackup } from '@/features/sync/runAutoBackup';

const OAUTH_CONNECT_TIMEOUT_MS = 5_000;

function isApiUnreachableMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('localhost') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('request timeout') ||
    msg.includes('request took too long') ||
    msg.includes('tracebud api returned')
  );
}

async function runPostOAuthConnectTasks(params: {
  fullName: string;
  session: Session;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<void> {
  try {
    void ensureFarmerOAuthProfile(params.fullName, params.session).catch(() => undefined);

    if (params.farmerId) {
      const bootstrap = await bootstrapFieldAppProducer(
        {
          farmerId: params.farmerId,
          fullName: params.fullName || undefined,
        },
        { timeoutMs: OAUTH_CONNECT_TIMEOUT_MS },
      );
      if (!bootstrap.ok && bootstrap.message === 'sign_in_field_bootstrap_failed') {
        // Keep the OAuth session; server link can be retried on sync.
        return;
      }
    }

    const res = await testBackendLogin({ timeoutMs: OAUTH_CONNECT_TIMEOUT_MS });
    if (!res.ok && !isApiUnreachableMessage(res.message)) {
      return;
    }

    void registerFarmerPushToken();

    if (params.farmerId && params.localPlots) {
      await Promise.race([
        runAutoBackup({
          farmerId: params.farmerId,
          localPlots: params.localPlots,
        }),
        new Promise<void>((resolve) => {
          setTimeout(resolve, OAUTH_CONNECT_TIMEOUT_MS);
        }),
      ]);
    }
  } catch {
    // Post-connect work is best-effort and must never undo a successful OAuth sign-in.
  }
}

export async function completeOAuthFarmerSession(params: {
  session: Session;
  fullName?: string;
  farmerId?: string;
  localPlots?: Plot[];
  /** Set when completing OAuth from the create-account wizard. */
  signupFlowStartedAtMs?: number;
}): Promise<SignInSyncResult> {
  if (fieldAppBlocksDashboardOAuthSignIn(params.session)) {
    return { ok: false, message: 'sign_in_dashboard_account' };
  }

  const email = getFieldAppEmailFromSession(params.session);
  const refreshToken = params.session.refresh_token ?? '';

  if (!refreshToken) {
    return { ok: false, message: 'sign_in_oauth_failed' };
  }
  if (!email) {
    return { ok: false, message: 'sign_in_oauth_needs_signup' };
  }

  const nameFromSession =
    params.fullName ||
    getNameFromSession(params.session) ||
    deriveDisplayNameFromEmail(email) ||
    '';

  await saveAndApplyOAuthSyncAuth(
    email,
    refreshToken,
    params.session.access_token,
    params.session.expires_at,
  );

  trackOAuthStep('session_persist', {
    provider: params.session.user.identities?.some((row) => row.provider === 'apple')
      ? 'apple'
      : 'google',
    path: 'native',
  });

  void runPostOAuthConnectTasks({
    fullName: nameFromSession,
    session: params.session,
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });

  const existingAccount =
    params.signupFlowStartedAtMs != null &&
    isExistingAuthUserAtSignup(params.session, params.signupFlowStartedAtMs);

  return { ok: true, missingName: !nameFromSession, existingAccount };
}
