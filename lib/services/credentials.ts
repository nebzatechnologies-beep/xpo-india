import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import type {
  AiAgentCredentials,
  AiProviderType,
  MetaWhatsAppCredentials,
  PayPalCredentials,
  PlatformCredentialsBundle,
  RazorpayCredentials,
} from '@/lib/types/domain';

function maskSecret(val?: string | null): string {
  if (!val) return '';
  if (val.length <= 8) return '••••••••';
  return `${val.slice(0, 3)}••••••••${val.slice(-3)}`;
}

export async function getPlatformCredentials(): Promise<PlatformCredentialsBundle> {
  const db = requireFirestore();
  const [liveSnap, waLegacySnap] = await Promise.all([
    db.doc('platform_credentials/live').get(),
    db.doc('platform_settings/whatsapp_config').get(),
  ]);

  const live = liveSnap.exists
    ? (liveSnap.data() as Partial<PlatformCredentialsBundle> & {
        razorpay?: Partial<RazorpayCredentials> & { employerPlanId?: string };
        paypal?: Partial<PayPalCredentials> & { employerPlanId?: string };
      })
    : {};
  const waLegacy = waLegacySnap.exists
    ? (waLegacySnap.data() as Partial<MetaWhatsAppCredentials>)
    : {};

  const waLive: Partial<MetaWhatsAppCredentials> = live.whatsapp || {};
  const rzpLive: Partial<RazorpayCredentials> & { employerPlanId?: string } =
    live.razorpay || {};
  const ppLive: Partial<PayPalCredentials> & { employerPlanId?: string } =
    live.paypal || {};
  const aiLive: Partial<AiAgentCredentials> = live.ai || {};

  const whatsapp: MetaWhatsAppCredentials = {
    graphVersion:
      waLive.graphVersion ||
      process.env.WHATSAPP_GRAPH_VERSION ||
      process.env.META_WA_API_VERSION ||
      'v21.0',
    wabaId:
      waLive.wabaId ||
      waLegacy.wabaId ||
      process.env.WHATSAPP_WABA_ID ||
      process.env.META_WA_BUSINESS_ACCOUNT_ID ||
      '',
    phoneNumberId:
      waLive.phoneNumberId ||
      waLegacy.phoneNumberId ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.META_WA_PHONE_NUMBER_ID ||
      '',
    displayPhoneNumber:
      waLive.displayPhoneNumber ||
      waLegacy.displayPhoneNumber ||
      process.env.WHATSAPP_DISPLAY_NUMBER ||
      process.env.NEXT_PUBLIC_WA_BUSINESS_NUMBER ||
      '',
    accessToken:
      waLive.accessToken ||
      waLegacy.accessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.META_WA_ACCESS_TOKEN ||
      '',
    appSecret:
      waLive.appSecret ||
      waLegacy.appSecret ||
      process.env.WHATSAPP_APP_SECRET ||
      process.env.META_WA_APP_SECRET ||
      '',
    verifyToken:
      waLive.verifyToken ||
      waLegacy.verifyToken ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      process.env.META_WA_VERIFY_TOKEN ||
      'xpo_meta_verify_token',
    updatedAt: waLive.updatedAt || waLegacy.updatedAt,
    lastTestedAt: waLive.lastTestedAt,
    testStatus: waLive.testStatus || 'untested',
    testMessage: waLive.testMessage,
  };

  const razorpay: RazorpayCredentials = {
    keyId:
      rzpLive.keyId ||
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      '',
    keySecret: rzpLive.keySecret || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: rzpLive.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    partnerPlanId:
      rzpLive.partnerPlanId ||
      process.env.RAZORPAY_PARTNER_PLAN_ID ||
      process.env.RAZORPAY_PARTNER_PLAN_ID_INR ||
      '',
    clientPlanId:
      rzpLive.clientPlanId ||
      rzpLive.employerPlanId ||
      process.env.RAZORPAY_CLIENT_PLAN_ID ||
      process.env.RAZORPAY_CLIENT_PLAN_ID_INR ||
      '',
    updatedAt: rzpLive.updatedAt,
    lastTestedAt: rzpLive.lastTestedAt,
    testStatus: rzpLive.testStatus || 'untested',
    testMessage: rzpLive.testMessage,
  };

  const paypal: PayPalCredentials = {
    clientId:
      ppLive.clientId ||
      process.env.PAYPAL_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      '',
    clientSecret: ppLive.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: ppLive.webhookId || process.env.PAYPAL_WEBHOOK_ID || '',
    partnerPlanId:
      ppLive.partnerPlanId ||
      process.env.PAYPAL_PARTNER_PLAN_ID ||
      process.env.PAYPAL_PARTNER_PLAN_ID_USD ||
      '',
    clientPlanId:
      ppLive.clientPlanId ||
      ppLive.employerPlanId ||
      process.env.PAYPAL_CLIENT_PLAN_ID ||
      process.env.PAYPAL_CLIENT_PLAN_ID_USD ||
      '',
    apiBaseUrl:
      ppLive.apiBaseUrl ||
      process.env.PAYPAL_API_BASE_URL ||
      'https://api-m.paypal.com',
    updatedAt: ppLive.updatedAt,
    lastTestedAt: ppLive.lastTestedAt,
    testStatus: ppLive.testStatus || 'untested',
    testMessage: ppLive.testMessage,
  };

  const geminiApiKey =
    aiLive.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    '';
  const openaiApiKey = aiLive.openaiApiKey || process.env.OPENAI_API_KEY || '';

  const defaultProvider: AiProviderType = geminiApiKey
    ? 'gemini'
    : openaiApiKey
      ? 'openai'
      : 'deterministic';

  const ai: AiAgentCredentials = {
    provider: aiLive.provider || defaultProvider,
    geminiApiKey,
    geminiModel: aiLive.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiApiKey,
    openaiModel: aiLive.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    updatedAt: aiLive.updatedAt,
    lastTestedAt: aiLive.lastTestedAt,
    testStatus: aiLive.testStatus || 'untested',
    testMessage: aiLive.testMessage,
  };

  return { whatsapp, razorpay, paypal, ai };
}

