import { cookies, headers } from 'next/headers';
import { getFirebaseAdmin, requireAdminAuth } from '@/lib/firebase/admin';
import { getUserByUid } from '@/lib/services/users';
import { AuthError, ForbiddenError } from '@/lib/utils/api-handler';
import type { CustomerRole, XpoUser } from '@/lib/types/domain';

/**
 * Firebase Hosting CDN strips every cookie EXCEPT `__session` before forwarding
 * requests to Cloud Run / SSR frameworksBackend. Always store session cookies under `__session`.
 */
export const SESSION_COOKIE_NAME = '__session';
export const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface AuthenticatedSession {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  isSuperadminClaim: boolean;
  user: XpoUser;
}

export async function createFirebaseSessionCookie(idToken: string): Promise<string> {
  const adminAuth = requireAdminAuth();
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });
}

export async function getServerSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie || sessionCookie.startsWith('demo_session_')) {
    return null;
  }

  const { auth, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !auth) {
    return null;
  }

  let decoded: {
    uid: string;
    email?: string;
    phone_number?: string;
    superadmin?: boolean;
  } | null = null;

  if (sessionCookie) {
    try {
      decoded = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      decoded = null;
    }
  }

  // Fallback to Bearer Firebase ID token header for programmatic API requests
  if (!decoded) {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.slice(7).trim();
      try {
        decoded = await auth.verifyIdToken(idToken, true);
      } catch {
        decoded = null;
      }
    }
  }

  if (!decoded) return null;

  const user = await getUserByUid(decoded.uid);
  if (!user || user.status !== 'active') {
    return null;
  }

  return {
    uid: decoded.uid,
    email: decoded.email || user.email || null,
    phoneNumber: decoded.phone_number || user.phoneE164 || null,
    isSuperadminClaim: Boolean(decoded.superadmin || user.isSuperadmin),
    user,
  };
}

export async function requireAuth(): Promise<AuthenticatedSession> {
  const { isConfigured } = getFirebaseAdmin();
  if (!isConfigured) {
    requireAdminAuth();
  }
  const session = await getServerSession();
  if (!session) {
    throw new AuthError('Please sign in to your XPO account to continue.');
  }
  return session;
}

export async function requireRole(allowedRoles: CustomerRole[]): Promise<AuthenticatedSession> {
  const session = await requireAuth();
  if (session.user.isSuperadmin) return session;
  const hasRole = allowedRoles.includes(session.user.role);
  if (!hasRole) {
    throw new ForbiddenError(
      `This workspace action requires the ${allowedRoles.join(' or ')} role.`
    );
  }
  return session;
}

export async function requireSuperadmin(): Promise<AuthenticatedSession> {
  const session = await requireAuth();
  if (!session.user.isSuperadmin && !session.isSuperadminClaim) {
    throw new ForbiddenError('Superadmin privileges are required to access this control module.');
  }
  return session;
}
