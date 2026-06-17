import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';

import { getFieldAuthCallbackBaseUrl } from '@/features/auth/fieldAppAuthUrls';

const IS_DEV_RUNTIME = typeof __DEV__ !== 'undefined' && __DEV__;

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
 * Local debug builds (`expo run:ios`) lack production associated domains — use the app scheme.
 * Preview builds set EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 explicitly.
 */
export function useCustomSchemeOAuthRedirect(): boolean {
  if (Constants.appOwnership === 'expo') return false;
  if (process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME === '1') return true;
  return IS_DEV_RUNTIME;
}

/**
 * Redirect URL sent to Supabase OAuth.
 * - Expo Go: HTTPS bridge on app.tracebud.com with encoded exp:// target.
 * - Local debug / preview: tracebudoffline://auth/callback (custom scheme).
 * - Store production: https://app.tracebud.com/auth/callback (universal links).
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

  if (useCustomSchemeOAuthRedirect()) {
    if (IS_DEV_RUNTIME) {
      console.log('[oauth] Custom scheme redirect:', nativeCallback);
    }
    return nativeCallback;
  }

  if (IS_DEV_RUNTIME) {
    console.log('[oauth] Universal link redirect:', fieldAuthCallback);
  }
  return fieldAuthCallback;
}

/** Prefix match for WebBrowser.openAuthSessionAsync success detection. */
export function getOAuthRedirectMatchPrefix(): string {
  if (Constants.appOwnership !== 'expo' && useCustomSchemeOAuthRedirect()) {
    return getNativeOAuthCallbackUri().split('?')[0];
  }
  return getFieldAuthCallbackBaseUrl();
}