export async function getWhatsAppCredentials(): Promise<MetaWhatsAppCredentials> {
  const bundle = await getPlatformCredentials();
  return bundle.whatsapp;
}

export async function getRazorpayCredentials(): Promise<RazorpayCredentials> {
  const bundle = await getPlatformCredentials();
  return bundle.razorpay;
}

export async function getPayPalCredentials(): Promise<PayPalCredentials> {
  const bundle = await getPlatformCredentials();
  return bundle.paypal;
}

export async function getAiAgentCredentials(): Promise<AiAgentCredentials> {
  const bundle = await getPlatformCredentials();
  return bundle.ai;
}

export async function getMaskedPlatformCredentials(): Promise<{
  whatsapp: MetaWhatsAppCredentials & { maskedAccessToken: string; maskedAppSecret: string };
  razorpay: RazorpayCredentials & { maskedKeySecret: string; maskedWebhookSecret: string };
  paypal: PayPalCredentials & { maskedClientSecret: string };
  ai: AiAgentCredentials & { maskedGeminiApiKey: string; maskedOpenaiApiKey: string };
}> {
  const raw = await getPlatformCredentials();
  return {
    whatsapp: {
      ...raw.whatsapp,
      accessToken: '',
      appSecret: '',
      maskedAccessToken: maskSecret(raw.whatsapp.accessToken),
      maskedAppSecret: maskSecret(raw.whatsapp.appSecret),
    },
    razorpay: {
      ...raw.razorpay,
      keySecret: '',
      webhookSecret: '',
      maskedKeySecret: maskSecret(raw.razorpay.keySecret),
      maskedWebhookSecret: maskSecret(raw.razorpay.webhookSecret),
    },
    paypal: {
      ...raw.paypal,
      clientSecret: '',
      maskedClientSecret: maskSecret(raw.paypal.clientSecret),
    },
    ai: {
      ...raw.ai,
      geminiApiKey: '',
      openaiApiKey: '',
      maskedGeminiApiKey: maskSecret(raw.ai.geminiApiKey),
      maskedOpenaiApiKey: maskSecret(raw.ai.openaiApiKey),
    },
  };
}

