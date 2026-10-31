import { requireFirestore, ServiceConfigurationError } from '@/lib/firebase/admin';
import { getPayPalCredentials } from '@/lib/services/credentials';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { generateDocId } from '@/lib/utils/id-generator';
import type { CustomerRole, UserSubscription } from '@/lib/types/domain';

async function getPayPalAccessToken(): Promise<{ token: string; baseUrl: string }> {
  const creds = await getPayPalCredentials();
  const clientId = creds.clientId;
  const clientSecret = creds.clientSecret;
  const baseUrl = creds.apiBaseUrl || 'https://api-m.paypal.com';

  if (!clientId || !clientSecret) {
    throw new ServiceConfigurationError(
      'paypal',
      'PayPal live credentials (Client ID, Client Secret) are not configured yet in Admin Settings.'
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[PayPal] Failed to obtain live access token: ${errText}`);
  }

  const json = (await res.json()) as { access_token: string };
  return { token: json.access_token, baseUrl };
}

export async function createPayPalAutoPaySubscription(params: {
  uid: string;
  role: CustomerRole;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{
  subscription: UserSubscription;
  gatewaySubscriptionId: string;
  approvalUrl: string;
}> {
  const { token, baseUrl } = await getPayPalAccessToken();
  const creds = await getPayPalCredentials();
  const settings = await getPlatformSettings();

  const planId = params.role === 'partner' ? creds.partnerPlanId : creds.clientPlanId;

  if (!planId) {
    throw new ServiceConfigurationError(
      'paypal-plan',
      `PayPal Plan ID for ${params.role} (PAYPAL_${params.role.toUpperCase()}_PLAN_ID) is not configured yet in Admin Settings.`
    );
  }

  const res = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: `${params.uid}:${params.role}`,
      application_context: {
        brand_name: 'XPO Marketplace',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
    message?: string;
  };

  if (!res.ok || !data.id) {
    throw new Error(`[PayPal] Subscription creation failed: ${data.message || res.status}`);
  }

  const approvalUrl = data.links?.find((l) => l.rel === 'approve')?.href || '';
  const db = requireFirestore();
  const nowIso = new Date().toISOString();
  const periodEndIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subDocId = generateDocId('sub');

  const amountMonthly =
    params.role === 'partner'
      ? settings.subscriptions.partnerUsdMonthlyPrice
      : settings.subscriptions.clientUsdMonthlyPrice;

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
    gateway: 'paypal',
    currency: 'USD',
    amountMonthly,
    gatewayPlanId: planId,
    gatewaySubscriptionId: data.id,
    status: 'pending_mandate',
    autoPayAuthorized: false,
    monthlyAllowance,
    unlimitedAllowance,
    currentPeriodStart: nowIso,
    currentPeriodEnd: periodEndIso,
    taxRatePercent: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await db.collection('subscriptions').doc(subDocId).set(subDoc);

  return {
    subscription: subDoc,
    gatewaySubscriptionId: data.id,
    approvalUrl,
  };
}

export async function cancelPayPalAutoPaySubscription(
  gatewaySubscriptionId: string,
  reason = 'Customer cancelled recurring AutoPay from XPO Dashboard'
): Promise<void> {
  const { token, baseUrl } = await getPayPalAccessToken();
  const res = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${gatewaySubscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`[PayPal] Failed to cancel subscription: ${errText}`);
  }
}

export async function verifyPayPalWebhookSignature(params: {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
  webhookEvent: Record<string, unknown>;
}): Promise<boolean> {
  const creds = await getPayPalCredentials();
  const webhookId = creds.webhookId;
  if (!webhookId) {
    throw new ServiceConfigurationError(
      'paypal-webhook',
      'PAYPAL_WEBHOOK_ID is required to verify PayPal subscription webhooks.'
    );
  }

  if (
    !params.transmissionId ||
    !params.transmissionTime ||
    !params.certUrl ||
    !params.authAlgo ||
    !params.transmissionSig
  ) {
    return false;
  }

  const { token, baseUrl } = await getPayPalAccessToken();
  const res = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: webhookId,
      webhook_event: params.webhookEvent,
    }),
  });

  if (!res.ok) return false;
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === 'SUCCESS';
}
