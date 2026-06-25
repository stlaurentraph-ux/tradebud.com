import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/androidGoogleOAuthCapability', () => ({
  getCachedAndroidGoogleOAuthRedirectHandlerInstalled: () => true,
}));

vi.mock('expo-constants', () => ({
  default: {
    isDevice: true,
    expoConfig: {
      android: {
        intentFilters: [{ data: [{ scheme: 'com.googleusercontent.apps.abc123' }] }],
      },
      extra: {
        googleOAuth: {
          webClientId: 'web.apps.googleusercontent.com',
          androidClientId: 'abc123.apps.googleusercontent.com',
        },
      },
    },
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('@/features/auth/googleOAuthEnv', () => ({
  GOOGLE_OAUTH_ENV: {},
}));

vi.mock('@/features/auth/oauthRedirect', () => ({
  getNativeOAuthCallbackUri: () => 'tracebudoffline://auth/callback',
}));

import {
  hasAndroidGoogleOAuthIntentFilter,
  shouldUseGoogleNativeSignIn,
} from './googleOAuthConfig';

describe('googleOAuthConfig android intent filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses native sign-in when config and runtime probe both agree', () => {
    expect(hasAndroidGoogleOAuthIntentFilter()).toBe(true);
    expect(shouldUseGoogleNativeSignIn()).toBe(true);
  });
});
