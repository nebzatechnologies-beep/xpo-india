import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { cancelPayPalAutoPaySubscription } from '@/lib/billing/paypal-subscriptions';
import { cancelRazorpayAutoPaySubscription } from '@/lib/billing/razorpay-subscriptions';
import { requireFirestore } from '@/lib/firebase/admin';
import {
  ForbiddenError,
  handleApiError,
  jsonOk,
  NotFoundError,
} from '@/lib/utils/api-handler';
import type { UserSubscription } from '@/lib/types/domain';

const cancelSchema = z.object({
  subscriptionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = cancelSchema.parse(await request.json());
    const db = requireFirestore();

    const ref = db.collection('subscriptions').doc(body.subscriptionId);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Subscription record not found');

    const sub = snap.data() as UserSubscription;
    if (!session.user.isSuperadmin && sub.uid !== session.uid) {
      throw new ForbiddenError('You can only cancel subscriptions belonging to your account.');
    }

    if (sub.gateway === 'razorpay') {
      const cancelAtCycleEnd = sub.status === 'active';
      await cancelRazorpayAutoPaySubscription(sub.gatewaySubscriptionId, cancelAtCycleEnd);
    } else {
      await cancelPayPalAutoPaySubscription(sub.gatewaySubscriptionId);
    }

    const nowIso = new Date().toISOString();
    await ref.set(
      {
        status: 'cancelled',
        autoPayAuthorized: false,
        cancelledAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return jsonOk({ subscription: (await ref.get()).data() });
  } catch (err) {
    return handleApiError(err);
  }
}
