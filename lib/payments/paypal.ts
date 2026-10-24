/** PayPal REST API v2 client (no SDK needed - uses fetch). */

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Fetches a PayPal OAuth2 access token using client credentials.
 */
async function getAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

/**
 * Creates a PayPal order for one-time payment.
 */
export async function createPayPalOrder(amount: number, currency: string, description: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount:      { currency_code: currency, value: (amount / 100).toFixed(2) },
          description,
        },
      ],
    }),
  });
  return res.json();
}

/**
 * Creates a PayPal billing subscription for a plan.
 */
export async function createPayPalSubscription(paypalPlanId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_id: paypalPlanId }),
  });
  return res.json();
}

/**
 * Verifies a PayPal webhook event against PayPal's cert API.
 * Returns true if valid.
 */
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const token = await getAccessToken();

  const verifyPayload = {
    auth_algo:         headers['paypal-auth-algo'],
    cert_url:          headers['paypal-cert-url'],
    transmission_id:   headers['paypal-transmission-id'],
    transmission_sig:  headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id:        process.env.PAYPAL_WEBHOOK_ID!,
    webhook_event:     JSON.parse(rawBody),
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyPayload),
  });

  const data = await res.json() as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
