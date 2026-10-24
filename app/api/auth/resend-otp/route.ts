import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import { Otp } from '@/lib/db/models/Otp';
import { sendOtpEmail } from '@/lib/email/mailer';
import { ok, err } from '@/lib/utils/api-response';

const ResendSchema = z.object({
  userId: z.string().min(1),
  type:   z.enum(['email_verification', 'phone_verification', 'password_reset', 'login']),
});

/** Max OTP requests per hour per user per type */
const RATE_LIMIT = 3;

/**
 * POST /api/auth/resend-otp
 * Resends an OTP with rate limiting (max 3 per hour per user per type).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResendSchema.safeParse(body);
    if (!parsed.success) {
      return err('Validation failed', 422, parsed.error.flatten());
    }

    const { userId, type } = parsed.data;

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return err('User not found.', 404);

    // Rate limit: count OTPs in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Otp.countDocuments({
      userId,
      type,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= RATE_LIMIT) {
      return err(`You can only request ${RATE_LIMIT} OTPs per hour. Please try again later.`, 429);
    }

    // Invalidate any existing unused OTPs of the same type
    await Otp.updateMany(
      { userId, type, used: false },
      { $set: { used: true } }
    );

    const otpCode   = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await Otp.create({ userId, code: otpCode, type, expiresAt });

    if (type === 'email_verification' || type === 'password_reset') {
      sendOtpEmail(user.email, otpCode, type).catch(console.error);
    }

    return ok({ message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('[POST /api/auth/resend-otp]', error);
    return err('Internal server error', 500);
  }
}
