import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireFirestore, ServiceConfigurationError } from '@/lib/firebase/admin';
import { getRazorpayCredentials } from '@/lib/services/credentials';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { generateDocId } from '@/lib/utils/id-generator';
import type { CustomerRole, RazorpayCredentials, UserSubscription } from '@/lib/types/domain';

export async function getRazorpayRuntimeClient(): Promise<{
  client: Razorpay;
  keyId: string;
  creds: RazorpayCredentials;
}> {
  const creds = await getRazorpayCredentials();
  if (!creds.keyId || !creds.keySecret) {
    throw new ServiceConfigurationError(
      'razorpay',
      'Razorpay live credentials (Key ID, Key Secret) are not configured yet in Admin Settings.'
    );
  }
  return {
    client: new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret }),
    keyId: creds.keyId,
    creds,
  };
}

export async function verifyRazorpayWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | null
): Promise<boolean> {
  const creds = await getRazorpayCredentials();
  const secret = creds.webhookSecret;
  if (!secret) {
    throw new ServiceConfigurationError(
      'razorpay-webhook',
      'RAZORPAY_WEBHOOK_SECRET is required to verify Razorpay subscription webhooks.'
    );
  }
  if (!signatureHeader) return false;

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expectedHex, 'utf8');
  const b = Buffer.from(signatureHeader.trim(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createRazorpayAutoPaySubscription(params: {
  uid: string;
  role: CustomerRole;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<{
  subscription: UserSubscription;
  keyId: string;
  gatewaySubscriptionId: string;
  shortUrl?: string;
}> {
  const { client, keyId, creds } = await getRazorpayRuntimeClient();
  const settings = await getPlatformSettings();

  const planId = params.role === 'partner' ? creds.partnerPlanId : creds.clientPlanId;

  if (!planId) {
    throw new ServiceConfigurationError(
      'razorpay-plan',
      `Razorpay Plan ID for ${params.role} (RAZORPAY_${params.role.toUpperCase()}_PLAN_ID) is not configured yet in Admin Settings.`
    );
  }

  const createPayload: Record<string, unknown> = {
    plan_id: planId,
    total_count: 120,
    quantity: 1,
    customer_notify: 1,
    notes: {
      uid: params.uid,
      role: params.role,
      platform: 'XPO',
    },
  };

  if (params.customerEmail || params.customerPhone) {
    createPayload.notify_info = {
      ...(params.customerEmail ? { notify_email: params.customerEmail } : {}),
      ...(params.customerPhone ? { notify_phone: params.customerPhone } : {}),
    };
  }

  const rzpSub = (await client.subscriptions.create(createPayload as any)) as {
    id: string;
    short_url?: string;
  };

  const db = requireFirestore();
  const nowIso = new Date().toISOString();
  const periodEndIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subDocId = generateDocId('sub');

  const amountMonthly =
    params.role === 'partner'
      ? settings.subscriptions.partnerInrMonthlyPrice
      : settings.subscriptions.clientInrMonthlyPrice;

  const monthlyAllowance =
    params.role === 'partner'
      ? settings.subscriptions.partnerPaidMonthlyClaims
      : settings.subscriptions.clientPaidMonthlyPartnerViews;

  const unlimitedAllowance =
    params.role === 'partner'
      ? Boolean(settings.subscriptions.partnerPlanUnlimited)
      : Boolean(settings.subscriptions.clientPlanUnlimited);

  const subDoc: UserSubscription = {
    id: subDocId,
    uid: params.uid,
    role: params.role,
    gateway: 'razorpay',
    currency: 'INR',
    amountMonthly,
    gatewayPlanId: planId,
    gatewaySubscriptionId: rzpSub.id,
    status: 'pending_mandate',
    autoPayAuthorized: false,
    monthlyAllowance,
    unlimitedAllowance,
    currentPeriodStart: nowIso,
    currentPeriodEnd: periodEndIso,
    taxRatePercent: settings.subscriptions.gstPercentInr,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await db.collection('subscriptions').doc(subDocId).set(subDoc);

  return {
    subscription: subDoc,
    keyId,
    gatewaySubscriptionId: rzpSub.id,
    shortUrl: rzpSub.short_url,
  };
}

export async function cancelRazorpayAutoPaySubscription(
  gatewaySubscriptionId: string,
  cancelAtCycleEnd = false
): Promise<void> {
  const { client } = await getRazorpayRuntimeClient();
  try {
    await client.subscriptions.cancel(gatewaySubscriptionId, cancelAtCycleEnd);
  } catch (err) {
    if (cancelAtCycleEnd) {
      await client.subscriptions.cancel(gatewaySubscriptionId, false);
    } else {
      throw err;
    }
  }
}
