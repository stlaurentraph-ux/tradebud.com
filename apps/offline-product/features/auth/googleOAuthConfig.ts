import { Platform } from 'react-native';

import { getNativeOAuthCallbackUri } from '@/features/auth/oauthRedirect';

export type GoogleOAuthClientIds = {
  /** Web client ID (required for Supabase id_token validation). */
  webClientId: string;
  /** Platform OAuth client used for the authorization request. */
  clientId: string;
};

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
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) return null;

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim();

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
