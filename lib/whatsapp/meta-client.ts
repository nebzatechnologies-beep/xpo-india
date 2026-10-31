import crypto from 'crypto';
import {
  requireFirestore,
  requireStorageBucket,
  ServiceConfigurationError,
} from '@/lib/firebase/admin';
import { getWhatsAppCredentials } from '@/lib/services/credentials';
import type { WhatsAppInteractiveOption, WhatsAppTemplateRecord } from '@/lib/types/domain';

export interface MetaWhatsAppRuntimeConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  displayPhoneNumber?: string;
  graphVersion?: string;
}

export async function getMetaWhatsAppConfig(): Promise<MetaWhatsAppRuntimeConfig> {
  const creds = await getWhatsAppCredentials();
  return {
    phoneNumberId: creds.phoneNumberId,
    businessAccountId: creds.wabaId,
    accessToken: creds.accessToken,
    appSecret: creds.appSecret,
    verifyToken: creds.verifyToken,
    displayPhoneNumber: creds.displayPhoneNumber,
    graphVersion: creds.graphVersion || 'v21.0',
  };
}

export async function requireMetaWhatsAppConfig(): Promise<MetaWhatsAppRuntimeConfig> {
  const cfg = await getMetaWhatsAppConfig();
  if (!cfg.phoneNumberId || !cfg.accessToken) {
    throw new ServiceConfigurationError(
      'meta-whatsapp-cloud-api',
      'Official Meta WhatsApp Cloud API credentials (META_WA_PHONE_NUMBER_ID, META_WA_ACCESS_TOKEN) are not configured yet.'
    );
  }
  return cfg;
}

/**
 * Constant-time verification of Meta's `X-Hub-Signature-256: sha256=<hex>` header
 * against the raw webhook request body buffer.
 */
