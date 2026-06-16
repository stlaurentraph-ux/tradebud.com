import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';

import { getFieldAuthCallbackBaseUrl } from '@/features/auth/fieldAppAuthUrls';

/** Deep link the native app handles after OAuth (Expo Go / dev client fallback). */
export function getNativeOAuthCallbackUri(): string {
  const scheme = Constants.expoConfig?.scheme ?? 'tracebudoffline';
  const schemeStr = typeof scheme === 'string' ? scheme : 'tracebudoffline';
  if (Constants.appOwnership !== 'expo') {
    return makeRedirectUri({ scheme: schemeStr, path: 'auth/callback' });
  }
  return makeRedirectUri({ path: 'auth/callback' });
}

/**
 * Redirect URL sent to Supabase OAuth.
 * - Expo Go: HTTPS bridge on app.tracebud.com with encoded exp:// target.
 * - Store / preview builds: https://app.tracebud.com/auth/callback (universal links).
 * - Dev override: EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 → tracebudoffline:// only.
 */
export function getOAuthRedirectUri(): string {
  const nativeCallback = getNativeOAuthCallbackUri();
  const fieldAuthCallback = getFieldAuthCallbackBaseUrl();

  if (Constants.appOwnership === 'expo') {
    const bridge = `${fieldAuthCallback}?app_redirect=${encodeURIComponent(nativeCallback)}`;
    if (__DEV__) {
      console.log('[oauth] Expo Go bridge redirect:', bridge);
      console.log('[oauth] Native deep link target:', nativeCallback);
    }
    return bridge;
  }

  if (process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME === '1') {
    if (__DEV__) {
      console.log('[oauth] Custom scheme redirect:', nativeCallback);
    }
    return nativeCallback;
  }

  if (__DEV__) {
    console.log('[oauth] Universal link redirect:', fieldAuthCallback);
  }
  return fieldAuthCallback;
}

/** Prefix match for WebBrowser.openAuthSessionAsync success detection. */
export function getOAuthRedirectMatchPrefix(): string {
  if (
    Constants.appOwnership !== 'expo' &&
    process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME === '1'
  ) {
    return getNativeOAuthCallbackUri().split('?')[0];
  }
  return getFieldAuthCallbackBaseUrl();
}
