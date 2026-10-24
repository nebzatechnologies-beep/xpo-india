import crypto from 'crypto';

function randomChars(chars: string, length: number): string {
  const arr = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    const buf = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) arr[i] = buf[i];
  }
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

const ALPHA_NUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const NUM = '0123456789';

export function generateLeadId(): string { return 'XPO-' + randomChars(ALPHA_NUM, 5); }
export function generateTransactionId(): string { return 'TXN-' + randomChars(ALPHA_NUM, 8); }
export function generateInvoiceNumber(): string { return 'INV-' + randomChars(NUM, 8); }
export function generateTicketId(): string { return 'TKT-' + randomChars(ALPHA_NUM, 6); }
