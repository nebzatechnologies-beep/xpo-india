import crypto from 'crypto';

/**
 * Generate HMAC SHA-256 signature for outbound webhooks
 */
export function generateHmacSignature(payload: string, secret: string): string {
  if (!secret) return '';
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Verify inbound API key in constant time to prevent timing attacks
 */
export function verifyInboundApiKey(providedKey: string | null | undefined, expectedKey: string): boolean {
  if (!providedKey || !expectedKey) return false;
  
  // Clean bearer prefix if passed
  const cleanProvided = providedKey.replace(/^Bearer\s+/i, '').trim();
  const cleanExpected = expectedKey.replace(/^Bearer\s+/i, '').trim();

  if (cleanProvided.length !== cleanExpected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanProvided, 'utf8'),
      Buffer.from(cleanExpected, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Helper to generate secure random strings for secret & API keys
 */
export function generateRandomKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
