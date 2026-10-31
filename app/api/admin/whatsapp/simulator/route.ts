import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { expireLeadOfferAndCascade } from '@/lib/marketplace/lead-distribution';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import { processInboundWhatsAppMessage } from '@/lib/whatsapp/conversation-engine';
import type {
  WhatsAppLeadOffer,
  WhatsAppMessageRecord,
  WhatsAppSession,
} from '@/lib/types/domain';

const simActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_inbound'),
    phoneE164: z.string().min(8),
    profileName: z.string().optional(),
    textBody: z.string().optional(),
    buttonReplyId: z.string().optional(),
    buttonReplyTitle: z.string().optional(),
  }),
  z.object({
    action: z.literal('fast_forward_expiry'),
    offerId: z.string().min(1),
  }),
  z.object({
    action: z.literal('reset_session'),
    phoneE164: z.string().min(8),
  }),
]);

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const phoneE164 = request.nextUrl.searchParams.get('phoneE164') || '+919900000001';
    const sessionId = `sim_${phoneE164}`;

    const [sessionSnap, msgSnap, offersSnap] = await Promise.all([
      db.collection('whatsapp_sessions').doc(sessionId).get(),
      db.collection('whatsapp_messages').where('sessionId', '==', sessionId).limit(200).get(),
      db
        .collection('whatsapp_lead_offers')
        .where('isSimulated', '==', true)
        .limit(50)
        .get(),
    ]);

    const messages = msgSnap.docs
      .map((d) => d.data() as WhatsAppMessageRecord)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const simulatedOffers = offersSnap.docs
      .map((d) => d.data() as WhatsAppLeadOffer)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return jsonOk({
      session: sessionSnap.exists ? (sessionSnap.data() as WhatsAppSession) : null,
      messages,
      simulatedOffers,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperadmin();
    const body = simActionSchema.parse(await request.json());
    const db = requireFirestore();

    if (body.action === 'reset_session') {
      const sessionId = `sim_${body.phoneE164}`;
      const msgSnap = await db
        .collection('whatsapp_messages')
        .where('sessionId', '==', sessionId)
        .get();
      const batch = db.batch();
      batch.delete(db.collection('whatsapp_sessions').doc(sessionId));
      for (const d of msgSnap.docs) batch.delete(d.ref);
      await batch.commit();
      return jsonOk({ reset: true });
    }

    if (body.action === 'fast_forward_expiry') {
      const result = await expireLeadOfferAndCascade(body.offerId, { forceImmediate: true });
      return jsonOk(result);
    }

    const sessionId = `sim_${body.phoneE164}`;
    const result = await processInboundWhatsAppMessage({
      waMessageId: generateDocId('sim_in'),
      fromPhoneRaw: body.phoneE164,
      profileName: body.profileName || 'Simulator Tester',
      textBody: body.textBody,
      buttonReplyId: body.buttonReplyId,
      buttonReplyTitle: body.buttonReplyTitle,
      isSimulated: true,
      simulatedSessionId: sessionId,
    });

    const msgSnap = await db
      .collection('whatsapp_messages')
      .where('sessionId', '==', sessionId)
      .limit(200)
      .get();
    const messages = msgSnap.docs
      .map((d) => d.data() as WhatsAppMessageRecord)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return jsonOk({
      session: result.session,
      messages,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
