import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

/**
 * Returns a singleton Razorpay client. Lazily initialised to avoid
 * import-time failure when env vars are not set (e.g. in tests).
 */
export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

interface RazorpayOrderOptions {
  amount:   number; // in paise
  currency: string;
  receipt:  string;
  notes?:   Record<string, string>;
}

/**
 * Creates a Razorpay order for one-time payment.
 */
export async function createRazorpayOrder(options: RazorpayOrderOptions) {
  const rz = getRazorpay();
  return rz.orders.create({
    amount:   options.amount,
    currency: options.currency,
    receipt:  options.receipt,
    notes:    options.notes,
  });
}

/**
 * Creates a Razorpay auto-pay subscription.
 */
export async function createRazorpaySubscription(planId: string, totalCount = 12) {
  const rz = getRazorpay();
  return rz.subscriptions.create({
    plan_id:     planId,
    total_count: totalCount,
  });
}

/**
 * Verifies an HMAC-SHA256 Razorpay webhook signature.
 * @throws if signature is invalid.
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expected === signature;
}
