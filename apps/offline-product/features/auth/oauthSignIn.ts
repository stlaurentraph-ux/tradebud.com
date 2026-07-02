import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import { signInWithAppleNative } from '@/features/auth/appleSignIn.native';
import {
  beginOAuthCallbackWait,
  cancelOAuthCallbackWait,
  deliverOAuthCallbackUrl,
  endOAuthCallbackWait,
  resolveOAuthCallbackAfterDismiss,
} from '@/features/auth/oauthCallbackBridge';
import {
  shouldUseGoogleNativeSignIn,
} from '@/features/auth/googleOAuthConfig';
import { signInWithGoogleNative } from '@/features/auth/googleSignIn.native';
import { getOAuthRedirectMatchPrefix, getOAuthRedirectUri } from '@/features/auth/oauthRedirect';
import { isOAuthCallbackUrl, sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { withSentrySpan } from '@/features/observability/sentrySpans';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

async function openOAuthBrowser(authUrl: string, redirectTo: string): Promise<string> {
  let linkingSubscription: { remove: () => void } | null = null;

  const stopLinkingWait = () => {
    linkingSubscription?.remove();
    linkingSubscription = null;
  };

  const callbackWait = beginOAuthCallbackWait();
  linkingSubscription = Linking.addEventListener('url', (event) => {
    deliverOAuthCallbackUrl(event.url);
  });

  try {
    const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
      showInRecents: true,
    });

    if (browserResult.type === 'success' && browserResult.url) {
      stopLinkingWait();
      endOAuthCallbackWait();
      return browserResult.url;
    }

    if (browserResult.type === 'dismiss' || browserResult.type === 'cancel') {
      const linkedUrl = await resolveOAuthCallbackAfterDismiss(callbackWait);
      stopLinkingWait();
      endOAuthCallbackWait();
      if (linkedUrl) return linkedUrl;
      throw new Error('sign_in_oauth_cancelled');
    }

    stopLinkingWait();
    cancelOAuthCallbackWait();
    throw new Error('sign_in_oauth_failed');
  } catch (error) {
    stopLinkingWait();
    cancelOAuthCallbackWait();
    throw error;
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
    throw new Error(error.message);
  }
  if (!data?.url) {
    throw new Error('Could not start OAuth sign-in.');
  }

  const callbackUrl = await openOAuthBrowser(data.url, redirectMatchPrefix);
  return sessionFromOAuthCallbackUrl(callbackUrl);
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<Session> {
  return withSentrySpan(
    {
      name: 'auth.oauth.sign_in',
      op: 'auth.oauth',
      attributes: { oauth_provider: provider, oauth_platform: Platform.OS },
    },
    async () => {
      if (provider === 'apple' && Platform.OS === 'ios') {
        return withSentrySpan(
          { name: 'auth.oauth.apple_native', op: 'auth.oauth', attributes: { oauth_provider: 'apple' } },
          () => signInWithAppleNative(),
        );
      }

      if (provider === 'google' && Platform.OS !== 'web') {
        if (shouldUseGoogleNativeSignIn()) {
          try {
            return await withSentrySpan(
              { name: 'auth.oauth.google_native', op: 'auth.oauth', attributes: { oauth_provider: 'google' } },
              () => signInWithGoogleNative(),
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message === 'sign_in_oauth_cancelled') {
              throw error;
            }
            if (__DEV__ && Constants.isDevice === false) {
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

      return withSentrySpan(
        { name: 'auth.oauth.browser', op: 'auth.oauth', attributes: { oauth_provider: provider } },
        () => signInWithOAuthBrowser(provider),
      );
    },
  );
}
