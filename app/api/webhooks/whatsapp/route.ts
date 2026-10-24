// ============================================================================
// XPO — Official Meta WhatsApp Cloud API Webhook & Simulator Endpoint
// Supports GET challenge verification and POST idempotent event processing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig, verifyMetaWebhookSignature } from '@/lib/whatsapp/provider';
import { processInboundWhatsAppMessage, getOrCreateWhatsAppSession } from '@/lib/whatsapp/conversation-engine';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const cfg = getWhatsAppConfig();

  if (mode === 'subscribe' && token === cfg.webhookVerifyToken) {
    return new NextResponse(challenge || 'OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Webhook verification failed: invalid hub.verify_token or hub.mode',
    },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const isSimulatedRequest = req.headers.get('x-xpo-simulated') === 'true';

    if (!isSimulatedRequest && !verifyMetaWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid X-Hub-Signature-256 webhook signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody || '{}');

    // Case 1: Official Meta WhatsApp Business Cloud API payload (object === 'whatsapp_business_account')
    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      const results = [];
      const store = getMockStore();

      for (const entry of body.entry) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const val = change.value || {};

          // Process delivery/read status updates
          if (Array.isArray(val.statuses)) {
            for (const st of val.statuses) {
              const wamid = st.id;
              const newStatus = st.status; // 'sent' | 'delivered' | 'read' | 'failed'
              for (const conv of store.whatsappConversations) {
                const msg = (conv.messages || []).find((m: any) => m.metaMessageId === wamid);
                if (msg && msg.status !== 'simulated') {
                  msg.status = newStatus;
                }
              }
            }
          }

          // Process incoming messages idempotently
          if (Array.isArray(val.messages)) {
            for (const msg of val.messages) {
              const fromPhone = msg.from ? `+${String(msg.from).replace(/^\+/, '')}` : '';
              const messageId = msg.id;
              let text = '';
              let attachmentType: string | undefined;

              if (msg.type === 'text') {
                text = msg.text?.body || '';
              } else if (msg.type === 'interactive') {
                text =
                  msg.interactive?.button_reply?.id ||
                  msg.interactive?.button_reply?.title ||
                  msg.interactive?.list_reply?.id ||
                  msg.interactive?.list_reply?.title ||
                  '';
              } else if (msg.type === 'button') {
                text = msg.button?.payload || msg.button?.text || '';
              } else {
                attachmentType = msg.type;
                text = msg[msg.type]?.caption || `[${msg.type}]`;
              }

              const campaignSource = msg.referral?.headline || msg.referral?.source_type || 'meta_ad';
              const res = await processInboundWhatsAppMessage({
                fromPhone,
                text,
                messageId,
                campaignSource,
                attachmentType,
              });
              results.push(res);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        processedCount: results.length,
        results,
      });
    }

    // Case 2: Direct Simulator / Campaign Entry payload from Superadmin WhatsApp Automation Centre
    if (body.fromPhone) {
      const result = await processInboundWhatsAppMessage({
        fromPhone: body.fromPhone,
        text: body.text || '',
        messageId: body.messageId || `sim_in_${Date.now()}`,
        campaignSource: body.campaignSource || 'direct',
        attachmentType: body.attachmentType,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Case 3: Fetch session state by phone
    if (body.action === 'get_session' && body.phone) {
      const session = getOrCreateWhatsAppSession(body.phone);
      return NextResponse.json({
        success: true,
        data: session,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unrecognized WhatsApp webhook payload format' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
