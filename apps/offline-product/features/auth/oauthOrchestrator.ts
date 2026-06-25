import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import { signInWithAppleNative } from '@/features/auth/appleSignIn.native';
import { OAuthFlowError } from '@/features/auth/oauthFlowError';
import {
  shouldUseGoogleNativeSignIn,
} from '@/features/auth/googleOAuthConfig';
import { signInWithGoogleNative } from '@/features/auth/googleSignIn.native';
import {
  beginOAuthCallbackWait,
  cancelOAuthCallbackWait,
  deliverOAuthDeepLink,
  endOAuthCallbackWait,
} from '@/features/auth/oauthCallbackWaiter';
import {
  clearOAuthCallbackDedupState,
  isOAuthCallbackUrl,
  sessionFromOAuthCallbackUrl,
} from '@/features/auth/oauthCallbackUrl';
import { dismissOAuthBrowserIfOpen } from '@/features/auth/dismissOAuthBrowser';
import { getOAuthBrowserSessionOptions } from '@/features/auth/oauthBrowserSessionOptions';
import { getOAuthRedirectMatchPrefix, getOAuthRedirectUri } from '@/features/auth/oauthRedirect';
import { trackOAuthBrowserFallback, trackOAuthStep } from '@/features/auth/oauthTelemetry';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import {
  resolveOAuthColdStartPhase,
  shouldAllowGoogleNativeBrowserFallback,
} from '@/features/auth/oauthOrchestratorPolicy';
import type { SignInSyncResult } from '@/features/auth/signInSync';
import type { Plot } from '@/features/state/AppStateContext';
import {
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

export type OAuthDeepLinkCompleteParams = {
  url: string;
  farmerId?: string;
  localPlots?: Plot[];
};

export type OAuthDeepLinkCompleteResult =
  | { status: 'already_signed_in' }
  | { status: 'completed'; result: SignInSyncResult }
  | { status: 'failed'; message: string }
  | { status: 'noop' };

export type OAuthColdStartResult =
  | { status: 'delivered_to_waiter' }
  | { status: 'exit_to_home'; reason: string }
  | { status: 'already_signed_in' }
  | { status: 'completed'; result: SignInSyncResult }
  | { status: 'failed'; message: string };

/** Poll for a callback URL after iOS dismisses the auth session (deep link may arrive late). */
export async function resolveOAuthCallbackAfterDismiss(
  callbackWait: Promise<string>,
  maxMs = 20_000,
): Promise<string | null> {
  const delayedInitial = (async () => {
    for (const delayMs of [250, 500, 1000, 2000, 4000]) {
      await new Promise((r) => setTimeout(r, delayMs));
      const initial = await Linking.getInitialURL();
      if (initial && isOAuthCallbackUrl(initial)) return initial;
    }
    return null;
  })();

  const timedOut = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), maxMs);
  });

  const raced = await Promise.race([callbackWait, delayedInitial, timedOut]);
  return raced;
}

export function clearOAuthOrchestratorState(): void {
  cancelOAuthCallbackWait();
  clearOAuthCallbackDedupState();
}

async function openOAuthBrowser(
  authUrl: string,
  redirectTo: string,
  provider: OAuthProvider,
): Promise<string> {
  let linkingSubscription: { remove: () => void } | null = null;

  const stopLinkingWait = () => {
    linkingSubscription?.remove();
    linkingSubscription = null;
  };

  trackOAuthStep('browser_start', { provider, path: 'browser' });
  const callbackWait = beginOAuthCallbackWait();
  linkingSubscription = Linking.addEventListener('url', (event) => {
    if (deliverOAuthDeepLink(event.url)) {
      void dismissOAuthBrowserIfOpen();
    }
  });

  try {
    const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
      ...getOAuthBrowserSessionOptions(),
    });

    if (browserResult.type === 'success' && browserResult.url) {
      stopLinkingWait();
      endOAuthCallbackWait();
      await dismissOAuthBrowserIfOpen();
      trackOAuthStep('browser_callback', { provider, path: 'browser' });
      return browserResult.url;
    }

    if (browserResult.type === 'dismiss' || browserResult.type === 'cancel') {
      const linkedUrl = await resolveOAuthCallbackAfterDismiss(callbackWait);
      stopLinkingWait();
      endOAuthCallbackWait();
      if (linkedUrl) {
        trackOAuthStep('browser_callback', { provider, path: 'browser' });
        await dismissOAuthBrowserIfOpen();
        return linkedUrl;
      }
      throw new OAuthFlowError('sign_in_oauth_cancelled', { step: 'browser_callback', path: 'browser' });
    }

    stopLinkingWait();
    cancelOAuthCallbackWait();
    throw new OAuthFlowError('sign_in_oauth_failed', { step: 'browser_callback', path: 'browser' });
  } catch (error) {
    stopLinkingWait();
    cancelOAuthCallbackWait();
    if (error instanceof OAuthFlowError) {
      throw error;
    }
    throw new OAuthFlowError('sign_in_oauth_failed', { step: 'browser_callback', path: 'browser' });
  }
}