export async function updatePlatformCredentials(
  updates: {
    whatsapp?: Partial<MetaWhatsAppCredentials>;
    razorpay?: Partial<RazorpayCredentials>;
    paypal?: Partial<PayPalCredentials>;
    ai?: Partial<AiAgentCredentials>;
  },
  actor: { uid: string; name: string }
): Promise<PlatformCredentialsBundle> {
  const db = requireFirestore();
  const current = await getPlatformCredentials();
  const nowIso = new Date().toISOString();

  const nextWhatsapp: MetaWhatsAppCredentials = {
    ...current.whatsapp,
    ...(updates.whatsapp || {}),
    accessToken: updates.whatsapp?.accessToken?.trim() || current.whatsapp.accessToken,
    appSecret: updates.whatsapp?.appSecret?.trim() || current.whatsapp.appSecret,
    updatedAt: nowIso,
  };

  const nextRazorpay: RazorpayCredentials = {
    ...current.razorpay,
    ...(updates.razorpay || {}),
    keySecret: updates.razorpay?.keySecret?.trim() || current.razorpay.keySecret,
    webhookSecret: updates.razorpay?.webhookSecret?.trim() || current.razorpay.webhookSecret,
    updatedAt: nowIso,
  };

  const nextPayPal: PayPalCredentials = {
    ...current.paypal,
    ...(updates.paypal || {}),
    clientSecret: updates.paypal?.clientSecret?.trim() || current.paypal.clientSecret,
    updatedAt: nowIso,
  };

  const nextAi: AiAgentCredentials = {
    ...current.ai,
    ...(updates.ai || {}),
    geminiApiKey: updates.ai?.geminiApiKey?.trim() || current.ai.geminiApiKey,
    openaiApiKey: updates.ai?.openaiApiKey?.trim() || current.ai.openaiApiKey,
    updatedAt: nowIso,
  };

  const bundle: PlatformCredentialsBundle = {
    whatsapp: nextWhatsapp,
    razorpay: nextRazorpay,
    paypal: nextPayPal,
    ai: nextAi,
  };

  await Promise.all([
    db.doc('platform_credentials/live').set(bundle, { merge: true }),
    db.doc('platform_settings/whatsapp_config').set(
      {
        phoneNumberId: nextWhatsapp.phoneNumberId,
        businessAccountId: nextWhatsapp.wabaId,
        displayPhoneNumber: nextWhatsapp.displayPhoneNumber,
        verifyToken: nextWhatsapp.verifyToken,
        accessToken: nextWhatsapp.accessToken,
        appSecret: nextWhatsapp.appSecret,
        updatedAt: nowIso,
      },
      { merge: true }
    ),
  ]);

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'settings',
    action: 'platform_credentials.updated',
    targetType: 'platform_credentials',
    targetId: 'live',
    summary: `Superadmin updated live API credentials for: ${Object.keys(updates).join(', ')}`,
  });

  return bundle;
}

