import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    isDevice: true,
    appOwnership: null,
    executionEnvironment: 'bare',
    nativeApplicationVersion: '1.0.0',
    expoConfig: {
      scheme: 'tracebudoffline',
      android: {
        package: 'com.tracebud.app',
        intentFilters: [
          {
            data: [{ scheme: 'com.googleusercontent.apps.testclient' }],
          },
        ],
      },
    },
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('@/features/auth/googleOAuthConfig', () => ({
  getGoogleOAuthClientIds: () => ({
    webClientId: 'web.apps.googleusercontent.com',
    clientId: 'testclient.apps.googleusercontent.com',
  }),
  getGoogleOAuthRedirectUri: () => 'com.googleusercontent.apps.testclient:/oauth2redirect',
  googleReversedSchemeFromClientId: () => 'com.googleusercontent.apps.testclient',
  hasAndroidGoogleOAuthIntentFilterInConfig: () => true,
  shouldUseGoogleNativeSignIn: () => true,
}));

vi.mock('@/features/auth/androidGoogleOAuthCapability', () => ({
  getCachedAndroidGoogleOAuthRedirectHandlerInstalled: () => true,
  resolveAndroidGoogleOAuthRedirectHandlerInstalled: vi.fn(async () => true),
}));

vi.mock('@/features/auth/oauthRedirect', () => ({
  getOAuthRedirectUri: () => 'tracebudoffline://auth/callback',
}));

vi.mock('@/features/auth/oauthOrchestratorPolicy', () => ({
  shouldAllowGoogleNativeBrowserFallback: () => false,
}));

vi.stubGlobal('__DEV__', true);

import { collectOAuthRuntimeDiagnostics } from './oauthRuntimeDiagnostics';

describe('collectOAuthRuntimeDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports config and runtime redirect handler state', () => {
    const snapshot = collectOAuthRuntimeDiagnostics();
    expect(snapshot.hasGoogleIntentFilterInConfig).toBe(true);
    expect(snapshot.hasGoogleIntentFilterInstalled).toBe(true);
    expect(snapshot.nativeRedirectUri).toBe('com.googleusercontent.apps.testclient:/oauth2redirect');
    expect(snapshot.useNativeGoogleSignIn).toBe(true);
  });
});
