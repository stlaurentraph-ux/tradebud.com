import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDeferredGateForPath } from './lib/feature-gates';
import {
  getCanonicalRouteRedirectPath,
  getInternalToolsRedirectPath,
} from './lib/internal-tools';
import { getAuthRedirectUrl } from './lib/route-auth';

export function getGateRedirectPath(pathname: string): string | null {
  return getDeferredGateForPath(pathname) ? '/' : null;
}

export function applyGateRedirectParams(url: URL): URL {
  const gate = getDeferredGateForPath(url.pathname);
  const redirectUrl = new URL(url.toString());
  redirectUrl.pathname = '/';
  redirectUrl.searchParams.set('feature', 'mvp_gated');
  if (gate) {
    redirectUrl.searchParams.set('gate', gate);
  }
  return redirectUrl;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authRedirect = getAuthRedirectUrl(request);
  if (authRedirect) {
    return NextResponse.redirect(authRedirect);
  }

  const canonicalRedirect = getCanonicalRouteRedirectPath(pathname);
  if (canonicalRedirect) {
    const redirectUrl = new URL(request.nextUrl.toString());
    redirectUrl.pathname = canonicalRedirect;
    return NextResponse.redirect(redirectUrl);
  }

  const internalToolsRedirect = getInternalToolsRedirectPath(pathname);
  if (internalToolsRedirect) {
    const redirectUrl = new URL(request.nextUrl.toString());
    redirectUrl.pathname = internalToolsRedirect;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

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