async function signInWithOAuthBrowser(provider: OAuthProvider): Promise<Session> {
  const supabase = getSupabaseAuthClient();
  const redirectTo = getOAuthRedirectUri();
  const redirectMatchPrefix = getOAuthRedirectMatchPrefix();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? { access_type: 'offline' } : undefined,
    },
  });

  if (error) {
    throw new OAuthFlowError(error.message || 'sign_in_oauth_failed', {
      step: 'browser_start',
      path: 'browser',
    });
  }
  if (!data?.url) {
    throw new OAuthFlowError('sign_in_oauth_failed', { step: 'browser_start', path: 'browser' });
  }

  const callbackUrl = await openOAuthBrowser(data.url, redirectMatchPrefix, provider);
  try {
    const session = await sessionFromOAuthCallbackUrl(callbackUrl);
    trackOAuthStep('supabase_id_token', { provider, path: 'browser' });
    return session;
  } catch (callbackError) {
    throw callbackError instanceof OAuthFlowError
      ? callbackError
      : new OAuthFlowError(
          callbackError instanceof Error ? callbackError.message : 'sign_in_oauth_failed',
          { step: 'browser_callback', path: 'browser' },
        );
  }
}

/** Primary entry — native or browser OAuth, returns a Supabase session. */
export async function runOAuthSignIn(provider: OAuthProvider): Promise<Session> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    return signInWithAppleNative();
  }

  if (provider === 'google' && Platform.OS !== 'web') {
    if (shouldUseGoogleNativeSignIn()) {
      try {
        return await signInWithGoogleNative();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'sign_in_oauth_cancelled') {
          throw error;
        }
        const allowBrowserFallback = shouldAllowGoogleNativeBrowserFallback({
          platform: Platform.OS as 'ios' | 'android' | 'web',
          isDev: __DEV__,
          isSimulatorInDev: __DEV__ && Constants.isDevice === false,
        });
        if (allowBrowserFallback) {
          trackOAuthBrowserFallback(provider, error);
          trackOAuthStep('browser_fallback', { provider, path: 'native' });
          console.warn('[oauth] Native Google sign-in failed; falling back to browser OAuth:', message);
          return signInWithOAuthBrowser(provider);
        }
        throw error;
      }
    }
    if (__DEV__) {
      console.log('[oauth] Using browser Google sign-in (simulator or native not available)');
    }
  }

  return signInWithOAuthBrowser(provider);
}

/** Complete OAuth when a deep link arrives outside an active browser waiter (warm app). */
export async function completeOAuthFromDeepLink(
  params: OAuthDeepLinkCompleteParams,
): Promise<OAuthDeepLinkCompleteResult> {
  try {
    await hydrateSyncAuthFromSettings();
    if (hasSyncAuthSession()) {
      return { status: 'already_signed_in' };
    }

    const session = await sessionFromOAuthCallbackUrl(params.url);
    const result = await completeOAuthFarmerSession({
      session,
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
    if (!result.ok) {
      return { status: 'failed', message: result.message };
    }
    if (!hasSyncAuthSession()) {
      return { status: 'failed', message: 'sign_in_oauth_failed' };
    }
    return { status: 'completed', result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : error ? String(error) : 'sign_in_oauth_failed';
    return { status: 'failed', message };
  }
}

/** Cold-start handler for /auth/callback route. */
export async function runOAuthColdStartCallback(
  params: OAuthDeepLinkCompleteParams & { url: string | null },
): Promise<OAuthColdStartResult> {
  if (params.url && deliverOAuthDeepLink(params.url)) {
    return { status: 'delivered_to_waiter' };
  }

  await hydrateSyncAuthFromSettings();
  const phase = resolveOAuthColdStartPhase({
    url: params.url,
    deliveredToWaiter: false,
    hasSession: hasSyncAuthSession(),
  });
  if (phase === 'delivered_to_waiter') return { status: 'delivered_to_waiter' };
  if (phase === 'already_signed_in') return { status: 'already_signed_in' };
  if (phase === 'exit_to_home') {
    return { status: 'exit_to_home', reason: 'missing_initial_url' };
  }

  try {
    const session = await sessionFromOAuthCallbackUrl(params.url!);
    const result = await completeOAuthFarmerSession({
      session,
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
    if (!result.ok) {
      return { status: 'failed', message: result.message };
    }
    return { status: 'completed', result };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { status: 'failed', message };
  }
}

export { isOAuthCallbackUrl, sessionFromOAuthCallbackUrl };

export {
  beginOAuthCallbackWait,
  cancelOAuthCallbackWait,
  deliverOAuthCallbackUrl,
  deliverOAuthDeepLink,
  endOAuthCallbackWait,
} from '@/features/auth/oauthCallbackWaiter';
