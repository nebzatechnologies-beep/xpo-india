import { type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { WhatsAppLeadOffer, WhatsAppMessageRecord } from '@/lib/types/domain';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const includeSim = request.nextUrl.searchParams.get('includeSimulated') === 'true';

    const [msgSnap, offerSnap, webhookSnap] = await Promise.all([
      db.collection('whatsapp_messages').orderBy('createdAt', 'desc').limit(150).get(),
      db.collection('whatsapp_lead_offers').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('webhook_events').orderBy('createdAt', 'desc').limit(100).get(),
    ]);

    let messages = msgSnap.docs.map((d) => d.data() as WhatsAppMessageRecord);
    let offers = offerSnap.docs.map((d) => d.data() as WhatsAppLeadOffer);

    if (!includeSim) {
      messages = messages.filter((m) => !m.isSimulated);
      offers = offers.filter((o) => !o.isSimulated);
    }

    const totalCostInr = messages.reduce((acc, m) => acc + (m.estimatedCostInr || 0), 0);
    const failedMessages = messages.filter((m) => m.deliveryStatus === 'failed').length;

    return jsonOk({
      messages,
      offers,
      webhookEvents: webhookSnap.docs.map((d) => d.data()),
      summary: {
        totalMessages: messages.length,
        failedMessages,
        totalEstimatedCostInr: Number(totalCostInr.toFixed(2)),
        activeOffers: offers.filter((o) => o.status === 'dispatched' || o.status === 'delivered')
          .length,
        expiredOffers: offers.filter((o) => o.status === 'expired').length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
