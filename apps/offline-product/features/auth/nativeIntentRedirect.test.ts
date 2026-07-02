import { describe, expect, it } from 'vitest';

import { redirectSystemPath } from '@/app/+native-intent';

describe('redirectSystemPath (+native-intent)', () => {
  it('maps tracebudoffline auth callback deep links to /auth/callback', () => {
    expect(
      redirectSystemPath({
        path: 'tracebudoffline://auth/callback?code=abc',
        initial: true,
      }),
    ).toBe('/auth/callback?code=abc');
  });

  it('maps HTTPS app.tracebud.com auth callback links to /auth/callback', () => {
    expect(
      redirectSystemPath({
        path: 'https://app.tracebud.com/auth/callback?code=abc&app_redirect=tracebudoffline%3A%2F%2Fauth%2Fcallback',
        initial: true,
      }),
    ).toBe(
      '/auth/callback?code=abc&app_redirect=tracebudoffline%3A%2F%2Fauth%2Fcallback',
    );
  });

  it('maps legacy oauth2redirect deep links to /oauth2redirect', () => {
    expect(
      redirectSystemPath({
        path: 'tracebudoffline://oauth2redirect?code=legacy',
        initial: true,
      }),
    ).toBe('/oauth2redirect?code=legacy');
  });
});
