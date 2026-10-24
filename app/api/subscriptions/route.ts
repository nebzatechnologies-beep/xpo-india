import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { Subscription } from '@/lib/db/models';
import { ok, err } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return err('Unauthorized', 401);

    await connectDB();
    const userId = session.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      currentPeriodEnd: { $gt: new Date() },
    })
      .populate('plan')
      .lean();

    return ok({
      hasActiveSubscription: Boolean(subscription),
      subscription: subscription || null,
    });
  } catch (error) {
    console.error('[GET /api/subscriptions]', error);
    return err('Failed to fetch subscription', 500);
  }
}
