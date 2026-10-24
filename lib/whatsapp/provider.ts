// ============================================================================
// XPO — Meta WhatsApp Business Cloud API Adapter & Simulated Provider (Module 2)
// Never represents simulated messages as real delivered messages.
// ============================================================================

import crypto from 'crypto';
import { InteractiveOption, WhatsAppProviderMode } from './types';

export interface WhatsAppAdapterConfig {
  mode: WhatsAppProviderMode;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  accessToken: string;
  webhookVerifyToken: string;
  webhookSecret: string;
}

let runtimeConfigOverride: Partial<WhatsAppAdapterConfig> = {};

export function setWhatsAppRuntimeConfig(update: Partial<WhatsAppAdapterConfig>) {
  runtimeConfigOverride = { ...runtimeConfigOverride, ...update };
}

export function getWhatsAppConfig(): WhatsAppAdapterConfig {
  const envToken = process.env.WHATSAPP_API_TOKEN || '';
  const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const envWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const hasLiveMetaCreds = Boolean(
    (runtimeConfigOverride.accessToken || envToken) &&
    !(runtimeConfigOverride.accessToken || envToken).includes('[Encrypted') &&
    (runtimeConfigOverride.phoneNumberId || envPhoneId)
  );

  const requestedMode = runtimeConfigOverride.mode || (process.env.WHATSAPP_PROVIDER === 'meta' && hasLiveMetaCreds ? 'meta' : 'simulated');

  return {
    mode: hasLiveMetaCreds && requestedMode === 'meta' ? 'meta' : 'simulated',
    wabaId: runtimeConfigOverride.wabaId || envWabaId || 'WABA_8819200192931',
    phoneNumberId: runtimeConfigOverride.phoneNumberId || envPhoneId || 'PNID_5528190021',
    displayPhoneNumber: runtimeConfigOverride.displayPhoneNumber || '+91 98200 99881',
    accessToken: runtimeConfigOverride.accessToken || envToken || '',
    webhookVerifyToken:
      runtimeConfigOverride.webhookVerifyToken ||
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      'XPO_WHATSAPP_WEBHOOK_SECRET_KEY_2026',
    webhookSecret:
      runtimeConfigOverride.webhookSecret ||
      process.env.WHATSAPP_WEBHOOK_SECRET ||
      '',
  };
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const cfg = getWhatsAppConfig();
  if (!cfg.webhookSecret) {
    // When running in simulated mode without a Meta App Secret configured, allow simulated webhook tests
    return cfg.mode === 'simulated';
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export interface DispatchWhatsAppPayload {
  toPhoneE164: string;
  text: string;
  interactiveOptions?: InteractiveOption[];
}

export interface DispatchWhatsAppResult {
  success: boolean;
  providerMode: WhatsAppProviderMode;
  /**
   * 'simulated' when using mock provider; 'sent' when accepted by Meta Graph API; 'failed' on error.
   */
  status: 'simulated' | 'sent' | 'failed';
  metaMessageId?: string;
  errorReason?: string;
}

export async function dispatchWhatsAppMessage(
  payload: DispatchWhatsAppPayload
): Promise<DispatchWhatsAppResult> {
  const cfg = getWhatsAppConfig();

  // Simulated provider: never represent simulated messages as real delivered messages
  if (cfg.mode === 'simulated') {
    return {
      success: true,
      providerMode: 'simulated',
      status: 'simulated',
      metaMessageId: `sim_wamid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  // Live Meta WhatsApp Cloud API Graph v20.0
  const toDigits = payload.toPhoneE164.replace(/^\+/, '');
  const graphUrl = `https://graph.facebook.com/v20.0/${cfg.phoneNumberId}/messages`;

  const messageBody: Record<string, any> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toDigits,
  };

  if (payload.interactiveOptions && payload.interactiveOptions.length > 0 && payload.interactiveOptions.length <= 3) {
    messageBody.type = 'interactive';
    messageBody.interactive = {
      type: 'button',
      body: { text: payload.text },
      action: {
        buttons: payload.interactiveOptions.map((opt) => ({
          type: 'reply',
          reply: {
            id: opt.id,
            title: opt.title.slice(0, 20),
          },
        })),
      },
    };
  } else if (payload.interactiveOptions && payload.interactiveOptions.length > 3) {
    messageBody.type = 'interactive';
    messageBody.interactive = {
      type: 'list',
      body: { text: payload.text },
      action: {
        button: 'Select Option',
        sections: [
          {
            title: 'XPO Options',
            rows: payload.interactiveOptions.slice(0, 10).map((opt) => ({
              id: opt.id,
              title: opt.title.slice(0, 24),
              description: opt.description ? opt.description.slice(0, 72) : undefined,
            })),
          },
        ],
      },
    };
  } else {
    messageBody.type = 'text';
    messageBody.text = { preview_url: false, body: payload.text };
  }

  try {
    const res = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        providerMode: 'meta',
        status: 'failed',
        errorReason: data?.error?.message || `Meta API HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      providerMode: 'meta',
      status: 'sent',
      metaMessageId: data?.messages?.[0]?.id,
    };
  } catch (err: any) {
    return {
      success: false,
      providerMode: 'meta',
      status: 'failed',
      errorReason: err.message || 'Network error calling Meta Cloud API',
    };
  }
}