export async function verifyMetaWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const cfg = await getMetaWhatsAppConfig();
  if (!cfg.appSecret) {
    throw new ServiceConfigurationError(
      'meta-whatsapp-app-secret',
      'META_WA_APP_SECRET is required to verify Official Meta WhatsApp webhook signatures.'
    );
  }

  const expectedHex = crypto
    .createHmac('sha256', cfg.appSecret)
    .update(rawBody)
    .digest('hex');
  const providedHex = signatureHeader.slice(7).trim();

  const a = Buffer.from(expectedHex, 'utf8');
  const b = Buffer.from(providedHex, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function toMetaRecipientDigits(phoneE164: string): string {
  return phoneE164.replace(/^\+/, '').replace(/\D/g, '');
}

function getGraphBaseUrl(version = 'v21.0'): string {
  const clean = version.startsWith('v') ? version : `v${version}`;
  return `https://graph.facebook.com/${clean}`;
}

async function postMetaMessagesEndpoint(
  payload: Record<string, unknown>
): Promise<{ waMessageId: string }> {
  const cfg = await requireMetaWhatsAppConfig();
  const res = await fetch(`${getGraphBaseUrl(cfg.graphVersion)}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...payload,
    }),
  });

  const data = (await res.json()) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string; code?: number };
  };

  if (!res.ok || !data.messages?.[0]?.id) {
    const errMsg = data.error?.message || `Meta Graph API HTTP ${res.status}`;
    throw new Error(`[MetaCloudAPI] ${errMsg}`);
  }

  return { waMessageId: data.messages[0].id };
}

export async function sendMetaTextMessage(
  toE164: string,
  body: string
): Promise<{ waMessageId: string }> {
  return postMetaMessagesEndpoint({
    to: toMetaRecipientDigits(toE164),
    type: 'text',
    text: { preview_url: true, body },
  });
}

export async function sendMetaInteractiveButtons(
  toE164: string,
  body: string,
  buttons: WhatsAppInteractiveOption[],
  headerText?: string,
  footerText?: string
): Promise<{ waMessageId: string }> {
  const trimmedButtons = buttons.slice(0, 3).map((btn) => ({
    type: 'reply',
    reply: {
      id: btn.id.slice(0, 256),
      title: btn.title.slice(0, 20), // Meta enforces max 20 chars on reply button titles
    },
  }));

  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: body.slice(0, 1024) },
    action: { buttons: trimmedButtons },
  };
  if (headerText) {
    interactive.header = { type: 'text', text: headerText.slice(0, 60) };
  }
  if (footerText) {
    interactive.footer = { text: footerText.slice(0, 60) };
  }

  return postMetaMessagesEndpoint({
    to: toMetaRecipientDigits(toE164),
    type: 'interactive',
    interactive,
  });
}

export async function sendMetaInteractiveList(
  toE164: string,
  body: string,
  buttonLabel: string,
  options: WhatsAppInteractiveOption[],
  sectionTitle = 'Select an Option',
  headerText?: string,
  footerText?: string
): Promise<{ waMessageId: string }> {
  const rows = options.slice(0, 10).map((opt) => ({
    id: opt.id.slice(0, 200),
    title: opt.title.slice(0, 24), // Meta enforces max 24 chars on list row titles
    ...(opt.description ? { description: opt.description.slice(0, 72) } : {}),
  }));

  const interactive: Record<string, unknown> = {
    type: 'list',
    body: { text: body.slice(0, 1024) },
    action: {
      button: buttonLabel.slice(0, 20),
      sections: [{ title: sectionTitle.slice(0, 24), rows }],
    },
  };
  if (headerText) interactive.header = { type: 'text', text: headerText.slice(0, 60) };
  if (footerText) interactive.footer = { type: 'text', text: footerText.slice(0, 60) };

  return postMetaMessagesEndpoint({
    to: toMetaRecipientDigits(toE164),
    type: 'interactive',
    interactive,
  });
}

export async function sendMetaTemplateMessage(
  toE164: string,
  templateName: string,
  languageCode = 'en',
  bodyVariables: string[] = []
): Promise<{ waMessageId: string }> {
  const components =
    bodyVariables.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyVariables.map((v) => ({
              type: 'text',
              text: String(v).slice(0, 512),
            })),
          },
        ]
      : [];

  return postMetaMessagesEndpoint({
    to: toMetaRecipientDigits(toE164),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  });
}

export async function sendMetaFlowMessage(
  toE164: string,
  body: string,
  flowId: string,
  flowCta: string,
  screenId = 'START'
): Promise<{ waMessageId: string }> {
  return postMetaMessagesEndpoint({
    to: toMetaRecipientDigits(toE164),
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: { text: body.slice(0, 1024) },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `xpo_${Date.now()}`,
          flow_id: flowId,
          flow_cta: flowCta.slice(0, 20),
          flow_action: 'navigate',
          flow_action_payload: { screen: screenId },
        },
      },
    },
  });
}

export async function downloadMetaMediaToStorage(
  mediaId: string,
  sessionId: string
): Promise<string> {
  const cfg = await requireMetaWhatsAppConfig();
  const metaRes = await fetch(`${getGraphBaseUrl(cfg.graphVersion)}/${mediaId}`, {
    headers: { Authorization: `Bearer ${cfg.accessToken}` },
  });
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch Meta media metadata for ${mediaId}`);
  }
  const metaJson = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!metaJson.url) {
    throw new Error(`Meta media URL missing for ${mediaId}`);
  }

  const binRes = await fetch(metaJson.url, {
    headers: { Authorization: `Bearer ${cfg.accessToken}` },
  });
  if (!binRes.ok) {
    throw new Error(`Failed to download binary media from Meta URL`);
  }

  const buffer = Buffer.from(await binRes.arrayBuffer());
  const ext = (metaJson.mime_type || 'application/octet-stream').split('/').pop() || 'bin';
  const storagePath = `whatsapp-media/${sessionId}/${mediaId}.${ext.replace(/[^a-zA-Z0-9]/g, '')}`;

  const bucket = requireStorageBucket();
  await bucket.file(storagePath).save(buffer, {
    contentType: metaJson.mime_type || 'application/octet-stream',
    resumable: false,
  });

  return storagePath;
}

