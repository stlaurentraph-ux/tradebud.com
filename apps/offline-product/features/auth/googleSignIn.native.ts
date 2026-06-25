import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  AuthRequest,
  ResponseType,
  exchangeCodeAsync,
} from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';
import { OAuthFlowError } from '@/features/auth/oauthFlowError';
import { getGoogleOAuthClientIds, getGoogleOAuthRedirectUri } from '@/features/auth/googleOAuthConfig';
import { dismissOAuthBrowserIfOpen } from '@/features/auth/dismissOAuthBrowser';
import { trackOAuthStep } from '@/features/auth/oauthTelemetry';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export async function signInWithGoogleNative(): Promise<Session> {
  const ids = getGoogleOAuthClientIds();
  if (!ids) {
    throw new OAuthFlowError('sign_in_oauth_provider_disabled', {
      step: 'native_prompt',
      path: 'native',
    });
  }

  const redirectUri = getGoogleOAuthRedirectUri(ids.clientId);
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

  trackOAuthStep('native_prompt', { provider: 'google', path: 'native' });
  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new OAuthFlowError('sign_in_oauth_cancelled', { step: 'native_prompt', path: 'native' });
    }
    throw new OAuthFlowError('sign_in_oauth_failed', {
      step: 'native_code',
      path: 'native',
    });
  }

  trackOAuthStep('native_code', { provider: 'google', path: 'native' });

  let tokenResult;
  try {
    tokenResult = await exchangeCodeAsync(
      {
        clientId: ids.clientId,
        code: result.params.code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier ?? '',
        },
      },
      GOOGLE_DISCOVERY,
    );
  } catch {
    throw new OAuthFlowError('sign_in_oauth_failed', {
      step: 'native_token_exchange',
      path: 'native',
    });
  }

  trackOAuthStep('native_token_exchange', { provider: 'google', path: 'native' });

  const idToken = tokenResult.idToken;
  const accessToken = tokenResult.accessToken;
  if (!idToken) {
    throw new OAuthFlowError('sign_in_oauth_failed', {
      step: 'native_token_exchange',
      path: 'native',
    });
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    ...(accessToken ? { access_token: accessToken } : {}),
    nonce: rawNonce,
  });

  if (error) {
    throw new OAuthFlowError(error.message || 'sign_in_oauth_failed', {
      step: 'supabase_id_token',
      path: 'native',
    });
  }
  if (!data.session) {
    throw new OAuthFlowError('sign_in_oauth_failed', {
      step: 'supabase_id_token',
      path: 'native',
    });
  }

  trackOAuthStep('supabase_id_token', { provider: 'google', path: 'native' });
  await dismissOAuthBrowserIfOpen();
  return data.session;
}
