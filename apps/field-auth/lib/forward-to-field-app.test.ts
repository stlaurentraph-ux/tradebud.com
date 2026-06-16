import { describe, expect, it } from 'vitest';

import {
  buildForwardedAuthUrl,
  DEFAULT_FIELD_APP_DEEP_LINK,
  parseHashParams,
  resolveAppRedirect,
} from './forward-to-field-app';

describe('forward-to-field-app', () => {
  it('defaults app redirect to tracebudoffline deep link', () => {
    expect(resolveAppRedirect(null)).toBe(DEFAULT_FIELD_APP_DEEP_LINK);
  });

  it('forwards PKCE code to deep link', () => {
    const url = buildForwardedAuthUrl({
      appRedirect: 'tracebudoffline://auth/callback',
      searchParams: new URLSearchParams('code=abc123'),
      hashParams: {},
    });
    expect(url).toBe('tracebudoffline://auth/callback?code=abc123');
  });

  it('forwards implicit grant hash to deep link', () => {
    const hashParams = parseHashParams(
      '#access_token=at&refresh_token=rt&token_type=bearer',
    );
    const url = buildForwardedAuthUrl({
      appRedirect: 'exp://127.0.0.1:8081/--/auth/callback',
      searchParams: new URLSearchParams(),
      hashParams,
    });
    expect(url).toContain('exp://127.0.0.1:8081/--/auth/callback');
    expect(url).toContain('access_token=at');
  });

  it('forwards oauth errors', () => {
    const url = buildForwardedAuthUrl({
      appRedirect: 'tracebudoffline://auth/callback',
      searchParams: new URLSearchParams('error=access_denied&error_description=nope'),
      hashParams: {},
    });
    expect(url).toContain('error=access_denied');
    expect(url).toContain('error_description=nope');
  });
});
