import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  getGoogleOAuthClientIds,
  getGoogleOAuthRedirectUri,
  googleReversedSchemeFromClientId,
  hasAndroidGoogleOAuthIntentFilterInConfig,
  shouldUseGoogleNativeSignIn,
} from '@/features/auth/googleOAuthConfig';
import {
  getCachedAndroidGoogleOAuthRedirectHandlerInstalled,
  resolveAndroidGoogleOAuthRedirectHandlerInstalled,
} from '@/features/auth/androidGoogleOAuthCapability';
import { getOAuthRedirectUri } from '@/features/auth/oauthRedirect';
import { shouldAllowGoogleNativeBrowserFallback } from '@/features/auth/oauthOrchestratorPolicy';
import { recordOAuthDiagnosticEvent } from '@/features/auth/oauthDiagnosticsStore';

export type OAuthRuntimeDiagnosticSnapshot = {
  platform: string;
  isDevice: boolean;
  isDev: boolean;
  appOwnership: string | null;
  executionEnvironment: string;
  nativeApplicationVersion: string | null;
  androidPackage: string | null;
  appScheme: string | null;
  nativeRedirectUri: string | null;
  supabaseRedirectUri: string;
  androidClientIdSuffix: string | null;
  useNativeGoogleSignIn: boolean;
  allowAndroidBrowserFallback: boolean;
  hasGoogleIntentFilterInConfig: boolean;
  hasGoogleIntentFilterInstalled: boolean | null;
  googleIntentScheme: string | null;
  warnings: string[];
  checklist: string[];
};

function maskClientIdSuffix(clientId: string | undefined): string | null {
  const trimmed = clientId?.trim();
  if (!trimmed) return null;
  const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(trimmed);
  if (match) return `…${match[1].slice(-12)}.apps.googleusercontent.com`;
  return `…${trimmed.slice(-8)}`;
}

function googleReversedScheme(clientId: string | undefined): string | null {
  return googleReversedSchemeFromClientId(clientId);
}

export function collectOAuthRuntimeDiagnostics(): OAuthRuntimeDiagnosticSnapshot {
  const ids = getGoogleOAuthClientIds();
  const androidClientId = ids?.clientId;
  const hasGoogleIntentFilterInConfig = hasAndroidGoogleOAuthIntentFilterInConfig();
  const hasGoogleIntentFilterInstalled = getCachedAndroidGoogleOAuthRedirectHandlerInstalled();

  const useNativeGoogleSignIn = shouldUseGoogleNativeSignIn();
  const googleIntentScheme = googleReversedScheme(androidClientId ?? undefined);
  const allowAndroidBrowserFallback = shouldAllowGoogleNativeBrowserFallback({
    platform: Platform.OS as 'ios' | 'android' | 'web',
    isDev: typeof __DEV__ !== 'undefined' && __DEV__,
    isSimulatorInDev: typeof __DEV__ !== 'undefined' && __DEV__ && Constants.isDevice === false,
    androidNativeRedirectInstalled: hasGoogleIntentFilterInstalled ?? undefined,
  });

  const warnings: string[] = [];
  const checklist: string[] = [];

  if (Platform.OS === 'android') {
    if (!androidClientId) {
      warnings.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID missing — native Google sign-in disabled.');
    }
    if (!hasGoogleIntentFilterInConfig) {
      warnings.push(
        'app.config.js lacks the Google oauth2redirect handler — rebuild with npx expo run:android.',
      );
    } else if (hasGoogleIntentFilterInstalled === false) {
      warnings.push(
        'Installed dev client APK lacks the Google oauth2redirect handler — using browser OAuth via tracebudoffline:// until you rebuild (npx expo run:android).',
      );
    }
    if (
      allowAndroidBrowserFallback &&
      Constants.isDevice &&
      hasGoogleIntentFilterInstalled !== false
    ) {
      warnings.push(
        'Physical Android would allow browser OAuth fallback after native failure — this often opens a second Chrome tab and leaves you on google.com.',
      );
    }
    if (useNativeGoogleSignIn) {
      checklist.push(
        'Google Cloud Console → Android OAuth client → Advanced → Enable custom URI scheme.',
      );
      checklist.push('SHA-1 on that client must match your dev signing key (debug keystore for local dev build).');
      checklist.push(`Package name must be com.tracebud.app (redirect: ${googleIntentScheme ?? '?'}:/oauth2redirect).`);
    }
  }

  if (!useNativeGoogleSignIn && Platform.OS !== 'web') {
    if (Platform.OS === 'android' && androidClientId && hasGoogleIntentFilterInstalled === false) {
      warnings.push('Browser OAuth via tracebudoffline:// is active (dev client rebuild recommended for native flow).');
    } else if (Platform.OS === 'android' && hasGoogleIntentFilterInstalled === null) {
      warnings.push('Probing installed APK for Google oauth2redirect handler…');
    } else {
      warnings.push('Native Google sign-in is off — emulator/simulator or missing Android client ID.');
    }
  }

  return {
    platform: Platform.OS,
    isDevice: Constants.isDevice ?? true,
    isDev: typeof __DEV__ !== 'undefined' && __DEV__,
    appOwnership: Constants.appOwnership ?? null,
    executionEnvironment: Constants.executionEnvironment ?? 'unknown',
    nativeApplicationVersion: Constants.nativeApplicationVersion ?? null,
    androidPackage: Constants.expoConfig?.android?.package ?? null,
    appScheme: Constants.expoConfig?.scheme ?? null,
    nativeRedirectUri: androidClientId ? getGoogleOAuthRedirectUri(androidClientId) : null,
    supabaseRedirectUri: getOAuthRedirectUri(),
    androidClientIdSuffix: maskClientIdSuffix(androidClientId),
    useNativeGoogleSignIn,
    allowAndroidBrowserFallback,
    hasGoogleIntentFilterInConfig,
    hasGoogleIntentFilterInstalled,
    googleIntentScheme,
    warnings,
    checklist,
  };
}

