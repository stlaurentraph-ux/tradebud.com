import { describe, expect, it } from 'vitest';

import {
  extractGoogleNativeOAuthCode,
  isGoogleNativeOAuthRedirectUrl,
  isOAuthCallbackUrl,
} from './oauthCallbackUrlPolicy';

describe('isOAuthCallbackUrl', () => {
  it('accepts Tracebud custom-scheme callbacks', () => {
    expect(isOAuthCallbackUrl('tracebudoffline://auth/callback?code=abc')).toBe(true);
  });

  it('accepts universal link callbacks', () => {
    expect(isOAuthCallbackUrl('https://app.tracebud.com/auth/callback#access_token=x')).toBe(true);
  });

  it('rejects Google native oauth2redirect URLs', () => {
    const url =
      'com.googleusercontent.apps.123:/oauth2redirect?code=4%2F0AeanS0q_example';
    expect(isGoogleNativeOAuthRedirectUrl(url)).toBe(true);
    expect(isOAuthCallbackUrl(url)).toBe(false);
    expect(extractGoogleNativeOAuthCode(url)).toBe('4/0AeanS0q_example');
  });

  it('rejects bare google.com URLs with code param', () => {
    expect(isOAuthCallbackUrl('https://www.google.com/search?code=not-ours')).toBe(false);
  });

  it('rejects attacker deep links carrying tokens from an untrusted scheme (session fixation)', () => {
    expect(
      isOAuthCallbackUrl('evil://x?access_token=AAA&refresh_token=BBB'),
    ).toBe(false);
    expect(
      isOAuthCallbackUrl('malicious://callback#access_token=AAA&refresh_token=BBB'),
    ).toBe(false);
  });

  it('rejects token-bearing URLs from an untrusted HTTPS host', () => {
    expect(isOAuthCallbackUrl('https://evil.example.com/cb?access_token=AAA')).toBe(false);
    expect(isOAuthCallbackUrl('https://app-tracebud.com.evil.io/auth/callback?code=x')).toBe(false);
  });

  it('accepts error callbacks on trusted origins', () => {
    expect(
      isOAuthCallbackUrl('https://app.tracebud.com/auth/callback?error=access_denied'),
    ).toBe(true);
    expect(isOAuthCallbackUrl('tracebudoffline://auth/callback?error=server_error')).toBe(true);
  });

  it('accepts the Expo Go dev bridge target', () => {
    expect(
      isOAuthCallbackUrl('exp://192.168.1.10:8081/--/auth/callback#access_token=x&refresh_token=y'),
    ).toBe(true);
  });

  it('ignores empty or non-string input', () => {
    expect(isOAuthCallbackUrl('')).toBe(false);
    expect(isOAuthCallbackUrl(undefined as unknown as string)).toBe(false);
  });
});
