import { beforeEach, describe, expect, it, vi } from 'vitest';

const linkingMocks = vi.hoisted(() => ({
  canOpenURL: vi.fn<() => Promise<boolean>>(),
}));

const settingsMocks = vi.hoisted(() => ({
  getSetting: vi.fn<() => Promise<string | null>>(),
  setSetting: vi.fn<() => Promise<void>>(),
}));

vi.mock('expo-linking', () => ({
  canOpenURL: linkingMocks.canOpenURL,
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('@/features/auth/googleOAuthConfig', () => ({
  getGoogleOAuthClientIds: () => ({
    webClientId: 'web.apps.googleusercontent.com',
    clientId: 'abc123.apps.googleusercontent.com',
  }),
  getGoogleOAuthRedirectUri: () => 'com.googleusercontent.apps.abc123:/oauth2redirect',
  hasAndroidGoogleOAuthIntentFilterInConfig: () => true,
}));

vi.mock('@/features/state/persistence', () => ({
  getSetting: settingsMocks.getSetting,
  setSetting: settingsMocks.setSetting,
}));

vi.mock('@/features/auth/oauthDiagnosticsStore', () => ({
  recordOAuthDiagnosticEvent: vi.fn(),
}));

import {
  __resetAndroidGoogleOAuthCapabilityCacheForTests,
  getCachedAndroidGoogleOAuthRedirectHandlerInstalled,
  persistAndroidGoogleNativeOAuthDisabled,
  probeAndroidGoogleOAuthRedirectHandler,
  resolveAndroidGoogleOAuthRedirectHandlerInstalled,
} from './androidGoogleOAuthCapability';

describe('androidGoogleOAuthCapability', () => {
  beforeEach(() => {
    __resetAndroidGoogleOAuthCapabilityCacheForTests();
    vi.clearAllMocks();
    settingsMocks.getSetting.mockResolvedValue(null);
    settingsMocks.setSetting.mockResolvedValue(undefined);
    linkingMocks.canOpenURL.mockResolvedValue(true);
  });

  it('probes Linking.canOpenURL for the native redirect URI', async () => {
    await expect(probeAndroidGoogleOAuthRedirectHandler()).resolves.toBe(true);
    expect(linkingMocks.canOpenURL).toHaveBeenCalledWith(
      'com.googleusercontent.apps.abc123:/oauth2redirect',
    );
    expect(getCachedAndroidGoogleOAuthRedirectHandlerInstalled()).toBe(true);
  });

  it('returns false when canOpenURL reports no handler on device', async () => {
    linkingMocks.canOpenURL.mockResolvedValue(false);
    await expect(probeAndroidGoogleOAuthRedirectHandler()).resolves.toBe(false);
    expect(getCachedAndroidGoogleOAuthRedirectHandlerInstalled()).toBe(false);
  });

  it('respects persisted disable flag without probing', async () => {
    settingsMocks.getSetting.mockResolvedValue('1');
    await expect(probeAndroidGoogleOAuthRedirectHandler()).resolves.toBe(false);
    expect(linkingMocks.canOpenURL).not.toHaveBeenCalled();
  });

  it('persists disable and clears cache after native dismiss', async () => {
    linkingMocks.canOpenURL.mockResolvedValue(true);
    await probeAndroidGoogleOAuthRedirectHandler();
    await persistAndroidGoogleNativeOAuthDisabled('native_prompt_dismiss');
    expect(settingsMocks.setSetting).toHaveBeenCalledWith(
      'android_google_native_oauth_disabled',
      '1',
    );
    expect(getCachedAndroidGoogleOAuthRedirectHandlerInstalled()).toBe(false);
    await expect(resolveAndroidGoogleOAuthRedirectHandlerInstalled()).resolves.toBe(false);
    expect(linkingMocks.canOpenURL).toHaveBeenCalledTimes(1);
  });
});
