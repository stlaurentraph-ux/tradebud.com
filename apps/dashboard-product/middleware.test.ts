import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { applyGateRedirectParams, getGateRedirectPath, middleware } from './middleware';

function makeMiddlewareRequest(url: string): NextRequest {
  return { nextUrl: new URL(url) } as NextRequest;
}

describe('middleware gate redirect', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects deferred routes when gates are disabled', () => {
    expect(getGateRedirectPath('/outreach')).toBe('/');
    expect(getGateRedirectPath('/inbox')).toBe('/');
    expect(getGateRedirectPath('/reports')).toBe('/');
    expect(getGateRedirectPath('/')).toBe(null);
  });

  it('redirects nested deferred routes when gates are disabled', () => {
    expect(getGateRedirectPath('/outreach/')).toBe('/');
    expect(getGateRedirectPath('/outreach/new')).toBe('/');
    expect(getGateRedirectPath('/inbox/threads')).toBe('/');
    expect(getGateRedirectPath('/reports/annual')).toBe('/');
    expect(getGateRedirectPath('/reports/export/pdf')).toBe('/');
  });

  it('allows deferred routes when gates are enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'true');
    expect(getGateRedirectPath('/outreach')).toBe(null);
    expect(getGateRedirectPath('/inbox')).toBe(null);
    expect(getGateRedirectPath('/reports')).toBe(null);
    expect(getGateRedirectPath('/outreach/new')).toBe(null);
    expect(getGateRedirectPath('/inbox/threads')).toBe(null);
    expect(getGateRedirectPath('/reports/annual')).toBe(null);
  });

  it('appends feature gate marker while preserving query params', () => {
    const original = new URL('https://tracebud.test/reports/annual?tenant=tenant_1&tab=all');
    const redirected = applyGateRedirectParams(original);
    expect(redirected.pathname).toBe('/');
    expect(redirected.searchParams.get('feature')).toBe('mvp_gated');
    expect(redirected.searchParams.get('gate')).toBe('annual_reporting');
    expect(redirected.searchParams.get('tenant')).toBe('tenant_1');
    expect(redirected.searchParams.get('tab')).toBe('all');
  });

  it('middleware redirects gated request with feature marker', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/reports/annual?tenant=tenant_1');

    const response = middleware(request);
    expect(response.headers.get('location')).toContain('/?tenant=tenant_1&feature=mvp_gated&gate=annual_reporting');
    expect(response.status).toBe(307);
  });

  it('adds request_campaigns gate marker for outreach route redirect', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/outreach/new?tenant=tenant_1');

    const response = middleware(request);
    expect(response.headers.get('location')).toContain('/?tenant=tenant_1&feature=mvp_gated&gate=request_campaigns');
    expect(response.status).toBe(307);
  });

  it('middleware passes through non-gated request', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/compliance?tenant=tenant_1');

    const response = middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
