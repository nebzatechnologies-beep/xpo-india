import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Node.js Proxy.
 * Supports dedicated Superadmin hosting on both:
 *  - Path namespace: xpoindia.com/superadmin, localhost:3000/superadmin
 *  - Subdomain namespace: superadmin.xpoindia.com, superadmin.localhost:3000
 * as well as direct navigation across Client (/dashboard/client, /creator)
 * and Partner (/dashboard/partner, /absorber) workspaces.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  if (
    host.startsWith('superadmin.') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/superadmin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/admin/dashboard' : `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
  ],
};
