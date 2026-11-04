import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 Node.js Proxy.
 * Allows direct navigation across Client (/dashboard/client, /creator),
 * Partner (/dashboard/partner, /absorber), and Superadmin (/admin) workspaces.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*'],
};
