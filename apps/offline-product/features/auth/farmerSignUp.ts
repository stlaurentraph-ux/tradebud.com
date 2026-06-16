import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import type { Plot } from '@/features/state/AppStateContext';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { getFieldAppEmailConfirmUrl } from '@/features/auth/fieldAppAuthUrls';
import { resolveFarmerDisplayName } from '@/features/auth/farmerProfileBootstrap';
import { mapSignUpError } from '@/features/auth/mapAuthError';
import { mapOAuthErrorToCode } from '@/features/auth/oauthSession';
import { signInWithOAuthProvider, type OAuthProvider } from '@/features/auth/oauthSignIn';
import { clearPersistedSyncAuth, signInAndSyncPlots, type SignInSyncResult } from '@/features/auth/signInSync';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export async function signUpWithEmailAndSyncPlots(params: {
  fullName: string;
  email: string;
  password: string;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  const email = params.email.trim().toLowerCase();
  const password = params.password;
  const fullName = resolveFarmerDisplayName({ fullName: params.fullName, email });

  if (!fullName) {
    return { ok: false, message: 'farmer_signup_name_required' };
  }
  if (!email || !password) {
    return { ok: false, message: 'enter_email_password' };
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getFieldAppEmailConfirmUrl(),
      data: {
        full_name: fullName,
        role: 'farmer',
        signup_source: 'field-app',
      },
    },
  });

  if (error) {
    return { ok: false, message: mapSignUpError(error) };
  }

  if (!data.session) {
    trackEvent(ANALYTICS_EVENTS.EMAIL_CONFIRM_SIGNUP_SENT, {
      redirect: getFieldAppEmailConfirmUrl(),
    });
    return { ok: false, message: 'farmer_signup_confirm_email' };
  }

  trackEvent(ANALYTICS_EVENTS.EMAIL_CONFIRM_SIGNUP_SESSION, { immediate: true });

  return signInAndSyncPlots({
    email,
    password,
    farmerId: params.farmerId,
    localPlots: params.localPlots,
  });
}

export async function signUpWithOAuthAndSyncPlots(params: {
  provider: OAuthProvider;
  fullName: string;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  try {
    const session = await signInWithOAuthProvider(params.provider);
    return completeOAuthFarmerSession({
      session,
      fullName: params.fullName,
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
  } catch (e) {
    await clearPersistedSyncAuth();
    return { ok: false, message: mapOAuthErrorToCode(e) };
  }
}
