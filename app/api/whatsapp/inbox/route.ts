import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';
import { dispatchWhatsAppMessage } from '@/lib/whatsapp/provider';
import { processInboundWhatsAppMessage } from '@/lib/whatsapp/conversation-engine';

export async function GET() {
  const store = getMockStore() as any;
  return NextResponse.json({
    success: true,
    data: store.whatsappConversations,
    sessions: store.whatsappSessions || [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    // Allow simulating an inbound customer message directly from the Inbox / Simulator
    if (body.direction === 'inbound_simulated') {
      const result = await processInboundWhatsAppMessage({
        fromPhone: body.phone || '+91 98200 11223',
        text: body.text || 'MENU',
        campaignSource: body.campaignSource || 'direct',
        attachmentType: body.attachmentType,
      });
      return NextResponse.json({
        success: true,
        message: 'Processed inbound WhatsApp message through stateful conversation engine',
        data: result,
      });
    }

    const { conversationId, text } = body;
    const conv = store.whatsappConversations.find((c: any) => c.id === conversationId);
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const dispatchRes = await dispatchWhatsAppMessage({
      toPhoneE164: conv.whatsapp,
      text,
    });

    const newMsg = {
      id: 'msg_' + Date.now(),
      conversationId,
      sender: 'outbound',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Never represent simulated messages as real delivered messages (Module 2)
      status: dispatchRes.status,
      providerMode: dispatchRes.providerMode,
      metaMessageId: dispatchRes.metaMessageId,
    };

    conv.messages.push(newMsg as any);
    conv.lastMessage = text;
    conv.lastMessageTime = 'Just now';

    return NextResponse.json({
      success: true,
      message:
        dispatchRes.providerMode === 'simulated'
          ? 'Message logged via Simulated WhatsApp Provider (Status: SIMULATED)'
          : 'Message sent via Meta WhatsApp Cloud API',
      data: newMsg
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
