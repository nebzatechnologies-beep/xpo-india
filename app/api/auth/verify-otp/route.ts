import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import { Otp } from '@/lib/db/models/Otp';
import { ok, err } from '@/lib/utils/api-response';

const VerifyOtpSchema = z.object({
  userId: z.string().min(1),
  code:   z.string().length(6),
  type:   z.enum(['email_verification', 'phone_verification', 'password_reset', 'login']),
});

/**
 * POST /api/auth/verify-otp
 * Verifies a one-time password, marks it used, and activates the user account or resets password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return err('Validation failed', 422, parsed.error.flatten());
    }

    const { userId, code, type } = parsed.data;

    await connectDB();

    const otp = await Otp.findOne({
      userId,
      type,
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return err('Invalid or expired OTP code.', 400);
    }

    // Increment attempts before comparing to prevent brute force
    otp.attempts += 1;
    if (otp.attempts > 5) {
      await otp.save();
      return err('Too many attempts. Please request a new OTP.', 429);
    }

    if (otp.code !== code) {
      await otp.save();
      return err('Incorrect OTP code.', 400);
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Mark the appropriate field as verified on the user
    const updateFields: Record<string, boolean | string> = {};
    if (type === 'email_verification') {
      updateFields.emailVerified = true;
      updateFields.status = 'active';
    } else if (type === 'phone_verification') {
      updateFields.phoneVerified = true;
    }

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: updateFields });
    }

    return ok({ verified: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('[POST /api/auth/verify-otp]', error);
    return err('Internal server error', 500);
  }
}
