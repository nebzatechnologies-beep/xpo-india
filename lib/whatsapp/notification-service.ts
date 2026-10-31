import { requireFirestore } from '@/lib/firebase/admin';
import { isPhoneSuppressed } from '@/lib/services/crm';
import { generateDocId } from '@/lib/utils/id-generator';
import {
  sendMetaInteractiveButtons,
  sendMetaInteractiveList,
  sendMetaTemplateMessage,
  sendMetaTextMessage,
} from './meta-client';
import type {
  WhatsAppInteractiveOption,
  WhatsAppMessageRecord,
  WhatsAppSession,
} from '@/lib/types/domain';

export interface OutboundWhatsAppPayload {
  sessionId: string;
  phoneE164: string;
  isSimulated?: boolean;
  bypassSuppressionCheck?: boolean; // Only true for direct replies to user-initiated support/STOP confirmation
  messageType: 'text' | 'interactive_buttons' | 'interactive_list' | 'template';
  body: string;
  headerText?: string;
  footerText?: string;
  listButtonLabel?: string;
  interactiveOptions?: WhatsAppInteractiveOption[];
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: string[];
  /**
   * When sending outside Meta's 24-hour customer service window, Cloud API requires an
   * approved template. Provide fallback template metadata for proactive alerts.
   */
  outsideWindowTemplate?: {
    name: string;
    language?: string;
    variables: string[];
    category?: 'UTILITY' | 'MARKETING';
  };
}

function isWithin24HourServiceWindow(lastInboundAt?: string | null): boolean {
  if (!lastInboundAt) return false;
  const elapsedMs = Date.now() - new Date(lastInboundAt).getTime();
  return elapsedMs >= 0 && elapsedMs <= 24 * 60 * 60 * 1000;
}

export async function dispatchOutboundWhatsApp(
  payload: OutboundWhatsAppPayload
): Promise<WhatsAppMessageRecord> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const isSimulated = Boolean(payload.isSimulated);

  if (!isSimulated && !payload.bypassSuppressionCheck) {
    const suppressed = await isPhoneSuppressed(payload.phoneE164);
    if (suppressed) {
      throw new Error(
        `Outbound WhatsApp blocked: ${payload.phoneE164} is on the opt-out suppression list.`
      );
    }
  }

  const sessionRef = db.collection('whatsapp_sessions').doc(payload.sessionId);
  const sessionSnap = await sessionRef.get();
  const session = sessionSnap.exists ? (sessionSnap.data() as WhatsAppSession) : null;
  const within24h = isWithin24HourServiceWindow(session?.lastInboundAt);

  // Simulator Channel Transport (PDF Report 2 Section 21 — Real Firestore, Zero Meta Charges)
  if (isSimulated) {
    const msgId = generateDocId('wamsg_sim');
    const simRecord: WhatsAppMessageRecord = {
      id: msgId,
      waMessageId: `sim_${msgId}`,
      sessionId: payload.sessionId,
      phoneE164: payload.phoneE164,
      direction: 'outbound',
      messageType: payload.messageType,
      body: payload.body,
      templateName: payload.templateName || null,
      interactiveOptions: payload.interactiveOptions,
      deliveryStatus: 'simulated_local',
      estimatedCostInr: 0,
      isSimulated: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('whatsapp_messages').doc(msgId).set(simRecord);
    await sessionRef.set({ lastOutboundAt: now, updatedAt: now }, { merge: true });
    return simRecord;
  }

  // Official Meta Cloud API Production Transport
  let waMessageId = '';
  let resolvedType = payload.messageType;
  let resolvedTemplateName = payload.templateName || null;
  let estimatedCostInr = 0;

  if (!within24h && payload.messageType !== 'template' && payload.outsideWindowTemplate) {
    resolvedType = 'template';
    resolvedTemplateName = payload.outsideWindowTemplate.name;
    estimatedCostInr =
      payload.outsideWindowTemplate.category === 'MARKETING' ? 0.88 : 0.145;
    const res = await sendMetaTemplateMessage(
      payload.phoneE164,
      payload.outsideWindowTemplate.name,
      payload.outsideWindowTemplate.language || 'en',
      payload.outsideWindowTemplate.variables
    );
    waMessageId = res.waMessageId;
  } else if (payload.messageType === 'template' && payload.templateName) {
    estimatedCostInr = 0.88;
    const res = await sendMetaTemplateMessage(
      payload.phoneE164,
      payload.templateName,
      payload.templateLanguage || 'en',
      payload.templateVariables || []
    );
    waMessageId = res.waMessageId;
  } else if (
    payload.messageType === 'interactive_buttons' &&
    payload.interactiveOptions &&
    payload.interactiveOptions.length > 0
  ) {
    const res = await sendMetaInteractiveButtons(
      payload.phoneE164,
      payload.body,
      payload.interactiveOptions,
      payload.headerText,
      payload.footerText
    );
    waMessageId = res.waMessageId;
  } else if (
    payload.messageType === 'interactive_list' &&
    payload.interactiveOptions &&
    payload.interactiveOptions.length > 0
  ) {
    const res = await sendMetaInteractiveList(
      payload.phoneE164,
      payload.body,
      payload.listButtonLabel || 'Choose Option',
      payload.interactiveOptions,
      'Available Options',
      payload.headerText,
      payload.footerText
    );
    waMessageId = res.waMessageId;
  } else {
    const res = await sendMetaTextMessage(payload.phoneE164, payload.body);
    waMessageId = res.waMessageId;
  }

  const msgDocId = generateDocId('wamsg');
  const record: WhatsAppMessageRecord = {
    id: msgDocId,
    waMessageId,
    sessionId: payload.sessionId,
    phoneE164: payload.phoneE164,
    direction: 'outbound',
    messageType: resolvedType,
    body: payload.body,
    templateName: resolvedTemplateName,
    interactiveOptions: payload.interactiveOptions,
    deliveryStatus: 'sent',
    estimatedCostInr,
    isSimulated: false,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    db.collection('whatsapp_messages').doc(msgDocId).set(record),
    sessionRef.set({ lastOutboundAt: now, updatedAt: now }, { merge: true }),
    db.collection('whatsapp_notification_jobs').doc(msgDocId).set({
      id: msgDocId,
      waMessageId,
      phoneE164: payload.phoneE164,
      messageType: resolvedType,
      templateName: resolvedTemplateName,
      status: 'sent',
      estimatedCostInr,
      createdAt: now,
    }),
  ]);

  return record;
}
