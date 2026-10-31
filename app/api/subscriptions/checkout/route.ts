import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { createPayPalAutoPaySubscription } from '@/lib/billing/paypal-subscriptions';
import { createRazorpayAutoPaySubscription } from '@/lib/billing/razorpay-subscriptions';
import { ForbiddenError, handleApiError, jsonOk } from '@/lib/utils/api-handler';

const checkoutSchema = z.object({
  role: z.enum(['client', 'partner']).optional(),
  gateway: z.enum(['razorpay', 'paypal']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = checkoutSchema.parse(await request.json());

    if (!session.user.isSuperadmin && body.role && body.role !== session.user.role) {
      throw new ForbiddenError(
        'You can only purchase a subscription plan matching your account role.'
      );
    }

    const targetRole = (
      session.user.isSuperadmin ? body.role || 'client' : session.user.role
    ) as 'client' | 'partner';

    const preferredGateway =
      body.gateway || (session.user.billingCurrency === 'INR' ? 'razorpay' : 'paypal');

    if (preferredGateway === 'razorpay') {
      const rzp = await createRazorpayAutoPaySubscription({
        uid: session.uid,
        role: targetRole,
        customerEmail: session.user.email,
        customerPhone: session.user.phoneE164,
      });
      return jsonOk(rzp, 201);
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
    const pp = await createPayPalAutoPaySubscription({
      uid: session.uid,
      role: targetRole,
      returnUrl: `${appUrl}/dashboard/subscription?gateway=paypal&status=returned`,
      cancelUrl: `${appUrl}/dashboard/subscription?gateway=paypal&status=cancelled`,
    });
    return jsonOk(pp, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
