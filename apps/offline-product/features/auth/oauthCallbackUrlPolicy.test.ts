import { describe, expect, it } from 'vitest';

import { isOAuthCallbackUrl } from './oauthCallbackUrlPolicy';

describe('isOAuthCallbackUrl', () => {
  it('accepts Tracebud custom-scheme callbacks', () => {
    expect(isOAuthCallbackUrl('tracebudoffline://auth/callback?code=abc')).toBe(true);
  });

  it('accepts universal link callbacks', () => {
    expect(isOAuthCallbackUrl('https://app.tracebud.com/auth/callback#access_token=x')).toBe(true);
  });

  it('rejects Google native oauth2redirect URLs', () => {
    expect(
      isOAuthCallbackUrl(
        'com.googleusercontent.apps.123:/oauth2redirect?code=4%2F0AeanS0q_example',
      ),
    ).toBe(false);
  });

  it('rejects bare google.com URLs with code param', () => {
    expect(isOAuthCallbackUrl('https://www.google.com/search?code=not-ours')).toBe(false);
  });
});
