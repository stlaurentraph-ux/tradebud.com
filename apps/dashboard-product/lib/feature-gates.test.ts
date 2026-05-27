import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDeferredGateForPath, isFeatureEnabled, isRouteEnabled } from './feature-gates';

describe('feature gates', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables deferred routes by default in MVP mode', () => {
    expect(isFeatureEnabled('request_campaigns')).toBe(false);
    expect(isFeatureEnabled('annual_reporting')).toBe(true);
    expect(isRouteEnabled('/outreach')).toBe(false);
    expect(isRouteEnabled('/inbox')).toBe(false);
    expect(isRouteEnabled('/reports')).toBe(true);
    expect(getDeferredGateForPath('/outreach')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/inbox')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/reports')).toBe(null);
  });

  it('enables deferred routes when flags are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', '1');
    expect(isFeatureEnabled('request_campaigns')).toBe(true);
    expect(isFeatureEnabled('annual_reporting')).toBe(true);
    expect(isRouteEnabled('/outreach')).toBe(true);
    expect(isRouteEnabled('/inbox')).toBe(true);
    expect(isRouteEnabled('/reports')).toBe(true);
    expect(getDeferredGateForPath('/outreach')).toBe(null);
    expect(getDeferredGateForPath('/inbox')).toBe(null);
    expect(getDeferredGateForPath('/reports')).toBe(null);
  });

  it('gates nested and trailing-slash route variants when disabled', () => {
    expect(getDeferredGateForPath('/outreach/')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/outreach/abc-123')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/inbox/')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/inbox/thread-1')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/reports/')).toBe(null);
    expect(getDeferredGateForPath('/reports/2026')).toBe(null);
    expect(getDeferredGateForPath('/reports/annual/export')).toBe(null);
  });

  it('keeps routes disabled when env flags are explicitly false', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', '0');
    expect(isFeatureEnabled('request_campaigns')).toBe(false);
    expect(isFeatureEnabled('annual_reporting')).toBe(false);
    expect(isRouteEnabled('/outreach/campaigns')).toBe(false);
    expect(isRouteEnabled('/inbox/campaigns')).toBe(false);
    expect(isRouteEnabled('/reports/annual')).toBe(false);
  });
});