export async function testGatewayCredentials(
  gateway: 'whatsapp' | 'razorpay' | 'paypal' | 'ai'
): Promise<{ success: boolean; message: string }> {
  const db = requireFirestore();
  const creds = await getPlatformCredentials();
  const nowIso = new Date().toISOString();

  let success = false;
  let message = '';

  try {
    if (gateway === 'whatsapp') {
      const wa = creds.whatsapp;
      if (!wa.phoneNumberId || !wa.accessToken) {
        throw new Error('Meta Phone Number ID and Access Token are required to test.');
      }
      const version = wa.graphVersion || 'v21.0';
      const res = await fetch(
        `https://graph.facebook.com/${version}/${wa.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`,
        {
          headers: { Authorization: `Bearer ${wa.accessToken}` },
        }
      );
      const data = (await res.json()) as {
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
        error?: { message?: string };
      };
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `Meta Graph API HTTP ${res.status}`);
      }
      success = true;
      message = `Meta WhatsApp Connected! Phone: ${data.display_phone_number || wa.phoneNumberId} (${data.verified_name || 'Verified'}), Quality: ${data.quality_rating || 'GREEN'}`;
    } else if (gateway === 'razorpay') {
      const rzp = creds.razorpay;
      if (!rzp.keyId || !rzp.keySecret) {
        throw new Error('Razorpay Key ID and Key Secret are required to test.');
      }
      const basic = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/plans?count=1', {
        headers: { Authorization: `Basic ${basic}` },
      });
      if (!res.ok) {
        const errJson = (await res.json()) as { error?: { description?: string } };
        throw new Error(errJson.error?.description || `Razorpay API HTTP ${res.status}`);
      }
      success = true;
      message = `Razorpay API Authenticated! Verified Key ID: ${rzp.keyId}`;
    } else if (gateway === 'paypal') {
      const pp = creds.paypal;
      if (!pp.clientId || !pp.clientSecret) {
        throw new Error('PayPal Client ID and Client Secret are required to test.');
      }
      const basic = Buffer.from(`${pp.clientId}:${pp.clientSecret}`).toString('base64');
      const baseUrl = pp.apiBaseUrl || 'https://api-m.paypal.com';
      const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (!res.ok) {
        const errJson = (await res.json()) as { error_description?: string; message?: string };
        throw new Error(
          errJson.error_description || errJson.message || `PayPal OAuth2 HTTP ${res.status}`
        );
      }
      success = true;
      message = `PayPal API Authenticated! OAuth2 access token generated for Client ID: ${pp.clientId}`;
    } else if (gateway === 'ai') {
      const ai = creds.ai;
      if (ai.provider === 'gemini') {
        if (!ai.geminiApiKey) {
          throw new Error('Google Gemini API Key is required when Gemini provider is selected.');
        }
        const model = ai.geminiModel || 'gemini-2.5-flash';
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${encodeURIComponent(ai.geminiApiKey)}`
        );
        if (!res.ok) {
          const errJson = (await res.json()) as { error?: { message?: string } };
          throw new Error(errJson.error?.message || `Gemini API HTTP ${res.status}`);
        }
        success = true;
        message = `Google Gemini Connected! Active model: ${model}`;
      } else if (ai.provider === 'openai') {
        if (!ai.openaiApiKey) {
          throw new Error('OpenAI API Key is required when OpenAI provider is selected.');
        }
        const model = ai.openaiModel || 'gpt-4o-mini';
        const res = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
          headers: { Authorization: `Bearer ${ai.openaiApiKey}` },
        });
        if (!res.ok) {
          const errJson = (await res.json()) as { error?: { message?: string } };
          throw new Error(errJson.error?.message || `OpenAI API HTTP ${res.status}`);
        }
        success = true;
        message = `OpenAI Connected! Active model: ${model}`;
      } else {
        success = true;
        message =
          'Built-in Deterministic Smart Agent Engine is active and ready (zero external API key required).';
      }
    }

    await db.doc('platform_credentials/live').set(
      {
        [gateway]: {
          ...creds[gateway],
          lastTestedAt: nowIso,
          testStatus: 'success',
          testMessage: message,
        },
      },
      { merge: true }
    );
  } catch (err) {
    success = false;
    message = err instanceof Error ? err.message : 'Gateway test failed';
    await db.doc('platform_credentials/live').set(
      {
        [gateway]: {
          ...creds[gateway],
          lastTestedAt: nowIso,
          testStatus: 'failed',
          testMessage: message,
        },
      },
      { merge: true }
    );
  }

  return { success, message };
}