export function snapshotOAuthRuntimeDiagnosticsLines(): string[] {
  const snapshot = collectOAuthRuntimeDiagnostics();
  return [
    `platform=${snapshot.platform} isDevice=${snapshot.isDevice} dev=${snapshot.isDev}`,
    `appOwnership=${snapshot.appOwnership ?? 'n/a'} env=${snapshot.executionEnvironment}`,
    `nativeVersion=${snapshot.nativeApplicationVersion ?? 'n/a'} package=${snapshot.androidPackage ?? 'n/a'}`,
    `appScheme=${snapshot.appScheme ?? 'n/a'}`,
    `nativeRedirect=${snapshot.nativeRedirectUri ?? 'n/a'}`,
    `supabaseRedirect=${snapshot.supabaseRedirectUri}`,
    `androidClient=${snapshot.androidClientIdSuffix ?? 'missing'}`,
    `useNativeGoogle=${snapshot.useNativeGoogleSignIn}`,
    `androidBrowserFallback=${snapshot.allowAndroidBrowserFallback}`,
    `googleIntentFilterInConfig=${snapshot.hasGoogleIntentFilterInConfig} installed=${snapshot.hasGoogleIntentFilterInstalled ?? 'probing'} scheme=${snapshot.googleIntentScheme ?? 'n/a'}`,
    ...(snapshot.warnings.length > 0 ? ['warnings:', ...snapshot.warnings.map((w) => `  - ${w}`)] : []),
    ...(snapshot.checklist.length > 0 ? ['checklist:', ...snapshot.checklist.map((c) => `  - ${c}`)] : []),
  ];
}

export function logOAuthRuntimeDiagnostics(context: string): OAuthRuntimeDiagnosticSnapshot {
  const snapshot = collectOAuthRuntimeDiagnostics();
  const lines = snapshotOAuthRuntimeDiagnosticsLines();
  recordOAuthDiagnosticEvent('config_snapshot', `${context} | ${lines.join(' | ')}`);
  if (typeof console !== 'undefined') {
    console.log(`[oauth-diagnostics] ${context}\n${lines.join('\n')}`);
  }
  return snapshot;
}
