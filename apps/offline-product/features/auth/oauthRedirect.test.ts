import { describe, expect, it, vi } from 'vitest';

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
  it('uses universal link callback in release builds', async () => {
    vi.stubGlobal('__DEV__', false);
    vi.resetModules();
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

  it('uses custom scheme in local debug builds', async () => {
    vi.stubGlobal('__DEV__', true);
    vi.resetModules();
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
});
