import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCanonicalRouteRedirectPath,
  getInternalToolsRedirectPath,
  isInternalToolsEnabled,
} from './internal-tools';

describe('internal-tools', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables internal tools in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isInternalToolsEnabled()).toBe(false);
  });

  it('allows internal tools when explicitly enabled in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS', 'true');
    expect(isInternalToolsEnabled()).toBe(true);
  });

  it('blocks founder-os routes in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS', 'false');
    expect(getInternalToolsRedirectPath('/founder-os/crm')).toBe('/');
  });

  it('redirects legacy crm paths when internal tools are enabled', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getInternalToolsRedirectPath('/crm/daily-actions')).toBe('/founder-os/crm/daily-actions');
  });

  it('redirects /shipments list to /packages', () => {
    expect(getCanonicalRouteRedirectPath('/shipments')).toBe('/packages');
    expect(getCanonicalRouteRedirectPath('/shipments/abc')).toBe(null);
  });
});
