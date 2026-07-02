import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { GOOGLE_OAUTH_ENV } from '@/features/auth/googleOAuthEnv';
import { getNativeOAuthCallbackUri } from '@/features/auth/oauthRedirect';

function appDeepLinkScheme(): string {
  const scheme = Constants.expoConfig?.scheme ?? 'tracebudoffline';
  return typeof scheme === 'string' ? scheme : 'tracebudoffline';
}

/** Canonical Android Google OAuth return — do not use makeRedirectUri (injects Metro host in dev). */
export function getAndroidGoogleOAuthRedirectUri(): string {
  return `${appDeepLinkScheme()}://oauth2redirect`;
}

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

/**
 * Redirect URI for Google native OAuth (iOS/Android installable clients).
 * Android returns `tracebudoffline://oauth2redirect` — must match WebBrowser.openAuthSessionAsync.
 * iOS uses the reversed Google client scheme on installable builds.
 */
export function getGoogleOAuthRedirectUri(clientId: string): string {
  if (Platform.OS === 'android') {
    return getAndroidGoogleOAuthRedirectUri();
  }

  const scheme = appDeepLinkScheme();
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(clientId.trim());
  if (match) {
    return makeRedirectUri({
      scheme,
      path: 'oauth2redirect',
      native: `com.googleusercontent.apps.${match[1]}:/oauth2redirect`,
    });
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
 * Native Google (account picker) on iOS installable builds only.
 * Android uses Supabase browser OAuth — Custom Tabs + oauth2redirect is unreliable in dev.
 */
export function shouldUseGoogleNativeSignIn(): boolean {
  if (Platform.OS === 'android') return false;
  if (!isGoogleNativeSignInConfigured()) return false;
  if (Platform.OS === 'ios' && Constants.isDevice === false) return false;
  return true;
}
