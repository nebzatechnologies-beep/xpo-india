import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';
import { triggerN8nEventBackground } from '@/lib/integrations/n8n/emit';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { gateway = 'razorpay', razorpay_order_id, paypal_order_id, isAutoPay = true } = body;

    const orderId = razorpay_order_id || paypal_order_id || `ord_${Date.now()}`;
    const paymentId = `${gateway === 'razorpay' ? 'pay_rzp_live' : 'PP-PAY-CAPTURED'}-${Date.now()}`;

    let paymentRecord: any;

    const existing = xpoStore.payments.find((p: any) => p.gatewayOrderId === orderId);
    if (existing) {
      existing.status = 'captured';
      existing.gatewayPaymentId = paymentId;
      paymentRecord = existing;
    } else {
      paymentRecord = {
        _id: `pay_${Date.now()}`,
        user: {
          _id: session?.user?.id || '67489a12bcde345678900002',
          name: session?.user?.name || 'Verified Member',
          email: session?.user?.email || 'user@xpoindia.com',
        },
        plan: xpoStore.plans[0],
        gateway,
        type: isAutoPay ? 'subscription' : 'one_time',
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        amount: gateway === 'razorpay' ? 999 : 49,
        currency: gateway === 'razorpay' ? 'INR' : 'USD',
        status: 'captured',
        metadata: { isAutoPay },
        createdAt: new Date().toISOString(),
      };
      xpoStore.payments.unshift(paymentRecord);
    }

    // Trigger n8n events: payment.captured and subscription.activated
    triggerN8nEventBackground('payment.captured', {
      paymentId: paymentRecord._id,
      gatewayPaymentId: paymentRecord.gatewayPaymentId,
      gatewayOrderId: paymentRecord.gatewayOrderId,
      gateway: paymentRecord.gateway,
      user: paymentRecord.user,
      plan: paymentRecord.plan,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      type: paymentRecord.type,
      createdAt: paymentRecord.createdAt,
    });

    triggerN8nEventBackground('subscription.activated', {
      paymentId: paymentRecord._id,
      user: paymentRecord.user,
      planName: paymentRecord.plan?.name || 'Standard Plan',
      activatedAt: new Date().toISOString(),
      gateway: paymentRecord.gateway,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      paymentId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}