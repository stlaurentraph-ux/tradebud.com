import { describe, expect, it } from 'vitest';

import {
  redirectSystemPathForNativeIntent,
  resolveGoogleNativeOAuthRouterPath,
} from './googleNativeIntentRedirect';

describe('resolveGoogleNativeOAuthRouterPath', () => {
  it('maps Google native oauth2redirect URLs to /oauth2redirect with query', () => {
    const url =
      'com.googleusercontent.apps.123:/oauth2redirect?code=4%2F0AeanS0q_example&scope=email';
    expect(resolveGoogleNativeOAuthRouterPath(url)).toBe(
      '/oauth2redirect?code=4%2F0AeanS0q_example&scope=email',
    );
  });

  it('maps Android tracebudoffline oauth2redirect URLs to /oauth2redirect with query', () => {
    const url =
      'tracebudoffline://oauth2redirect?state=Bt7UxIL2el&code=4%2F0AdkVLPyHagA10mNbisAD&scope=email';
    expect(resolveGoogleNativeOAuthRouterPath(url)).toBe(
      '/oauth2redirect?state=Bt7UxIL2el&code=4%2F0AdkVLPyHagA10mNbisAD&scope=email',
    );
  });

  it('ignores Tracebud Supabase callbacks', () => {
    expect(
      resolveGoogleNativeOAuthRouterPath('tracebudoffline://auth/callback?code=supabase'),
    ).toBeNull();
  });
});

describe('redirectSystemPathForNativeIntent', () => {
  it('passes through normal in-app paths', () => {
    expect(redirectSystemPathForNativeIntent('/(tabs)/settings')).toBe('/(tabs)/settings');
  });

  it('rewrites hash tokens to query params for web-style callbacks', () => {
    expect(redirectSystemPathForNativeIntent('/auth/callback#access_token=x')).toBe(
      '/auth/callback?access_token=x',
    );
  });
});
