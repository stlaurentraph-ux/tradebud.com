import type { Session } from '@supabase/supabase-js';

import { bootstrapFieldAppProducer } from '@/features/api/fieldAppBootstrap';
import {
  readPendingCampaignBootstrapContext,
} from '@/features/campaign/campaignInviteContext';
import { saveAndApplyPhoneOtpSession, testBackendLogin } from '@/features/api/syncAuthSession';
import type { Plot } from '@/features/state/AppStateContext';
import { registerFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';
import { runAutoBackup } from '@/features/sync/runAutoBackup';
import type { SignInSyncResult } from '@/features/auth/signInSync';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

const CONNECT_TIMEOUT_MS = 5_000;

function getPhoneFromSession(session: Session): string | null {
  const phone = session.user.phone?.trim();
  if (phone) {
    return phone;
  }
  const metaPhone = session.user.user_metadata?.phone;
  return typeof metaPhone === 'string' && metaPhone.trim() ? metaPhone.trim() : null;
}

async function runPostPhoneOtpConnectTasks(params: {
  session: Session;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<void> {
  if (!params.farmerId) {
    return;
  }
  const { campaignId, claimToken } = await readPendingCampaignBootstrapContext();
  const bootstrap = await bootstrapFieldAppProducer(
    {
      farmerId: params.farmerId,
      campaignId: campaignId ?? undefined,
      claimToken: claimToken ?? undefined,
    },
    { timeoutMs: CONNECT_TIMEOUT_MS },
  );
  if (bootstrap.ok && claimToken) {
    // Analytics emitted from bootstrapFieldAppProducer when claimToken is present.
  }
  if (!bootstrap.ok && bootstrap.message === 'sign_in_field_bootstrap_failed') {
    return;
  }

  const res = await testBackendLogin({ timeoutMs: CONNECT_TIMEOUT_MS });
  if (!res.ok) {
    return;
  }

  void registerFarmerPushToken();

  if (params.localPlots) {
    await Promise.race([
      runAutoBackup({
        farmerId: params.farmerId,
        localPlots: params.localPlots,
      }),
      new Promise<void>((resolve) => {
        setTimeout(resolve, CONNECT_TIMEOUT_MS);
      }),
    ]);
  }
}

export async function completePhoneOtpFarmerSession(params: {
  session: Session;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  const phone = getPhoneFromSession(params.session);
  const refreshToken = params.session.refresh_token ?? '';

  if (!phone || !refreshToken) {
    return { ok: false, message: 'phone_otp_verify_failed' };
  }

  trackEvent(ANALYTICS_EVENTS.FARMER_AUTH_PHONE_OTP_SUCCESS, { phoneLast4: phone.slice(-4) });

  await saveAndApplyPhoneOtpSession(
    phone,
    refreshToken,
    params.session.access_token,
    params.session.expires_at,
  );

  void runPostPhoneOtpConnectTasks({
    session: params.session,
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });

  return { ok: true };
}

export async function signInWithPhoneOtpAndSyncPlots(params: {
  phone: string;
  code: string;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  const { verifyFarmerPhoneOtp } = await import('@/features/auth/phoneOtpSignIn');
  const verified = await verifyFarmerPhoneOtp(params.phone, params.code);
  if (!verified.ok) {
    trackEvent(ANALYTICS_EVENTS.FARMER_AUTH_PHONE_OTP_FAILURE, {
      reason: verified.message,
    });
    return { ok: false, message: verified.message };
  }
  return completePhoneOtpFarmerSession({
    session: verified.session,
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });
}
