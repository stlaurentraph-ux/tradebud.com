import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export function middleware(request: NextRequest) {
  const token = process.env.FOUNDER_OS_ACCESS_TOKEN?.trim();
  if (!token) return NextResponse.next();
  const header = request.headers.get('authorization');
  const query = request.nextUrl.searchParams.get('token');
  if (header === `Bearer ${token}` || query === token) return NextResponse.next();
  return new NextResponse('Unauthorized', { status: 401 });
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
