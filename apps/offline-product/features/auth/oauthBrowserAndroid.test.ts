import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
}));

vi.mock('expo-linking', () => ({
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  getInitialURL: vi.fn(async () => null),
}));

vi.mock('expo-web-browser', () => ({
  dismissBrowser: vi.fn(),
  openBrowserAsync: vi.fn(),
}));

import { oauthRedirectUrlMatches, oauthRedirectUrlMatchesAny } from './oauthBrowserAndroid';

describe('oauthRedirectUrlMatches', () => {
  it('matches tracebudoffline auth callback returns', () => {
    expect(
      oauthRedirectUrlMatches(
        'tracebudoffline://auth/callback?code=abc',
        'tracebudoffline://auth/callback',
      ),
    ).toBe(true);
  });

  it('matches legacy oauth2redirect returns for dismiss bridge', () => {
    expect(
      oauthRedirectUrlMatches(
        'tracebudoffline://oauth2redirect?code=abc',
        'tracebudoffline://oauth2redirect',
      ),
    ).toBe(true);
  });

  it('matches native callback after HTTPS bridge prefix', () => {
    expect(
      oauthRedirectUrlMatchesAny('tracebudoffline://auth/callback?code=abc', [
        'https://app.tracebud.com/auth/callback',
      ]),
    ).toBe(true);
  });
});
