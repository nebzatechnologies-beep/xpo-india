import { type NextRequest } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { activateOrRenewSubscriptionFromWebhook } from '@/lib/billing/entitlements';
import { getRazorpayRuntimeClient } from '@/lib/billing/razorpay-subscriptions';
import { getPayPalCredentials, getRazorpayCredentials } from '@/lib/services/credentials';
import { requireFirestore } from '@/lib/firebase/admin';
import {
  BadRequestError,
  ForbiddenError,
  handleApiError,
  jsonOk,
  NotFoundError,
} from '@/lib/utils/api-handler';
import type { UserSubscription } from '@/lib/types/domain';

const verifySchema = z.object({
  gateway: z.enum(['razorpay', 'paypal']),
  subscriptionId: z.string().min(1),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = verifySchema.parse(await request.json());
    const db = requireFirestore();

    // Query by gatewaySubscriptionId or Firestore doc id
    let subSnap = await db
      .collection('subscriptions')
      .where('gatewaySubscriptionId', '==', body.subscriptionId)
      .limit(1)
      .get();

    if (subSnap.empty) {
      const docDirect = await db.collection('subscriptions').doc(body.subscriptionId).get();
      if (docDirect.exists) {
        subSnap = { empty: false, docs: [docDirect] } as unknown as typeof subSnap;
      }
    }

    if (subSnap.empty) {
      throw new NotFoundError(`Subscription '${body.subscriptionId}' not found.`);
    }

    const sub = subSnap.docs[0]!.data() as UserSubscription;
    if (!session.user.isSuperadmin && sub.uid !== session.uid) {
      throw new ForbiddenError('You can only verify subscriptions belonging to your account.');
    }

    if (sub.status === 'active') {
      return jsonOk({ ok: true, alreadyActive: true, subscription: sub });
    }

    let isVerified = false;
    let paymentAmount = sub.amountMonthly;

    if (body.gateway === 'razorpay') {
      const creds = await getRazorpayCredentials();

      if (body.paymentId && body.signature && creds.keySecret) {
        // Razorpay AutoPay signature format: payment_id + '|' + subscription_id
        const expected = crypto
          .createHmac('sha256', creds.keySecret)
          .update(`${body.paymentId}|${sub.gatewaySubscriptionId}`)
          .digest('hex');

        if (expected === body.signature.trim()) {
          isVerified = true;
        }
      }

      if (!isVerified && creds.keyId && creds.keySecret) {
        try {
          const { client } = await getRazorpayRuntimeClient();
          const rzpSub = (await client.subscriptions.fetch(sub.gatewaySubscriptionId)) as {
            status: string;
            paid_count?: number;
          };
          if (['active', 'authenticated', 'completed'].includes(rzpSub.status)) {
            isVerified = true;
          }
        } catch {
          // Cryptographic verification failed
        }
      }

      if (!isVerified) {
        throw new BadRequestError('Could not cryptographically verify Razorpay payment mandate.');
      }

      const eventId = `evt_client_rzp_${sub.gatewaySubscriptionId}_${Date.now()}`;
      const res = await activateOrRenewSubscriptionFromWebhook({
        eventId,
        gateway: 'razorpay',
        eventType: 'subscription.charged',
        gatewaySubscriptionId: sub.gatewaySubscriptionId,
        amountCaptured: paymentAmount,
        currency: 'INR',
        rawSummary: {
          clientVerification: true,
          paymentId: body.paymentId || null,
          verifiedAt: new Date().toISOString(),
        },
      });

      return jsonOk({ ok: true, subscription: res.subscription || sub });
    }

    if (body.gateway === 'paypal') {
      const creds = await getPayPalCredentials();

      if (creds.clientId && creds.clientSecret) {
        try {
          const baseUrl = creds.apiBaseUrl || 'https://api-m.paypal.com';
          const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
          const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
          });

          if (tokenRes.ok) {
            const tokenJson = (await tokenRes.json()) as { access_token: string };
            const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions/${sub.gatewaySubscriptionId}`, {
              headers: {
                Authorization: `Bearer ${tokenJson.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (subRes.ok) {
              const subJson = (await subRes.json()) as { status: string };
              if (['ACTIVE', 'APPROVED'].includes(subJson.status.toUpperCase())) {
                isVerified = true;
              }
            }
          }
        } catch {
          // PayPal API check failed
        }
      }

      if (!isVerified) {
        throw new BadRequestError('Could not verify PayPal subscription status with PayPal API.');
      }

      const eventId = `evt_client_pp_${sub.gatewaySubscriptionId}_${Date.now()}`;
      const res = await activateOrRenewSubscriptionFromWebhook({
        eventId,
        gateway: 'paypal',
        eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
        gatewaySubscriptionId: sub.gatewaySubscriptionId,
        amountCaptured: paymentAmount,
        currency: 'USD',
        rawSummary: {
          clientVerification: true,
          verifiedAt: new Date().toISOString(),
        },
      });

      return jsonOk({ ok: true, subscription: res.subscription || sub });
    }

    throw new BadRequestError('Unsupported gateway for verification.');
  } catch (err) {
    return handleApiError(err);
  }
}
