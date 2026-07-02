import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-constants', () => ({
  default: {
    appOwnership: 'expo',
    expoConfig: { scheme: 'tracebudoffline' },
  },
}));

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: ({ path }: { path?: string }) => `exp://127.0.0.1:8081/--/${path ?? ''}`,
}));

describe('oauthRedirect', () => {
  it('uses app.tracebud.com HTTPS bridge in Expo Go', async () => {
    const { getOAuthRedirectUri, getOAuthRedirectMatchPrefix } = await import('./oauthRedirect');
    const uri = getOAuthRedirectUri();
    expect(uri).toContain('https://app.tracebud.com/auth/callback');
    expect(uri).toContain('app_redirect=');
    expect(getOAuthRedirectMatchPrefix()).toBe('https://app.tracebud.com/auth/callback');
  });
});

describe('oauthRedirect native build', () => {
  it('uses universal link callback in release builds on iOS', async () => {
    vi.stubGlobal('__DEV__', false);
    vi.resetModules();
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    vi.doMock('expo-constants', () => ({
      default: {
        appOwnership: 'user',
        expoConfig: { scheme: 'tracebudoffline' },
      },
    }));
    vi.doMock('expo-auth-session', () => ({
      makeRedirectUri: ({ scheme, path }: { scheme?: string; path?: string }) =>
        `${scheme}://${path ?? ''}`,
    }));
    const { getOAuthRedirectUri } = await import('./oauthRedirect');
    expect(getOAuthRedirectUri()).toBe('https://app.tracebud.com/auth/callback');
    vi.unstubAllGlobals();
  });

  it('uses custom scheme in local debug builds on iOS', async () => {
    vi.stubGlobal('__DEV__', true);
    vi.resetModules();
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    vi.doMock('expo-constants', () => ({
      default: {
        appOwnership: 'user',
        expoConfig: { scheme: 'tracebudoffline' },
      },
    }));
    vi.doMock('expo-auth-session', () => ({
      makeRedirectUri: ({ scheme, path }: { scheme?: string; path?: string }) =>
        `${scheme}://${path ?? ''}`,
    }));
    const { getOAuthRedirectUri, getOAuthRedirectMatchPrefix } = await import('./oauthRedirect');
    expect(getOAuthRedirectUri()).toBe('tracebudoffline://auth/callback');
    expect(getOAuthRedirectMatchPrefix()).toBe('tracebudoffline://auth/callback');
    vi.unstubAllGlobals();
  });

  it('uses HTTPS bridge on Android installable builds', async () => {
    vi.stubGlobal('__DEV__', true);
    vi.resetModules();
    vi.doMock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
    vi.doMock('expo-constants', () => ({
      default: {
        appOwnership: 'user',
        expoConfig: { scheme: 'tracebudoffline' },
      },
    }));
    vi.doMock('expo-auth-session', () => ({
      makeRedirectUri: ({ scheme, path }: { scheme?: string; path?: string }) =>
        `${scheme}://${path ?? ''}`,
    }));
    const { getOAuthRedirectUri, getOAuthRedirectMatchPrefixes } = await import('./oauthRedirect');
    expect(getOAuthRedirectUri()).toContain('https://app.tracebud.com/auth/callback');
    expect(getOAuthRedirectUri()).toContain('app_redirect=');
    expect(getOAuthRedirectMatchPrefixes()).toEqual([
      'https://app.tracebud.com/auth/callback',
      'tracebudoffline://auth/callback',
    ]);
    vi.unstubAllGlobals();
  });

  it('uses custom scheme in preview when EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME=1 on iOS', async () => {
    vi.stubGlobal('__DEV__', false);
    process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME = '1';
    vi.resetModules();
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    vi.doMock('expo-constants', () => ({
      default: {
        appOwnership: 'user',
        expoConfig: { scheme: 'tracebudoffline' },
      },
    }));
    vi.doMock('expo-auth-session', () => ({
      makeRedirectUri: ({ scheme, path }: { scheme?: string; path?: string }) =>
        `${scheme}://${path ?? ''}`,
    }));
    const { getOAuthRedirectUri } = await import('./oauthRedirect');
    expect(getOAuthRedirectUri()).toBe('tracebudoffline://auth/callback');
    delete process.env.EXPO_PUBLIC_OAUTH_USE_CUSTOM_SCHEME;
    vi.unstubAllGlobals();
  });
});
