import { describe, expect, it } from 'vitest';

import { normalizeAuthAnalyticsReason } from './authAnalyticsReason';

describe('normalizeAuthAnalyticsReason', () => {
  it('passes through known sign_in_* keys', () => {
    expect(normalizeAuthAnalyticsReason('sign_in_oauth_failed')).toBe('sign_in_oauth_failed');
    expect(normalizeAuthAnalyticsReason('sign_in_invalid_credentials')).toBe(
      'sign_in_invalid_credentials',
    );
  });

  it('passes through stable callback reasons', () => {
    expect(normalizeAuthAnalyticsReason('missing_initial_url')).toBe('missing_initial_url');
    expect(normalizeAuthAnalyticsReason('exception')).toBe('exception');
  });

  it('redacts raw provider error text to auth_error_unknown', () => {
    expect(normalizeAuthAnalyticsReason('Invalid login credentials for farmer@example.com')).toBe(
      'auth_error_unknown',
    );
  });
});
