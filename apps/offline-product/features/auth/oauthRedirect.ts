import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

import { getFieldAuthCallbackBaseUrl } from '@/features/auth/fieldAppAuthUrls';

const IS_DEV_RUNTIME = typeof __DEV__ !== 'undefined' && __DEV__;

function appDeepLinkScheme(): string {
  const scheme = Constants.expoConfig?.scheme ?? 'tracebudoffline';
  return typeof scheme === 'string' ? scheme : 'tracebudoffline';
}

/** Android Custom Tabs load Metro on direct tracebudoffline:// returns — use HTTPS bridge instead. */
export function androidUsesOAuthHttpsBridge(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership !== 'expo';
}

/** Deep link the native app handles after OAuth (Expo Go / dev client fallback). */
export function getNativeOAuthCallbackUri(): string {
  const schemeStr = appDeepLinkScheme();
  if (Platform.OS === 'android') {
    return `${schemeStr}://auth/callback`;
  }
  if (Constants.appOwnership !== 'expo') {
    return makeRedirectUri({ scheme: schemeStr, path: 'auth/callback' });
  }
  return makeRedirectUri({ path: 'auth/callback' });
}

function buildOAuthHttpsBridgeRedirect(nativeCallback: string): string {
  const fieldAuthCallback = getFieldAuthCallbackBaseUrl();
  return `${fieldAuthCallback}?app_redirect=${encodeURIComponent(nativeCallback)}`;
}

/**
 * Local debug builds (`expo run:ios`) lack production associated domains — use the app scheme.
 * Preview builds set EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 explicitly.
 * Android dev always uses the HTTPS bridge (Custom Tabs + custom scheme is unreliable).
 */
export function useCustomSchemeOAuthRedirect(): boolean {
  if (androidUsesOAuthHttpsBridge()) return false;
  if (Constants.appOwnership === 'expo') return false;
  if (process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME === '1') return true;
  return IS_DEV_RUNTIME;
}

/**
 * Redirect URL sent to Supabase OAuth.
 * - Expo Go: HTTPS bridge on app.tracebud.com with encoded exp:// target.
 * - Android installable: HTTPS bridge → tracebudoffline://auth/callback (avoids Custom Tab Metro load).
 * - iOS local debug / preview: tracebudoffline://auth/callback (custom scheme).
 * - Store production: https://app.tracebud.com/auth/callback (universal links).
 */
export function getOAuthRedirectUri(): string {
  const nativeCallback = getNativeOAuthCallbackUri();
  const fieldAuthCallback = getFieldAuthCallbackBaseUrl();

  if (Constants.appOwnership === 'expo') {
    const bridge = buildOAuthHttpsBridgeRedirect(nativeCallback);
    if (__DEV__) {
      console.log('[oauth] Expo Go bridge redirect:', bridge);
      console.log('[oauth] Native deep link target:', nativeCallback);
    }
    return bridge;
  }

  if (androidUsesOAuthHttpsBridge()) {
    const bridge = buildOAuthHttpsBridgeRedirect(nativeCallback);
    if (IS_DEV_RUNTIME) {
      console.log('[oauth] Android HTTPS bridge redirect:', bridge);
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

/** Prefixes used to detect OAuth return URLs in the in-flight browser session. */
export function getOAuthRedirectMatchPrefixes(): string[] {
  const nativeCallback = getNativeOAuthCallbackUri().split('?')[0];
  if (Constants.appOwnership === 'expo' || androidUsesOAuthHttpsBridge()) {
    return [getFieldAuthCallbackBaseUrl(), nativeCallback];
  }
  if (useCustomSchemeOAuthRedirect()) {
    return [nativeCallback];
  }
  return [getFieldAuthCallbackBaseUrl()];
}

/** Prefix match for WebBrowser.openAuthSessionAsync success detection. */
export function getOAuthRedirectMatchPrefix(): string {
  return getOAuthRedirectMatchPrefixes()[0];
}
