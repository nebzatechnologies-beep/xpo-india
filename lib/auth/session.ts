import { auth } from '@/lib/auth/auth';
import { err } from '@/lib/utils/api-response';
import type { UserRole } from '@/lib/db/models/User';

export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    status: string;
  };
};

/**
 * Retrieves and validates the current session from a Next.js route handler.
 * Returns null if the user is not authenticated.
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth session type is extended at runtime
  return session as any as AuthSession;
}

/**
 * Guards a route handler — returns an error response if the user is not authenticated,
 * or if the user's role is not in the allowed list.
 *
 * @returns The session on success, or an error NextResponse on failure.
 */
export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<AuthSession | ReturnType<typeof err>> {
  const session = await getSession();

  if (!session) {
    return err('Unauthorized. Please sign in.', 401);
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return err('Forbidden. Insufficient permissions.', 403);
  }

  return session;
}

/** Type guard to check if the return value of requireAuth is a session (not an error response). */
export function isSession(value: unknown): value is AuthSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user' in value &&
    typeof (value as AuthSession).user?.id === 'string'
  );
}
