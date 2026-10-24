import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import { Otp } from '@/lib/db/models/Otp';
import { sendOtpEmail } from '@/lib/email/mailer';
import { ok, err } from '@/lib/utils/api-response';

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot-password
 * Sends a password reset OTP to the provided email (if account exists).
 * Always returns 200 to prevent user enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return err('Validation failed', 422, parsed.error.flatten());
    }

    const { email } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    // Always respond with success to prevent user enumeration
    if (!user) {
      return ok({ message: 'If an account exists, a reset code has been sent.' });
    }

    // Rate limit: max 3 in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Otp.countDocuments({
      userId:    user._id,
      type:      'password_reset',
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= 3) {
      return ok({ message: 'If an account exists, a reset code has been sent.' });
    }

    // Invalidate existing reset OTPs
    await Otp.updateMany(
      { userId: user._id, type: 'password_reset', used: false },
      { $set: { used: true } }
    );

    const otpCode   = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await Otp.create({
      userId:    user._id,
      code:      otpCode,
      type:      'password_reset',
      expiresAt,
    });

    sendOtpEmail(user.email, otpCode, 'password_reset').catch(console.error);

    return ok({ message: 'If an account exists, a reset code has been sent.' });
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error);
    return err('Internal server error', 500);
  }
}
