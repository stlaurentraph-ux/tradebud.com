import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  AuthRequest,
  ResponseType,
  exchangeCodeAsync,
} from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import { getGoogleOAuthClientIds, getGoogleOAuthRedirectUri } from '@/features/auth/googleOAuthConfig';
import { promptGoogleAuthCodeOnAndroid } from '@/features/auth/googleSignInAndroid';
import { isGoogleNativeOAuthRedirectUrl } from '@/features/auth/oauthCallbackUrlPolicy';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export async function signInWithGoogleNative(): Promise<Session> {
  const ids = getGoogleOAuthClientIds();
  if (!ids) {
    throw new Error('sign_in_oauth_provider_disabled');
  }

  const redirectUri = getGoogleOAuthRedirectUri(ids.clientId);
  if (__DEV__) {
    console.log('[oauth] Native Google redirectUri:', redirectUri);
  }
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const request = new AuthRequest({
    clientId: ids.clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: { nonce: hashedNonce },
  });

  const authUrl = await request.makeAuthUrlAsync(GOOGLE_DISCOVERY);
  if (!authUrl) {
    throw new Error('sign_in_oauth_failed');
  }

  let authCode: string;

  if (Platform.OS === 'android') {
    authCode = await promptGoogleAuthCodeOnAndroid(authUrl, redirectUri);
  } else {
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      if (isGoogleNativeOAuthRedirectUrl(event.url)) {
        WebBrowser.maybeCompleteAuthSession();
      }
    });

    let result;
    try {
      result = await request.promptAsync(GOOGLE_DISCOVERY, { url: authUrl });
    } finally {
      linkingSubscription.remove();
    }

    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('sign_in_oauth_cancelled');
      }
      throw new Error('sign_in_oauth_failed');
    }
    authCode = result.params.code;
  }

  const tokenResult = await exchangeCodeAsync(
    {
      clientId: ids.clientId,
      code: authCode,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    GOOGLE_DISCOVERY,
  );

  const idToken = tokenResult.idToken;
  const accessToken = tokenResult.accessToken;
  if (!idToken) {
    throw new Error('sign_in_oauth_failed');
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    ...(accessToken ? { access_token: accessToken } : {}),
    nonce: rawNonce,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error('No session returned from OAuth.');
  }

  return data.session;
}
