/**
 * Demo XPO India WhatsApp Chatbot Redirect & Demo Meta Cloud API Credentials
 * Redirects any WhatsApp button click to the user's real WhatsApp client (wa.me)
 * pre-populated with a realistic Dummy XPO WhatsApp Chatbot prompt.
 */

export const DEMO_WA_BOT_PHONE = '919849000112';
export const DEMO_WA_BOT_DISPLAY = '+91 98490 00112';

export const DEMO_META_API_CREDS = {
  metaPhoneNumberId: '109482716503928',
  metaWabaId: '102938475610293',
  metaDisplayPhone: '+91 98490 00112',
  metaTokenMasked: 'EAAGm0PX4ZCpsBO7xK9demoXPOIndia2026CloudAPIToken99812',
  metaVerifyToken: 'xpo_india_webhook_secret_2026',
  webhookCallbackUrl: 'https://xpoindia.com/api/webhooks/whatsapp',
};

export type DemoBotRole = 'client' | 'partner' | 'general' | 'post_req' | 'wave_reply' | 'support';

export function getXpoWhatsAppBotUrl(
  mode: DemoBotRole = 'general',
  customText?: string,
  overridePhone?: string
): string {
  const digits = (overridePhone || DEMO_WA_BOT_PHONE).replace(/\D/g, '') || DEMO_WA_BOT_PHONE;

  if (customText && customText.trim()) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(customText.trim())}`;
  }

  let message = '';

  switch (mode) {
    case 'client':
    case 'post_req':
      message = [
        '🤖 *XPO India Dummy WhatsApp Chatbot — Client Flow*',
        '',
        'Hi XPO Assistant! I want to post a B2B requirement:',
        '• *Need:* 10,000 printed 3-ply corrugated boxes',
        '• *City:* Pune',
        '• *Timeline:* Within 2-4 Weeks',
        '• *Budget:* ₹1,80,000',
        '',
        'Please confirm my draft and dispatch Wave 1 (5-minute priority window) to the top 3 verified Partners!',
      ].join('\n');
      break;

    case 'partner':
    case 'wave_reply':
      message = [
        '🤖 *XPO India Dummy WhatsApp Chatbot — Partner Wave 1 Reply*',
        '',
        'Hi XPO Assistant! Replying to *Wave 1 Lead XPO-REQ-41208*:',
        '✓ *Action:* Interested · Send Quote (Uses 1 Reply Credit)',
        '• *Partner:* Klo Tech Pvt Ltd (GST Verified)',
        '• *Estimated Quote:* ₹1,72,000',
        '• *Delivery Timeline:* 10 Days',
        '• *Pitch:* We manufacture 3-ply corrugated boxes in Chakan MIDC with in-house flexo printing.',
      ].join('\n');
      break;

    case 'support':
      message = [
        '🤖 *XPO India Dummy WhatsApp Chatbot — Coordinator Support*',
        '',
        'SUPPORT — Hi XPO Coordinator Desk, I would like live assistance with my requirement / KYC verification.',
      ].join('\n');
      break;

    case 'general':
    default:
      message = [
        '🤖 *XPO India Dummy WhatsApp Chatbot*',
        '',
        'Hi XPO Assistant! Start my interactive WhatsApp workspace:',
        '1️⃣ Post a B2B Requirement Free (Client)',
        '2️⃣ Claim 5-Minute Wave 1 Leads (Partner)',
        '3️⃣ Check Active Requirements & Quotes',
        '4️⃣ Talk to an XPO Coordinator (SUPPORT)',
      ].join('\n');
      break;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
