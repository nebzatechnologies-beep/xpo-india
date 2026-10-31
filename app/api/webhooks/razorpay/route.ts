import { NextResponse, type NextRequest } from 'next/server';
import {
  activateOrRenewSubscriptionFromWebhook,
  recordSubscriptionStateWebhook,
} from '@/lib/billing/entitlements';
import { verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay-subscriptions';
import { handleApiError } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBuffer = Buffer.from(await request.arrayBuffer());
    const signature = request.headers.get('x-razorpay-signature');
    const eventIdHeader = request.headers.get('x-razorpay-event-id');

    const verified = await verifyRazorpayWebhookSignature(rawBuffer, signature);
    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'Invalid X-Razorpay-Signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBuffer.toString('utf8')) as {
      event: string;
      payload?: {
        subscription?: {
          entity?: {
            id?: string;
            current_start?: number;
            current_end?: number;
            status?: string;
          };
        };
        payment?: {
          entity?: {
            id?: string;
            amount?: number;
            currency?: string;
          };
        };
      };
    };

    const subEntity = body.payload?.subscription?.entity;
    const payEntity = body.payload?.payment?.entity;
    const gatewaySubId = subEntity?.id;

    if (!gatewaySubId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const eventId =
      eventIdHeader || `rzp_${body.event}_${gatewaySubId}_${payEntity?.id || Date.now()}`;

    if (
      body.event === 'subscription.authenticated' ||
      body.event === 'subscription.activated' ||
      body.event === 'subscription.charged'
    ) {
      const periodStartIso = subEntity?.current_start
        ? new Date(subEntity.current_start * 1000).toISOString()
        : undefined;
      const periodEndIso = subEntity?.current_end
        ? new Date(subEntity.current_end * 1000).toISOString()
        : undefined;
      const amountInr = payEntity?.amount ? payEntity.amount / 100 : undefined;

      await activateOrRenewSubscriptionFromWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: body.event,
        gatewaySubscriptionId: gatewaySubId,
        amountCaptured: amountInr,
        currency: 'INR',
        periodStartIso,
        periodEndIso,
        rawSummary: {
          razorpayPaymentId: payEntity?.id || null,
          razorpaySubStatus: subEntity?.status || null,
        },
      });
    } else if (
      body.event === 'subscription.halted' ||
      body.event === 'subscription.pending' ||
      body.event === 'subscription.paused'
    ) {
      await recordSubscriptionStateWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: body.event,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'past_due',
        rawSummary: { status: subEntity?.status },
      });
    } else if (body.event === 'subscription.resumed') {
      await recordSubscriptionStateWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: body.event,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'active',
        rawSummary: { status: subEntity?.status },
      });
    } else if (body.event === 'subscription.cancelled') {
      await recordSubscriptionStateWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: body.event,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'cancelled',
        rawSummary: { status: subEntity?.status },
      });
    } else if (body.event === 'subscription.completed') {
      await recordSubscriptionStateWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: body.event,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'expired',
        rawSummary: { status: subEntity?.status },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
