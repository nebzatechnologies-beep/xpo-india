import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/firebase/admin';
import {
  createFirebaseSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_IN_MS,
} from '@/lib/auth/server-session';
import { ensureAuthenticatedUser } from '@/lib/services/users';
import { handleApiError } from '@/lib/utils/api-handler';

const sessionExchangeSchema = z.object({
  idToken: z.string().min(10, 'Firebase ID token is required'),
  displayName: z.string().optional(),
  phoneRaw: z.string().optional(),
  confirmedCountry: z.string().optional(),
  city: z.string().optional(),
  initialRole: z.enum(['client', 'partner']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = sessionExchangeSchema.parse(await request.json());
    const adminAuth = requireAdminAuth();

    const decoded = await adminAuth.verifyIdToken(body.idToken, true);
    const sessionCookie = await createFirebaseSessionCookie(body.idToken);

    const { user, profiles } = await ensureAuthenticatedUser({
      uid: decoded.uid,
      phoneRaw: decoded.phone_number || body.phoneRaw || null,
      confirmedCountry: body.confirmedCountry || 'IN',
      email: decoded.email || null,
      displayName: body.displayName || decoded.name || null,
      city: body.city || null,
      initialRole: body.initialRole,
      isPhoneVerified: Boolean(decoded.phone_number),
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: Math.floor(SESSION_EXPIRES_IN_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      ok: true,
      user,
      profiles,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
