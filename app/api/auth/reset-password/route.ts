import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import { Otp } from '@/lib/db/models/Otp';
import { ok, err } from '@/lib/utils/api-response';

const ResetPasswordSchema = z.object({
  userId:      z.string().min(1),
  code:        z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/reset-password
 * Verifies a password_reset OTP then replaces the user's hashed password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return err('Validation failed', 422, parsed.error.flatten());
    }

    const { userId, code, newPassword } = parsed.data;

    await connectDB();

    const otp = await Otp.findOne({
      userId,
      type:      'password_reset',
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) return err('Invalid or expired reset code.', 400);

    otp.attempts += 1;
    if (otp.attempts > 5) {
      await otp.save();
      return err('Too many attempts. Please request a new code.', 429);
    }

    if (otp.code !== code) {
      await otp.save();
      return err('Incorrect code.', 400);
    }

    otp.used = true;
    await otp.save();

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });

    return ok({ message: 'Password reset successfully. Please sign in.' });
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error);
    return err('Internal server error', 500);
  }
}
