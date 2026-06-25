import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import {
  getGoogleOAuthClientIds,
  getGoogleOAuthRedirectUri,
  hasAndroidGoogleOAuthIntentFilterInConfig,
} from '@/features/auth/googleOAuthConfig';
import { recordOAuthDiagnosticEvent } from '@/features/auth/oauthDiagnosticsStore';
import { getSetting, setSetting } from '@/features/state/persistence';

const ANDROID_GOOGLE_NATIVE_OAUTH_DISABLED_KEY = 'android_google_native_oauth_disabled';

let cachedRedirectHandlerInstalled: boolean | null = null;
let probeInFlight: Promise<boolean> | null = null;

/** @internal Vitest only */
export function __resetAndroidGoogleOAuthCapabilityCacheForTests(): void {
  cachedRedirectHandlerInstalled = null;
  probeInFlight = null;
}

export function getCachedAndroidGoogleOAuthRedirectHandlerInstalled(): boolean | null {
  return cachedRedirectHandlerInstalled;
}

export async function isAndroidGoogleNativeOAuthDisabledInSettings(): Promise<boolean> {
  return (await getSetting(ANDROID_GOOGLE_NATIVE_OAUTH_DISABLED_KEY)) === '1';
}

/** Persist after a native dismiss — APK cannot handle com.googleusercontent.apps.*:/oauth2redirect. */
export async function persistAndroidGoogleNativeOAuthDisabled(reason: string): Promise<void> {
  cachedRedirectHandlerInstalled = false;
  await setSetting(ANDROID_GOOGLE_NATIVE_OAUTH_DISABLED_KEY, '1');
  recordOAuthDiagnosticEvent('native_oauth_disabled', reason);
}

/**
 * True when this installed APK (not just app.config.js) can receive Google oauth2redirect.
 * Metro dev clients are often rebuilt without re-running `expo run:android`, so config lies.
 */
export async function resolveAndroidGoogleOAuthRedirectHandlerInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (cachedRedirectHandlerInstalled !== null) {
    return cachedRedirectHandlerInstalled;
  }
  if (!probeInFlight) {
    probeInFlight = probeAndroidGoogleOAuthRedirectHandler().finally(() => {
      probeInFlight = null;
    });
  }
  return probeInFlight;
}

export async function probeAndroidGoogleOAuthRedirectHandler(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    cachedRedirectHandlerInstalled = true;
    return true;
  }

  if (await isAndroidGoogleNativeOAuthDisabledInSettings()) {
    cachedRedirectHandlerInstalled = false;
    recordOAuthDiagnosticEvent(
      'native_redirect_probe',
      'installed=false reason=disabled_in_settings',
    );
    return false;
  }

  if (!hasAndroidGoogleOAuthIntentFilterInConfig()) {
    cachedRedirectHandlerInstalled = false;
    recordOAuthDiagnosticEvent(
      'native_redirect_probe',
      'installed=false reason=missing_in_config',
    );
    return false;
  }

  const ids = getGoogleOAuthClientIds();
  if (!ids) {
    cachedRedirectHandlerInstalled = false;
    recordOAuthDiagnosticEvent('native_redirect_probe', 'installed=false reason=no_client_id');
    return false;
  }

  const redirectUri = getGoogleOAuthRedirectUri(ids.clientId);
  try {
    const installed = await Linking.canOpenURL(redirectUri);
    cachedRedirectHandlerInstalled = installed;
    recordOAuthDiagnosticEvent(
      'native_redirect_probe',
      `installed=${installed} redirect=${redirectUri}`,
    );
    return installed;
  } catch (error) {
    cachedRedirectHandlerInstalled = false;
    const message = error instanceof Error ? error.message : String(error);
    recordOAuthDiagnosticEvent('native_redirect_probe', `installed=false error=${message}`);
    return false;
  }
}
