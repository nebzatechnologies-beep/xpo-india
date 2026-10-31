import { NextResponse, type NextRequest } from 'next/server';
import { requireFirestore } from '@/lib/firebase/admin';
import {
  handleOfferDeliveredWebhook,
  handleOfferFailedWebhook,
} from '@/lib/marketplace/lead-distribution';
import { handleApiError } from '@/lib/utils/api-handler';
import { processInboundWhatsAppMessage } from '@/lib/whatsapp/conversation-engine';
import {
  downloadMetaMediaToStorage,
  getMetaWhatsAppConfig,
  verifyMetaWebhookSignature,
} from '@/lib/whatsapp/meta-client';

/**
 * Official Meta WhatsApp Cloud API Webhook Verification (`GET`)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const mode = sp.get('hub.mode');
    const token = sp.get('hub.verify_token');
    const challenge = sp.get('hub.challenge');

    const cfg = await getMetaWhatsAppConfig();
    const expectedToken = cfg.verifyToken || process.env.META_WA_VERIFY_TOKEN;

    if (mode === 'subscribe' && expectedToken && token === expectedToken && challenge) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Meta webhook verification token mismatch' },
      { status: 403 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body?: string };
          interactive?: {
            type?: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
          button?: { payload?: string; text?: string };
          document?: { id: string; filename?: string; mime_type?: string };
          image?: { id: string; mime_type?: string };
          referral?: { source_id?: string; headline?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code?: number; title?: string; message?: string }>;
        }>;
      };
    }>;
  }>;
}

/**
 * Official Meta WhatsApp Cloud API Signed Event Webhook (`POST`)
 * - Verifies `X-Hub-Signature-256` against raw body bytes
 * - Deduplicates via `webhook_events`
 * - Processes `delivered` / `failed` status updates (starting the 5-min offer clock!)
 * - Dispatches inbound messages into the 18-state `ConversationEngine`
 */
export async function POST(request: NextRequest) {
  try {
    const rawBuffer = Buffer.from(await request.arrayBuffer());
    const signatureHeader = request.headers.get('x-hub-signature-256');

    const isValidSig = await verifyMetaWebhookSignature(rawBuffer, signatureHeader);
    if (!isValidSig) {
      return NextResponse.json(
        { ok: false, error: 'Invalid X-Hub-Signature-256' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBuffer.toString('utf8')) as MetaWebhookPayload;
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const db = requireFirestore();
    const nowIso = new Date().toISOString();

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        // 1. Delivery / Read / Failed Status Updates
        for (const st of value.statuses || []) {
          const dedupId = `meta_st_${st.id}_${st.status}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          const dedupRef = db.collection('webhook_events').doc(dedupId);
          const dedupSnap = await dedupRef.get();
          if (dedupSnap.exists) continue;
          await dedupRef.set({
            id: dedupId,
            provider: 'meta_whatsapp',
            type: `status.${st.status}`,
            createdAt: nowIso,
          });

          // Update `whatsapp_messages` delivery status
          const msgSnap = await db
            .collection('whatsapp_messages')
            .where('waMessageId', '==', st.id)
            .limit(1)
            .get();

          if (!msgSnap.empty) {
            await msgSnap.docs[0]!.ref.set(
              {
                deliveryStatus: st.status,
                errorCode: st.errors?.[0]?.code ? String(st.errors[0].code) : null,
                errorMessage: st.errors?.[0]?.title || st.errors?.[0]?.message || null,
                updatedAt: nowIso,
              },
              { merge: true }
            );
          }

          if (st.status === 'delivered') {
            await handleOfferDeliveredWebhook(st.id);
          } else if (st.status === 'failed') {
            await handleOfferFailedWebhook(
              st.id,
              st.errors?.[0]?.title || 'Meta delivery failure'
            );
          }
        }

        // 2. Inbound Customer Messages
        const contactsMap = new Map<string, string>();
        for (const c of value.contacts || []) {
          if (c.wa_id && c.profile?.name) {
            contactsMap.set(c.wa_id, c.profile.name);
          }
        }

        for (const msg of value.messages || []) {
          const dedupId = `meta_msg_${msg.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          const dedupRef = db.collection('webhook_events').doc(dedupId);
          const dedupSnap = await dedupRef.get();
          if (dedupSnap.exists) continue;
          await dedupRef.set({
            id: dedupId,
            provider: 'meta_whatsapp',
            type: `message.${msg.type}`,
            createdAt: nowIso,
          });

          let mediaStoragePath: string | null = null;
          if (msg.type === 'document' && msg.document?.id) {
            try {
              mediaStoragePath = await downloadMetaMediaToStorage(
                msg.document.id,
                `+${msg.from}`
              );
            } catch (e) {
              console.error('[WhatsAppWebhook] Media download failed:', e);
            }
          } else if (msg.type === 'image' && msg.image?.id) {
            try {
              mediaStoragePath = await downloadMetaMediaToStorage(msg.image.id, `+${msg.from}`);
            } catch (e) {
              console.error('[WhatsAppWebhook] Image download failed:', e);
            }
          }

          const buttonReply =
            msg.interactive?.button_reply ||
            msg.interactive?.list_reply ||
            (msg.button?.payload
              ? { id: msg.button.payload, title: msg.button.text || msg.button.payload }
              : undefined);

          await processInboundWhatsAppMessage({
            waMessageId: msg.id,
            fromPhoneRaw: `+${msg.from.replace(/^\+/, '')}`,
            profileName: contactsMap.get(msg.from),
            textBody: msg.text?.body,
            buttonReplyId: buttonReply?.id,
            buttonReplyTitle: buttonReply?.title,
            mediaStoragePath,
            referralSourceId: msg.referral?.source_id || null,
            referralHeadline: msg.referral?.headline || null,
            isSimulated: false,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
