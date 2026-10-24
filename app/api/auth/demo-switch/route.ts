import { NextRequest, NextResponse } from 'next/server';
import { encode, decode } from '@auth/core/jwt';

const DEMO_USERS = {
  superadmin: {
    id: '67489a12bcde345678900001',
    name: 'Super Admin',
    email: 'admin@xpoindia.com',
    role: 'superadmin',
    emailVerified: true,
    status: 'active',
    redirectUrl: '/admin/dashboard',
  },
  lead_creator: {
    id: '67489a12bcde345678900002',
    name: 'Rajesh Sharma (Industrial Supplies)',
    email: 'creator@xpoindia.com',
    role: 'lead_creator',
    emailVerified: true,
    status: 'active',
    redirectUrl: '/creator/dashboard',
  },
  lead_absorber: {
    id: '67489a12bcde345678900003',
    name: 'Anil Patel (Patel Precision Tech)',
    email: 'absorber@xpoindia.com',
    role: 'lead_absorber',
    emailVerified: true,
    status: 'active',
    redirectUrl: '/absorber/opportunities',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roleKey = body.role as 'superadmin' | 'lead_creator' | 'lead_absorber' | 'logout';

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'xpo_india_secret_key_demo_2024_secure_and_reliable_32_chars';

    if (roleKey === 'logout') {
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully',
        redirectUrl: '/login',
      });

      const cookiesToClear = [
        'authjs.session-token',
        '__Secure-authjs.session-token',
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'authjs.callback-url',
        'authjs.csrf-token',
      ];

      for (const name of cookiesToClear) {
        response.cookies.set({
          name,
          value: '',
          path: '/',
          maxAge: 0,
          httpOnly: true,
          sameSite: 'lax',
        });
      }

      return response;
    }

    const targetUser = DEMO_USERS[roleKey];
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const token = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      emailVerified: targetUser.emailVerified,
      status: targetUser.status,
    };

    const sessionToken = await encode({
      token,
      secret,
      salt: 'authjs.session-token',
      maxAge: 30 * 24 * 60 * 60,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      redirectUrl: body.redirectUrl || targetUser.redirectUrl,
    });

    response.cookies.set({
      name: 'authjs.session-token',
      value: sessionToken,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set({
      name: 'next-auth.session-token',
      value: sessionToken,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[DEMO_SWITCH_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to switch demo account' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'xpo_india_secret_key_demo_2024_secure_and_reliable_32_chars';
  const cookie = request.cookies.get('authjs.session-token')?.value || request.cookies.get('next-auth.session-token')?.value;

  if (!cookie) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const token = await decode({
      token: cookie,
      secret,
      salt: 'authjs.session-token',
    });

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
