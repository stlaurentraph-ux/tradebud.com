import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCanonicalRouteRedirectPath,
  getInternalToolsRedirectPath,
  isInternalToolsEnabled,
  mapToFounderOsUrl,
} from './internal-tools';

describe('internal-tools', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables internal tools in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isInternalToolsEnabled()).toBe(false);
  });

  it('redirects founder-os routes to ops URL in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FOUNDER_OS_URL', 'https://ops.tracebud.com');
    expect(getInternalToolsRedirectPath('/founder-os/crm/daily-actions')).toBe(
      'https://ops.tracebud.com/crm/daily-actions',
    );
    expect(mapToFounderOsUrl('/crm/prospects')).toBe('https://ops.tracebud.com/crm/prospects');
  });

  it('redirects legacy crm paths to local Founder OS in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getInternalToolsRedirectPath('/crm/daily-actions')).toBe(
      'http://localhost:3004/crm/daily-actions',
    );
  });

  it('redirects /shipments list to /packages', () => {
    expect(getCanonicalRouteRedirectPath('/shipments')).toBe('/packages');
  });
});
