import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
    webClientId: fromConfig.webClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: fromConfig.iosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: fromConfig.androidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: fromConfig.expoClientId ?? process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  };
}

/**
 * Redirect URI for Google native OAuth (iOS/Android installable clients).
 * Do not register this on the Web OAuth client — Google only allows HTTPS there.
 */
export function getGoogleOAuthRedirectUri(clientId: string): string {
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(clientId.trim());
  if (match) {
    return `com.googleusercontent.apps.${match[1]}:/oauth2redirect`;
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
