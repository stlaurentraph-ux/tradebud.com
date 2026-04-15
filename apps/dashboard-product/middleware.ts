import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDeferredGateForPath } from './lib/feature-gates';

export function getGateRedirectPath(pathname: string): string | null {
  return getDeferredGateForPath(pathname) ? '/' : null;
}

export function applyGateRedirectParams(url: URL): URL {
  const gate = getDeferredGateForPath(url.pathname);
  const redirectUrl = new URL(url.toString());
  redirectUrl.pathname = '/';
  redirectUrl.searchParams.set('feature', 'mvp_gated');
  // Keep a lightweight route-entry breadcrumb for diagnostics/analytics.
  if (gate) {
    redirectUrl.searchParams.set('gate', gate);
  }
  return redirectUrl;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectPath = getGateRedirectPath(pathname);
  if (!redirectPath) {
    return NextResponse.next();
  }

  const redirectUrl = applyGateRedirectParams(request.nextUrl);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
