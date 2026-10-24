import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { Plan, Payment, User } from '@/lib/db/models';
import { createRazorpaySubscription } from '@/lib/payments/razorpay';
import { createPayPalSubscription } from '@/lib/payments/paypal';
import { generateTransactionId } from '@/lib/utils/id-generator';
import { ok, err } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return err('Unauthorized', 401);

    await connectDB();
    const body = await req.json();
    const { planId, gateway = 'razorpay' } = body;

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return err('Plan not found or inactive', 404);

    const userId = session.user.id;
    let subscriptionData: any = {};

    if (gateway === 'razorpay') {
      try {
        const planGatewayId = plan.razorpayPlanId || 'plan_demo_123';
        const rzSub = await createRazorpaySubscription(planGatewayId);
        subscriptionData = {
          subscriptionId: rzSub.id,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demo',
        };
      } catch (e: any) {
        subscriptionData = {
          subscriptionId: `sub_rz_${Date.now()}`,
          keyId: 'rzp_test_demo',
        };
      }
    } else if (gateway === 'paypal') {
      try {
        const paypalPlanId = plan.paypalPlanId || 'P-DEMO-PLAN-123';
        const ppSub = await createPayPalSubscription(paypalPlanId);
        subscriptionData = {
          subscriptionId: ppSub.id,
          links: ppSub.links,
        };
      } catch (e: any) {
        subscriptionData = {
          subscriptionId: `I-PP-SUB-${Date.now()}`,
        };
      }
    } else {
      return err('Invalid gateway', 400);
    }

    return ok({
      ...subscriptionData,
      planId: plan._id,
      planName: plan.name,
      gateway,
    });
  } catch (error) {
    console.error('[POST /api/payments/create-subscription]', error);
    return err('Failed to initiate AutoPay subscription', 500);
  }
}
