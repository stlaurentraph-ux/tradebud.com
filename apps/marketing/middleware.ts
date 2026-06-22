import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

import {
  MARKETING_PREVIEW_COOKIE,
  MARKETING_PREVIEW_PARAM,
} from '@/lib/marketing-publication';
import { shouldBlockUnpublishedMarketingPath } from '@/lib/marketing-stealth-paths';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const previewSecret = process.env.MARKETING_PREVIEW_SECRET;
  const previewParam = request.nextUrl.searchParams.get(MARKETING_PREVIEW_PARAM);

  if (previewSecret && previewParam === previewSecret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(MARKETING_PREVIEW_PARAM);
    const response = NextResponse.redirect(url);
    response.cookies.set(MARKETING_PREVIEW_COOKIE, previewSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  if (
    shouldBlockUnpublishedMarketingPath({
      pathname: request.nextUrl.pathname,
      previewCookieValue: request.cookies.get(MARKETING_PREVIEW_COOKIE)?.value,
      previewSecret,
      nodeEnv: process.env.NODE_ENV,
    })
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
