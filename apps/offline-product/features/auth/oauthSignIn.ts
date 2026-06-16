import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import { getOAuthRedirectMatchPrefix, getOAuthRedirectUri } from '@/features/auth/oauthRedirect';
import { isOAuthCallbackUrl, sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

async function openOAuthBrowser(authUrl: string, redirectTo: string): Promise<string> {
  let linkingSubscription: { remove: () => void } | null = null;
  let linkingTimer: ReturnType<typeof setTimeout> | null = null;

  const stopLinkingWait = () => {
    linkingSubscription?.remove();
    linkingSubscription = null;
    if (linkingTimer) clearTimeout(linkingTimer);
    linkingTimer = null;
  };

  const linkingWait = new Promise<string>((resolve, reject) => {
    linkingSubscription = Linking.addEventListener('url', (event) => {
      if (!isOAuthCallbackUrl(event.url)) return;
      stopLinkingWait();
      resolve(event.url);
    });
    linkingTimer = setTimeout(() => {
      stopLinkingWait();
      reject(new Error('sign_in_oauth_timeout'));
    }, 120_000);
  });

  try {
    const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
      showInRecents: true,
    });

    if (browserResult.type === 'success' && browserResult.url) {
      stopLinkingWait();
      return browserResult.url;
    }

    if (browserResult.type === 'dismiss' || browserResult.type === 'cancel') {
      const linkedUrl = await Promise.race([
        linkingWait,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
      ]);
      stopLinkingWait();
      if (linkedUrl) return linkedUrl;
      throw new Error('sign_in_oauth_cancelled');
    }

    stopLinkingWait();
    throw new Error('sign_in_oauth_failed');
  } catch (error) {
    stopLinkingWait();
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
      queryParams:
        provider === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined,
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
  if (provider === 'apple' && Platform.OS === 'ios') {
    const { signInWithAppleNative } = await import('@/features/auth/appleSignIn.native');
    return signInWithAppleNative();
  }

  return signInWithOAuthBrowser(provider);
}
