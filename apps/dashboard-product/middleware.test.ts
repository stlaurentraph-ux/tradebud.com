import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getGateRedirectPath } from './middleware';

describe('middleware gate redirect', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects deferred routes when gates are disabled', () => {
    expect(getGateRedirectPath('/requests')).toBe('/');
    expect(getGateRedirectPath('/reports')).toBe('/');
    expect(getGateRedirectPath('/')).toBe(null);
  });

  it('allows deferred routes when gates are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'true');
    expect(getGateRedirectPath('/requests')).toBe(null);
    expect(getGateRedirectPath('/reports')).toBe(null);
  });
});
