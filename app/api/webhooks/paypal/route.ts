import { NextResponse, type NextRequest } from 'next/server';
import {
  activateOrRenewSubscriptionFromWebhook,
  recordSubscriptionStateWebhook,
} from '@/lib/billing/entitlements';
import { verifyPayPalWebhookSignature } from '@/lib/billing/paypal-subscriptions';
import { handleApiError } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    const eventJson = JSON.parse(rawText) as {
      id: string;
      event_type: string;
      resource?: {
        id?: string;
        billing_agreement_id?: string;
        billing_info?: {
          next_billing_time?: string;
        };
        amount?: {
          total?: string;
          value?: string;
          currency?: string;
          currency_code?: string;
        };
      };
    };

    const verified = await verifyPayPalWebhookSignature({
      transmissionId: request.headers.get('paypal-transmission-id'),
      transmissionTime: request.headers.get('paypal-transmission-time'),
      certUrl: request.headers.get('paypal-cert-url'),
      authAlgo: request.headers.get('paypal-auth-algo'),
      transmissionSig: request.headers.get('paypal-transmission-sig'),
      webhookEvent: eventJson as unknown as Record<string, unknown>,
    });

    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'Invalid PayPal webhook cryptographic signature' },
        { status: 401 }
      );
    }

    const eventType = eventJson.event_type;
    const gatewaySubId =
      eventType === 'PAYMENT.SALE.COMPLETED'
        ? eventJson.resource?.billing_agreement_id
        : eventJson.resource?.id;

    if (!gatewaySubId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (
      eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
      eventType === 'PAYMENT.SALE.COMPLETED'
    ) {
      const amountRaw =
        eventJson.resource?.amount?.total || eventJson.resource?.amount?.value;
      const amountUsd = amountRaw ? Number(amountRaw) : undefined;
      const nextBillingIso = eventJson.resource?.billing_info?.next_billing_time;

      await activateOrRenewSubscriptionFromWebhook({
        eventId: `pp_${eventJson.id}`,
        gateway: 'paypal',
        eventType,
        gatewaySubscriptionId: gatewaySubId,
        amountCaptured: amountUsd,
        currency: 'USD',
        periodEndIso: nextBillingIso,
        rawSummary: { resourceId: eventJson.resource?.id || null },
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      await recordSubscriptionStateWebhook({
        eventId: `pp_${eventJson.id}`,
        gateway: 'paypal',
        eventType,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'past_due',
        rawSummary: {},
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      await recordSubscriptionStateWebhook({
        eventId: `pp_${eventJson.id}`,
        gateway: 'paypal',
        eventType,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'cancelled',
        rawSummary: {},
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      await recordSubscriptionStateWebhook({
        eventId: `pp_${eventJson.id}`,
        gateway: 'paypal',
        eventType,
        gatewaySubscriptionId: gatewaySubId,
        nextStatus: 'expired',
        rawSummary: {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
