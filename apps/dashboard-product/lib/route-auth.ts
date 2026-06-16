import type { NextRequest } from 'next/server';
import { getSessionCookieName, isSessionTokenValid } from './auth-cookie';

const PUBLIC_PATH_PREFIXES = ['/login', '/create-account', '/auth/confirm', '/requests/intent'] as const;

export function isPublicDashboardPath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function getAuthRedirectUrl(request: NextRequest): URL | null {
  const { pathname } = request.nextUrl;
  if (isPublicDashboardPath(pathname)) {
    return null;
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (isSessionTokenValid(token)) {
    return null;
  }

  const loginUrl = new URL('/login', request.nextUrl.origin);
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  }
  return loginUrl;
}
