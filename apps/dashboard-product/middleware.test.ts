import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { applyGateRedirectParams, getGateRedirectPath, middleware } from './middleware';

function makeToken(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.signature`;
}

function makeMiddlewareRequest(url: string, withSession = true): NextRequest {
  const request = { nextUrl: new URL(url) } as NextRequest;
  request.cookies = {
    get: (name: string) =>
      withSession && name === 'tracebud_session'
        ? { value: makeToken(Math.floor(Date.now() / 1000) + 3600) }
        : undefined,
  } as NextRequest['cookies'];
  return request;
}

describe('middleware gate redirect', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows deferred routes by default when gates are enabled', () => {
    expect(getGateRedirectPath('/outreach')).toBe(null);
    expect(getGateRedirectPath('/inbox')).toBe(null);
    expect(getGateRedirectPath('/reports')).toBe(null);
    expect(getGateRedirectPath('/')).toBe(null);
  });

  it('redirects deferred routes when gates are explicitly disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
    expect(getGateRedirectPath('/outreach')).toBe('/');
    expect(getGateRedirectPath('/inbox')).toBe('/');
    expect(getGateRedirectPath('/reports')).toBe('/');
  });

  it('redirects nested deferred routes when gates are disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
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

  it('redirects reports when annual reporting is explicitly disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
    expect(getGateRedirectPath('/reports')).toBe('/');
    expect(getGateRedirectPath('/reports/annual')).toBe('/');
  });

  it('appends feature gate marker while preserving query params', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
    const original = new URL('https://tracebud.test/reports/annual?tenant=tenant_1&tab=all');
    const redirected = applyGateRedirectParams(original);
    expect(redirected.pathname).toBe('/');
    expect(redirected.searchParams.get('feature')).toBe('mvp_gated');
    expect(redirected.searchParams.get('gate')).toBe('annual_reporting');
    expect(redirected.searchParams.get('tenant')).toBe('tenant_1');
    expect(redirected.searchParams.get('tab')).toBe('all');
  });

  it('middleware redirects gated request with feature marker', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_ANNUAL_REPORTING', 'false');
    const request = makeMiddlewareRequest('https://tracebud.test/reports/annual?tenant=tenant_1');

    const response = middleware(request);
    expect(response.headers.get('location')).toContain('/?tenant=tenant_1&feature=mvp_gated&gate=annual_reporting');
    expect(response.status).toBe(307);
  });

  it('adds request_campaigns gate marker for outreach route redirect', () => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS', 'false');
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

  it('middleware redirects internal tools in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS', 'false');
    vi.stubEnv('NEXT_PUBLIC_FOUNDER_OS_URL', 'https://ops.tracebud.com');
    const request = makeMiddlewareRequest('https://tracebud.test/founder-os/crm/daily-actions');

    const response = middleware(request);
    expect(response.headers.get('location')).toBe('https://ops.tracebud.com/crm/daily-actions');
    expect(response.status).toBe(307);
  });

  it('middleware redirects /shipments list to /packages', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/shipments');

    const response = middleware(request);
    expect(response.headers.get('location')).toContain('https://tracebud.test/packages');
    expect(response.status).toBe(307);
  });

  it('middleware redirects unauthenticated users to login', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/packages', false);

    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?next=%2Fpackages');
  });

  it('middleware allows public auth routes without session cookie', () => {
    const request = makeMiddlewareRequest('https://tracebud.test/login', false);

    const response = middleware(request);
    expect(response.status).toBe(200);
  });
});
