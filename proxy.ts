import { NextResponse, type NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { SESSION_COOKIE_NAME } from '@/lib/auth/server-session';

/**
 * Next.js 16 Node.js Proxy (replaces deprecated middleware.ts).
 * Verifies Firebase Admin `__session` cookies on protected customer & superadmin routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isDashboardPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding');

  if (!isAdminApi && !isAdminPage && !isDashboardPage) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Stale or legacy demo cookies are rejected immediately
  if (sessionCookie?.startsWith('demo_session_')) {
    if (isAdminApi) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', error: 'Demo sessions are permanently disabled' },
        { status: 401 }
      );
    }
    const targetLogin = isAdminPage ? '/admin/login' : '/login';
    const loginUrl = new URL(targetLogin, request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const { auth, db, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !auth || !db) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          ok: false,
          code: 'SERVICE_UNCONFIGURED',
          error:
            'Firebase Admin credentials are not configured yet. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local.',
        },
        { status: 503 }
      );
    }
    // Allow page shell to render its structured configuration banner before .env.local keys are pasted
    return NextResponse.next();
  }

  if (!sessionCookie) {
    if (isAdminApi) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', error: 'Authentication required' },
        { status: 401 }
      );
    }
    const targetLogin = isAdminPage ? '/admin/login' : '/login';
    const loginUrl = new URL(targetLogin, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    if (isAdminPage || isAdminApi) {
      let isSuperadmin = Boolean(decoded.superadmin);
      if (!isSuperadmin) {
        const userSnap = await db.collection('users').doc(decoded.uid).get();
        isSuperadmin = Boolean(userSnap.exists && userSnap.data()?.isSuperadmin);
      }
      if (!isSuperadmin) {
        if (isAdminApi) {
          return NextResponse.json(
            { ok: false, code: 'FORBIDDEN', error: 'Superadmin privileges required' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    return NextResponse.next();
  } catch {
    if (isAdminApi) {
      return NextResponse.json(
        { ok: false, code: 'SESSION_EXPIRED', error: 'Session expired or invalid' },
        { status: 401 }
      );
    }
    const targetLogin = isAdminPage ? '/admin/login' : '/login';
    const loginUrl = new URL(targetLogin, request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*', '/api/admin/:path*'],
};
