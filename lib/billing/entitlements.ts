import { requireFirestore } from '@/lib/firebase/admin';
import { createPayPalAutoPaySubscription } from '@/lib/billing/paypal-subscriptions';
import { createRazorpayAutoPaySubscription } from '@/lib/billing/razorpay-subscriptions';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getUserByUid } from '@/lib/services/users';
import { NotFoundError } from '@/lib/utils/api-handler';
import { generateDocId, generateInvoiceNumber } from '@/lib/utils/id-generator';
import { dispatchOutboundWhatsApp } from '@/lib/whatsapp/notification-service';
import type {
  BillingCurrency,
  ClientRoleProfile,
  CustomerRole,
  EntitlementLedgerEntry,
  PartnerRoleProfile,
  PaymentEventRecord,
  PaymentGateway,
  UserSubscription,
} from '@/lib/types/domain';

/**
 * Generates a live Razorpay AutoPay `short_url` (INR) or PayPal `approvalUrl` (USD)
 * for WhatsApp / AI Agent paywall delivery, falling back cleanly to `/dashboard/subscription`
 * if live gateway credentials have not been configured yet.
 */
export async function resolveInstantCheckoutUrlForUser(params: {
  uid: string;
  role: CustomerRole;
  appOrigin?: string;
}): Promise<{ checkoutUrl: string; priceLabel: string; allowanceLabel: string }> {
  const settings = await getPlatformSettings();
  const user = await getUserByUid(params.uid);
  const appUrl = (
    params.appOrigin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');

  const isInr = !user || user.billingCurrency === 'INR';
  const priceLabel =
    params.role === 'partner'
      ? isInr
        ? `₹${settings.subscriptions.partnerInrMonthlyPrice}/month`
        : `$${settings.subscriptions.partnerUsdMonthlyPrice}/month`
      : isInr
        ? `₹${settings.subscriptions.clientInrMonthlyPrice}/month`
        : `$${settings.subscriptions.clientUsdMonthlyPrice}/month`;

  const allowanceLabel =
    params.role === 'partner'
      ? settings.subscriptions.partnerPlanUnlimited
        ? 'unlimited lead applications/month'
        : `${settings.subscriptions.partnerPaidMonthlyClaims} lead applications/month`
      : settings.subscriptions.clientPlanUnlimited
        ? 'unlimited Partner profile views/month'
        : `${settings.subscriptions.clientPaidMonthlyPartnerViews} Partner profile views/month`;

  try {
    if (isInr) {
      const rzp = await createRazorpayAutoPaySubscription({
        uid: params.uid,
        role: params.role,
        customerEmail: user?.email,
        customerPhone: user?.phoneE164,
      });
      if (rzp.shortUrl) {
        return { checkoutUrl: rzp.shortUrl, priceLabel, allowanceLabel };
      }
    } else {
      const pp = await createPayPalAutoPaySubscription({
        uid: params.uid,
        role: params.role,
        returnUrl: `${appUrl}/dashboard/subscription?gateway=paypal&status=returned`,
        cancelUrl: `${appUrl}/dashboard/subscription?gateway=paypal&status=cancelled`,
      });
      if (pp.approvalUrl) {
        return { checkoutUrl: pp.approvalUrl, priceLabel, allowanceLabel };
      }
    }
  } catch {
    // Fall back to authenticated web subscription checkout page when gateway keys are unconfigured
  }

  return {
    checkoutUrl: `${appUrl}/dashboard/subscription`,
    priceLabel,
    allowanceLabel,
  };
}

/**
 * Strictly server-side, idempotent AutoPay activation & monthly renewal handler
 * for both Partner Plan (`role: 'partner'`) and Client Plan (`role: 'client'`).
 * Triggered ONLY by cryptographically verified Razorpay or PayPal webhooks!
 */
export async function activateOrRenewSubscriptionFromWebhook(params: {
  eventId: string;
  gateway: PaymentGateway;
  eventType: string;
  gatewaySubscriptionId: string;
  amountCaptured?: number;
  currency?: BillingCurrency;
  periodStartIso?: string;
  periodEndIso?: string;
  rawSummary: Record<string, unknown>;
}): Promise<{ alreadyProcessed: boolean; subscription?: UserSubscription }> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const subQuery = await db
    .collection('subscriptions')
    .where('gatewaySubscriptionId', '==', params.gatewaySubscriptionId)
    .limit(1)
    .get();

  if (subQuery.empty) {
    throw new NotFoundError(
      `Subscription with gateway ID ${params.gatewaySubscriptionId} not found in Firestore`
    );
  }

  const subDocRef = subQuery.docs[0]!.ref;
  let alreadyProcessed = false;
  let updatedSub!: UserSubscription;

  await db.runTransaction(async (tx) => {
    const evtRef = db.collection('payment_events').doc(params.eventId);
    const evtSnap = await tx.get(evtRef);
    if (evtSnap.exists) {
      alreadyProcessed = true;
      return;
    }

    const subSnap = await tx.get(subDocRef);
    const sub = subSnap.data() as UserSubscription;

    const profRef = db.collection('role_profiles').doc(`${sub.uid}_${sub.role}`);
    const profSnap = await tx.get(profRef);

    const isPartner = sub.role === 'partner';
    const allowance = isPartner
      ? settings.subscriptions.partnerPaidMonthlyClaims
      : settings.subscriptions.clientPaidMonthlyPartnerViews;
    const isUnlimited = isPartner
      ? Boolean(settings.subscriptions.partnerPlanUnlimited)
      : Boolean(settings.subscriptions.clientPlanUnlimited);

    const rollover = settings.subscriptions.unusedPaidAllowanceRollover;
    const periodStart = params.periodStartIso || nowIso;
    const periodEnd =
      params.periodEndIso || new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString();

    const baseAmount = params.amountCaptured ?? sub.amountMonthly;
    const taxAmount =
      sub.currency === 'INR'
        ? Number(((baseAmount * sub.taxRatePercent) / (100 + sub.taxRatePercent)).toFixed(2))
        : 0;

    const paymentEvt: PaymentEventRecord = {
      id: params.eventId,
      gateway: params.gateway,
      eventType: params.eventType,
      subscriptionId: sub.id,
      uid: sub.uid,
      role: sub.role,
      currency: params.currency || sub.currency,
      amount: baseAmount,
      taxAmount,
      status: 'captured',
      invoiceNumber: generateInvoiceNumber(),
      rawSummary: params.rawSummary,
      verifiedSignature: true,
      occurredAt: nowIso,
    };

    const wasAlreadyActive = sub.status === 'active';

    updatedSub = {
      ...sub,
      status: 'active',
      autoPayAuthorized: true,
      monthlyAllowance: allowance,
      unlimitedAllowance: isUnlimited,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      lastPaymentEventId: params.eventId,
      updatedAt: nowIso,
    };

    tx.set(evtRef, paymentEvt);
    tx.set(subDocRef, updatedSub);

    if (profSnap.exists) {
      if (isPartner) {
        const p = profSnap.data() as PartnerRoleProfile;
        const nextPaid = rollover ? (p.paidClaimsRemaining || 0) + allowance : allowance;
        tx.set(
          profRef,
          {
            paidClaimsRemaining: nextPaid,
            paidClaimsUnlimited: isUnlimited,
            activeSubscriptionId: sub.id,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        const ledId = generateDocId('led');
        const ledEntry: EntitlementLedgerEntry = {
          id: ledId,
          uid: sub.uid,
          role: 'partner',
          eventType: wasAlreadyActive ? 'subscription_renewed' : 'subscription_activated',
          creditPool: isUnlimited ? 'unlimited' : 'paid',
          delta: allowance,
          balanceAfter: {
            freeRemaining: p.freeClaimsRemaining || 0,
            paidRemaining: nextPaid,
            unlimited: isUnlimited,
          },
          referenceId: sub.id,
          summary: `Partner Plan ${wasAlreadyActive ? 'renewed' : 'activated'} via ${params.gateway.toUpperCase()}`,
          createdAt: nowIso,
        };
        tx.set(db.collection('entitlement_ledger').doc(ledId), ledEntry);
      } else {
        const c = profSnap.data() as ClientRoleProfile;
        const nextPaid = rollover ? (c.paidPartnerViewsRemaining || 0) + allowance : allowance;
        tx.set(
          profRef,
          {
            paidPartnerViewsRemaining: nextPaid,
            paidViewsUnlimited: isUnlimited,
            activeSubscriptionId: sub.id,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        const ledId = generateDocId('led');
        const ledEntry: EntitlementLedgerEntry = {
          id: ledId,
          uid: sub.uid,
          role: 'client',
          eventType: wasAlreadyActive ? 'subscription_renewed' : 'subscription_activated',
          creditPool: isUnlimited ? 'unlimited' : 'paid',
          delta: allowance,
          balanceAfter: {
            freeRemaining: c.freePartnerViewsRemaining || 0,
            paidRemaining: nextPaid,
            unlimited: isUnlimited,
          },
          referenceId: sub.id,
          summary: `Client Plan ${wasAlreadyActive ? 'renewed' : 'activated'} via ${params.gateway.toUpperCase()}`,
          createdAt: nowIso,
        };
        tx.set(db.collection('entitlement_ledger').doc(ledId), ledEntry);
      }
    }
  });

  if (alreadyProcessed) {
    return { alreadyProcessed: true };
  }

  try {
    const user = await getUserByUid(updatedSub.uid);
    if (user?.phoneE164) {
      await db
        .collection('whatsapp_sessions')
        .doc(user.phoneE164)
        .set({ state: 'SUBSCRIBED', updatedAt: nowIso }, { merge: true });

      const quotaLabel = updatedSub.unlimitedAllowance
        ? 'Unlimited'
        : String(updatedSub.monthlyAllowance);
      const unitLabel =
        updatedSub.role === 'partner' ? 'valid lead applications' : 'Partner profile views';

      await dispatchOutboundWhatsApp({
        sessionId: user.phoneE164,
        phoneE164: user.phoneE164,
        messageType: 'text',
        body:
          `✅ *XPO ${updatedSub.role === 'partner' ? 'Partner' : 'Client'} Plan Activated!*\n\n` +
          `Your subscription is active until *${updatedSub.currentPeriodEnd.slice(0, 10)}*.\n` +
          `Monthly Allowance Unlocked: *${quotaLabel}* ${unitLabel}.`,
      });
    }
  } catch (err) {
    console.error('[Billing] Failed to send WhatsApp subscription confirmation:', err);
  }

  return { alreadyProcessed: false, subscription: updatedSub };
}

export async function recordSubscriptionStateWebhook(params: {
  eventId: string;
  gateway: PaymentGateway;
  eventType: string;
  gatewaySubscriptionId: string;
  nextStatus: 'active' | 'past_due' | 'cancelled' | 'expired';
  rawSummary: Record<string, unknown>;
}): Promise<void> {
  const db = requireFirestore();
  const nowIso = new Date().toISOString();

  const subQuery = await db
    .collection('subscriptions')
    .where('gatewaySubscriptionId', '==', params.gatewaySubscriptionId)
    .limit(1)
    .get();
  if (subQuery.empty) return;

  const subDocRef = subQuery.docs[0]!.ref;
  const sub = subQuery.docs[0]!.data() as UserSubscription;

  const evtRef = db.collection('payment_events').doc(params.eventId);
  const evtSnap = await evtRef.get();
  if (evtSnap.exists) return;

  const evt: PaymentEventRecord = {
    id: params.eventId,
    gateway: params.gateway,
    eventType: params.eventType,
    subscriptionId: sub.id,
    uid: sub.uid,
    role: sub.role,
    currency: sub.currency,
    amount: 0,
    taxAmount: 0,
    status: 'failed',
    rawSummary: params.rawSummary,
    verifiedSignature: true,
    occurredAt: nowIso,
  };

  const batch = db.batch();
  batch.set(evtRef, evt);
  batch.set(
    subDocRef,
    {
      status: params.nextStatus,
      ...(params.nextStatus === 'cancelled' ? { cancelledAt: nowIso } : {}),
      updatedAt: nowIso,
    },
    { merge: true }
  );

  if (params.nextStatus === 'expired') {
    const profRef = db.collection('role_profiles').doc(`${sub.uid}_${sub.role}`);
    batch.set(
      profRef,
      sub.role === 'partner'
        ? {
            paidClaimsRemaining: 0,
            paidClaimsUnlimited: false,
            activeSubscriptionId: null,
            updatedAt: nowIso,
          }
        : {
            paidPartnerViewsRemaining: 0,
            paidViewsUnlimited: false,
            activeSubscriptionId: null,
            updatedAt: nowIso,
          },
      { merge: true }
    );

    const ledId = generateDocId('led');
    const ledEntry: EntitlementLedgerEntry = {
      id: ledId,
      uid: sub.uid,
      role: sub.role,
      eventType: 'subscription_expired',
      creditPool: 'paid',
      delta: 0,
      balanceAfter: {
        freeRemaining: 0,
        paidRemaining: 0,
        unlimited: false,
      },
      referenceId: sub.id,
      summary: `${sub.role === 'partner' ? 'Partner' : 'Client'} Plan expired via ${params.gateway.toUpperCase()}`,
      createdAt: nowIso,
    };
    batch.set(db.collection('entitlement_ledger').doc(ledId), ledEntry);
  }

  await batch.commit();
}
