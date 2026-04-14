import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDeferredGateForPath, isFeatureEnabled, isRouteEnabled } from './feature-gates';

describe('feature gates', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables deferred routes by default in MVP mode', () => {
    expect(isFeatureEnabled('request_campaigns')).toBe(false);
    expect(isFeatureEnabled('annual_reporting')).toBe(false);
    expect(isRouteEnabled('/requests')).toBe(false);
    expect(isRouteEnabled('/reports')).toBe(false);
    expect(getDeferredGateForPath('/requests')).toBe('request_campaigns');
    expect(getDeferredGateForPath('/reports')).toBe('annual_reporting');
  });

  it('enables deferred routes when flags are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', '1');
    expect(isFeatureEnabled('request_campaigns')).toBe(true);
    expect(isFeatureEnabled('annual_reporting')).toBe(true);
    expect(isRouteEnabled('/requests')).toBe(true);
    expect(isRouteEnabled('/reports')).toBe(true);
    expect(getDeferredGateForPath('/requests')).toBe(null);
    expect(getDeferredGateForPath('/reports')).toBe(null);
  });
});
