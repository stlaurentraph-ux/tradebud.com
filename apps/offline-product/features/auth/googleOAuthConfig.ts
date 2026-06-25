import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  getCachedAndroidGoogleOAuthRedirectHandlerInstalled,
  resolveAndroidGoogleOAuthRedirectHandlerInstalled,
} from '@/features/auth/androidGoogleOAuthCapability';
import { GOOGLE_OAUTH_ENV } from '@/features/auth/googleOAuthEnv';
import { getNativeOAuthCallbackUri } from '@/features/auth/oauthRedirect';

export type GoogleOAuthClientIds = {
  /** Web client ID (required for Supabase id_token validation). */
  webClientId: string;
  /** Platform OAuth client used for the authorization request. */
  clientId: string;
};

type GoogleOAuthExtra = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
};

function readGoogleOAuthExtra(): GoogleOAuthExtra {
  const fromConfig =
    (Constants.expoConfig?.extra as { googleOAuth?: GoogleOAuthExtra } | undefined)?.googleOAuth ??
    {};
  return {
    webClientId:
      fromConfig.webClientId || GOOGLE_OAUTH_ENV.webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId:
      fromConfig.iosClientId || GOOGLE_OAUTH_ENV.iosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId:
      fromConfig.androidClientId ||
      GOOGLE_OAUTH_ENV.androidClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId:
      fromConfig.expoClientId || GOOGLE_OAUTH_ENV.expoClientId || process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  };
}

export function googleReversedSchemeFromClientId(clientId: string | undefined): string | null {
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(String(clientId ?? '').trim());
  return match ? `com.googleusercontent.apps.${match[1]}` : null;
}

/** True when app.config.js declares the Google oauth2redirect intent filter (may not match installed APK). */
export function hasAndroidGoogleOAuthIntentFilterInConfig(): boolean {
  if (Platform.OS !== 'android') return true;
  const androidClientId = getGoogleOAuthClientIds()?.clientId;
  const reversedScheme = googleReversedSchemeFromClientId(androidClientId);
  if (!reversedScheme) return false;
  const intentFilters = Constants.expoConfig?.android?.intentFilters;
  if (!Array.isArray(intentFilters)) return false;
  return intentFilters.some((filter) => {
    if (!filter || typeof filter !== 'object') return false;
    const data = (filter as { data?: unknown }).data;
    if (!Array.isArray(data)) return false;
    return data.some(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        (entry as { scheme?: string }).scheme === reversedScheme,
    );
  });
}

/** @deprecated Prefer resolveAndroidGoogleOAuthRedirectHandlerInstalled for runtime APK checks. */
export const hasAndroidGoogleOAuthIntentFilter = hasAndroidGoogleOAuthIntentFilterInConfig;

/**
 * Redirect URI for Google native OAuth (iOS/Android installable clients).
 * Do not register this on the Web OAuth client — Google only allows HTTPS there.
 */
export function getGoogleOAuthRedirectUri(clientId: string): string {
  const reversed = googleReversedSchemeFromClientId(clientId);
  if (reversed) {
    return `${reversed}:/oauth2redirect`;
  }
  return getNativeOAuthCallbackUri();
}

/** True when native Google sign-in can run without the Supabase browser OAuth page. */
export function getGoogleOAuthClientIds(): GoogleOAuthClientIds | null {
  const extra = readGoogleOAuthExtra();
  const webClientId = extra.webClientId?.trim();
  if (!webClientId) return null;

  const iosClientId = extra.iosClientId?.trim();
  const androidClientId = extra.androidClientId?.trim();
  const expoClientId = extra.expoClientId?.trim();

  if (Platform.OS === 'ios') {
    if (!iosClientId) return null;
    return { webClientId, clientId: iosClientId };
  }
  if (Platform.OS === 'android') {
    if (!androidClientId) return null;
    return { webClientId, clientId: androidClientId };
  }
  if (expoClientId) {
    return { webClientId, clientId: expoClientId };
  }
  return { webClientId, clientId: webClientId };
}

export function isGoogleNativeSignInConfigured(): boolean {
  return getGoogleOAuthClientIds() != null;
}

/**
 * Native Google (account picker) only works on physical iOS/Android devices with
 * the reversed Google URI scheme baked into the installed APK.
 */
export async function resolveShouldUseGoogleNativeSignIn(): Promise<boolean> {
  if (!isGoogleNativeSignInConfigured()) return false;
  if (Platform.OS === 'ios' && Constants.isDevice === false) return false;
  if (Platform.OS === 'android' && Constants.isDevice === false) return false;
  if (Platform.OS === 'android' && !hasAndroidGoogleOAuthIntentFilterInConfig()) return false;
  if (Platform.OS === 'android') {
    return await resolveAndroidGoogleOAuthRedirectHandlerInstalled();
  }
  return true;
}

/** Sync check — prefer {@link resolveShouldUseGoogleNativeSignIn} before starting OAuth. */
export function shouldUseGoogleNativeSignIn(): boolean {
  if (!isGoogleNativeSignInConfigured()) return false;
  if (Platform.OS === 'ios' && Constants.isDevice === false) return false;
  if (Platform.OS === 'android' && Constants.isDevice === false) return false;
  if (Platform.OS === 'android' && !hasAndroidGoogleOAuthIntentFilterInConfig()) return false;
  if (Platform.OS === 'android') {
    const runtimeInstalled = getCachedAndroidGoogleOAuthRedirectHandlerInstalled();
    if (runtimeInstalled === false) return false;
    if (runtimeInstalled === null) return false;
  }
  return true;
}
