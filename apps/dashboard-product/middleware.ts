import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDeferredGateForPath } from './lib/feature-gates';

export function getGateRedirectPath(pathname: string): string | null {
  return getDeferredGateForPath(pathname) ? '/' : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectPath = getGateRedirectPath(pathname);
  if (!redirectPath) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = redirectPath;
  redirectUrl.searchParams.set('feature', 'mvp_gated');
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
