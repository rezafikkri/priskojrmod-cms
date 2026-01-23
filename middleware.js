import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasAccess } from './lib/authorization';
import { UserRole } from './constants/enums';

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = await getToken({ req });

    if (
      (pathname === '/signin' && token) ||
      (pathname.startsWith('/admin') && !hasAccess(token?.role, UserRole.OWNER))
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (!token && pathname === '/signin') return true;
        if (token) return true;
        return false;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (metadata files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