export const DEFAULT_META_TEMPLATES: Omit<WhatsAppTemplateRecord, 'updatedAt'>[] = [
  {
    id: 'tpl_client_invite',
    name: 'xpo_client_invite_v1',
    category: 'MARKETING',
    language: 'en',
    purpose: 'client_invitation',
    headerText: 'Welcome to XPO — Find Trusted Partners',
    bodyText:
      'Hi {{1}}, {{2}} is invited to join XPO in {{3}}. Post any product, service or professional requirement for free on WhatsApp and connect with verified Partners.',
    footerText: 'Reply STOP anytime to opt out',
    variables: ['client_name', 'company_name', 'city'],
    buttons: [
      { type: 'QUICK_REPLY', text: 'Register as Client' },
      { type: 'QUICK_REPLY', text: 'Post Requirement' },
    ],
    metaStatus: 'APPROVED',
  },
  {
    id: 'tpl_partner_invite',
    name: 'xpo_partner_invite_v1',
    category: 'MARKETING',
    language: 'en',
    purpose: 'partner_invitation',
    headerText: 'Join XPO Partner Network',
    bodyText:
      'Hi {{1}}, XPO is inviting verified {{2}} Partners in {{3}} to receive matching Client requirements directly on WhatsApp. Your first 5 valid lead applications are free.',
    footerText: 'Reply STOP anytime to opt out',
    variables: ['partner_name', 'category_name', 'city'],
    buttons: [
      { type: 'QUICK_REPLY', text: 'Register as Partner' },
      { type: 'QUICK_REPLY', text: 'Set Up Profile' },
    ],
    metaStatus: 'APPROVED',
  },
  {
    id: 'tpl_opportunity_alert',
    name: 'xpo_partner_lead_offer_v1',
    category: 'UTILITY',
    language: 'en',
    purpose: 'opportunity_alert',
    headerText: 'New XPO Business Opportunity',
    bodyText:
      'Hi {{1}}, a verified requirement ({{2}} — {{3}}) in {{4}} matches your Partner profile. Timeline: {{5}} | Budget: {{6}}. Respond within 5 minutes to express interest.',
    footerText: 'No credit deducted on ignore or decline',
    variables: ['partner_name', 'xpo_code', 'title', 'location', 'timeline', 'budget'],
    buttons: [
      { type: 'QUICK_REPLY', text: "I'm Interested" },
      { type: 'QUICK_REPLY', text: 'Not Interested' },
      { type: 'QUICK_REPLY', text: 'View Details' },
    ],
    metaStatus: 'APPROVED',
  },
  {
    id: 'tpl_client_partner_claimed',
    name: 'xpo_client_partner_interested_v2',
    category: 'UTILITY',
    language: 'en',
    purpose: 'connection_request',
    headerText: 'Partner Responded to Your Requirement',
    bodyText:
      'Hi {{1}}, a verified Partner in {{2}} ({{3}}) responded to your requirement {{4}}. Tap View Partner to unlock their profile and connect.',
    variables: ['client_name', 'partner_city', 'verification_badge', 'xpo_code'],
    buttons: [{ type: 'QUICK_REPLY', text: 'View Partner' }],
    metaStatus: 'APPROVED',
  },
  {
    id: 'tpl_connection_consent',
    name: 'xpo_mutual_connection_consent_v1',
    category: 'UTILITY',
    language: 'en',
    purpose: 'connection_request',
    headerText: 'Mutual Connection Request',
    bodyText:
      'Hi {{1}}, {{2}} would like to connect directly regarding {{3}}. Direct contact details are shared only after you accept.',
    variables: ['recipient_name', 'initiator_company', 'reference_code'],
    buttons: [
      { type: 'QUICK_REPLY', text: 'Accept Connection' },
      { type: 'QUICK_REPLY', text: 'Decline' },
    ],
    metaStatus: 'APPROVED',
  },
  {
    id: 'tpl_subscription_reminder',
    name: 'xpo_subscription_upgrade_v1',
    category: 'UTILITY',
    language: 'en',
    purpose: 'subscription_reminder',
    headerText: 'XPO Monthly Plan Upgrade',
    bodyText:
      'Hi {{1}}, your free {{2}} quota has been completed. Activate your XPO Monthly Plan ({{3}}) to unlock {{4}} every month: {{5}}',
    variables: ['user_name', 'role_label', 'price_label', 'allowance_label', 'checkout_url'],
    buttons: [],
    metaStatus: 'APPROVED',
  },
];

