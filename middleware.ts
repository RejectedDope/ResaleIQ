import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/inventory', '/recovery-actions', '/reports', '/settings'];

export function middleware(req: NextRequest) {
  if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    const token = req.cookies.get('sb-access-token')?.value;
    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/inventory/:path*', '/recovery-actions/:path*', '/reports/:path*', '/settings/:path*'] };
