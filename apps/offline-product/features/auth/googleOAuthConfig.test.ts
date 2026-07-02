import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { scheme: 'tracebudoffline' },
    isDevice: true,
  },
}));

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn(() => 'tracebudoffline:/10.0.0.7:8081/oauth2redirect'),
}));

vi.mock('@/features/auth/googleOAuthEnv', () => ({
  GOOGLE_OAUTH_ENV: {},
}));

vi.mock('@/features/auth/oauthRedirect', () => ({
  getNativeOAuthCallbackUri: vi.fn(() => 'tracebudoffline://auth/callback'),
}));

import {
  getAndroidGoogleOAuthRedirectUri,
  getGoogleOAuthRedirectUri,
  shouldUseGoogleNativeSignIn,
} from './googleOAuthConfig';

describe('getGoogleOAuthRedirectUri', () => {
  it('uses a fixed Android redirect without Metro host injection', () => {
    expect(getAndroidGoogleOAuthRedirectUri()).toBe('tracebudoffline://oauth2redirect');
    expect(getGoogleOAuthRedirectUri('838154191395-abc.apps.googleusercontent.com')).toBe(
      'tracebudoffline://oauth2redirect',
    );
  });
});

describe('shouldUseGoogleNativeSignIn', () => {
  it('is disabled on Android', () => {
    expect(shouldUseGoogleNativeSignIn()).toBe(false);
  });
});
