import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import { Otp } from '@/lib/db/models/Otp';
import { sendOtpEmail } from '@/lib/email/mailer';
import { ok, err } from '@/lib/utils/api-response';

const RegisterSchema = z.object({
  name:        z.string().min(2).max(80),
  email:       z.string().email(),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  role:        z.enum(['creator', 'absorber']),
  accountType: z.enum(['individual', 'business']).default('individual'),
  phone:       z.string().optional(),
  country:     z.string().min(2).max(60).optional(),
});

/**
 * POST /api/auth/register
 * Registers a new creator or absorber, hashes password, sends OTP email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return err('Validation failed', 422, parsed.error.flatten());
    }

    const { name, email, password, role, accountType, phone, country } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return err('An account with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      accountType,
      phone,
      country,
      status: 'pending_verification',
    });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await Otp.create({
      userId:    user._id,
      code:      otpCode,
      type:      'email_verification',
      expiresAt,
    });

    // Fire and forget — don't let email errors block registration
    sendOtpEmail(email, otpCode, 'email_verification').catch(console.error);

    // Return user without password
    const safeUser = {
      id:          user._id.toString(),
      name:        user.name,
      email:       user.email,
      role:        user.role,
      accountType: user.accountType,
      status:      user.status,
    };

    return ok(
      { user: safeUser, message: 'Registration successful. Please verify your email.' },
      201
    );
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return err('Internal server error', 500);
  }
}
