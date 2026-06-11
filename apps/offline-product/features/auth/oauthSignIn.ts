import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

/** Register in Supabase → Authentication → URL configuration → Redirect URLs */
export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'tracebudoffline',
    path: 'auth/callback',
  });
}

async function sessionFromCallbackUrl(url: string): Promise<Session> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    const description =
      typeof params.error_description === 'string' ? params.error_description : errorCode;
    throw new Error(description);
  }

  const supabase = getSupabaseAuthClient();
  const code = typeof params.code === 'string' ? params.code : undefined;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned from OAuth.');
    return data.session;
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned from OAuth.');
    return data.session;
  }

  throw new Error('OAuth sign-in did not return a session.');
}

async function signInWithOAuthBrowser(provider: OAuthProvider): Promise<Session> {
  const supabase = getSupabaseAuthClient();
  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams:
        provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.url) {
    throw new Error('Could not start OAuth sign-in.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('sign_in_oauth_cancelled');
  }

  return sessionFromCallbackUrl(result.url);
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<Session> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    try {
      const { signInWithAppleNative } = await import('@/features/auth/appleSignIn.native');
      return await signInWithAppleNative();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message === 'sign_in_oauth_cancelled') {
        throw e;
      }
      // Older builds without the native module fall back to browser OAuth.
      return signInWithOAuthBrowser('apple');
    }
  }

  return signInWithOAuthBrowser(provider);
}
