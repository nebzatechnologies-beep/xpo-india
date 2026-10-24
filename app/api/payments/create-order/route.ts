import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { planId, gateway = 'razorpay', isAutoPay = true } = body;

    const plan = xpoStore.plans.find((p: any) => p._id === planId || p.slug === planId) || xpoStore.plans[0];
    const orderId = `${gateway === 'razorpay' ? 'order_rzp' : 'PP-ORD'}_${Date.now()}`;

    const pendingPayment = {
      _id: `pay_${Date.now()}`,
      user: {
        _id: session?.user?.id || '67489a12bcde345678900002',
        name: session?.user?.name || 'Verified Member',
        email: session?.user?.email || 'user@xpoindia.com',
      },
      plan,
      gateway,
      type: isAutoPay ? ('subscription' as const) : ('one_time' as const),
      gatewayOrderId: orderId,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending' as const,
      metadata: { isAutoPay, planName: plan.name },
      createdAt: new Date().toISOString(),
    };

    xpoStore.payments.unshift(pendingPayment);

    return NextResponse.json({
      success: true,
      orderId,
      amount: plan.price,
      currency: plan.currency,
      keyId: gateway === 'razorpay' ? 'rzp_test_demo123' : 'pp_client_demo123',
      plan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}