export async function ensureTemplatesInitialized(): Promise<WhatsAppTemplateRecord[]> {
  const db = requireFirestore();
  const snap = await db.collection('whatsapp_templates').get();
  const now = new Date().toISOString();
  const existingById = new Map<string, WhatsAppTemplateRecord>();
  snap.docs.forEach((d) => existingById.set(d.id, d.data() as WhatsAppTemplateRecord));

  let mutated = false;
  const batch = db.batch();

  // Remove obsolete recruitment template if present from earlier builds
  if (existingById.has('tpl_job_alert')) {
    batch.delete(db.collection('whatsapp_templates').doc('tpl_job_alert'));
    existingById.delete('tpl_job_alert');
    mutated = true;
  }

  for (const tpl of DEFAULT_META_TEMPLATES) {
    const existing = existingById.get(tpl.id);
    const needsUpsert =
      !existing ||
      (tpl.id === 'tpl_client_partner_claimed' &&
        existing.variables?.includes('partner_business'));
    if (needsUpsert) {
      const record: WhatsAppTemplateRecord = { ...tpl, updatedAt: now };
      batch.set(db.collection('whatsapp_templates').doc(tpl.id), record);
      existingById.set(tpl.id, record);
      mutated = true;
    }
  }

  if (mutated) {
    await batch.commit();
  }

  return Array.from(existingById.values());
}

export async function syncTemplatesFromMetaCloudApi(): Promise<{
  syncedCount: number;
  templates: WhatsAppTemplateRecord[];
}> {
  const cfg = await requireMetaWhatsAppConfig();
  if (!cfg.businessAccountId) {
    throw new ServiceConfigurationError(
      'meta-whatsapp-waba-id',
      'META_WA_BUSINESS_ACCOUNT_ID is required to sync templates from Meta Business Manager.'
    );
  }

  const res = await fetch(
    `${getGraphBaseUrl(cfg.graphVersion)}/${cfg.businessAccountId}/message_templates?limit=100`,
    {
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[MetaCloudAPI] Template sync failed: ${errText}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      name: string;
      category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
      language: string;
      status: 'APPROVED' | 'PENDING' | 'REJECTED';
      components?: Array<{ type: string; text?: string }>;
    }>;
  };

  const db = requireFirestore();
  const now = new Date().toISOString();
  const batch = db.batch();
  let syncedCount = 0;

  for (const item of json.data || []) {
    const bodyComp = item.components?.find((c) => c.type === 'BODY');
    const headerComp = item.components?.find((c) => c.type === 'HEADER');
    const footerComp = item.components?.find((c) => c.type === 'FOOTER');
    const docId = `meta_${item.name}_${item.language}`;

    const record: WhatsAppTemplateRecord = {
      id: docId,
      name: item.name,
      category: item.category || 'UTILITY',
      language: item.language || 'en',
      purpose: item.category === 'MARKETING' ? 'campaign_broadcast' : 'account_update',
      headerText: headerComp?.text,
      bodyText: bodyComp?.text || '',
      footerText: footerComp?.text,
      variables: [],
      buttons: [],
      metaStatus: item.status || 'PENDING',
      metaTemplateId: item.id,
      updatedAt: now,
    };

    batch.set(db.collection('whatsapp_templates').doc(docId), record, { merge: true });
    syncedCount++;
  }

  await batch.commit();
  const templates = await ensureTemplatesInitialized();
  return { syncedCount, templates };
}
