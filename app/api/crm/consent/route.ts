import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { recordWhatsAppConsent } from '@/lib/services/crm';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { WhatsAppConsentRecord } from '@/lib/types/domain';

const consentSchema = z.object({
  phoneE164: z.string().min(6),
  newStatus: z.enum(['none', 'consent_pending', 'opted_in', 'opted_out']),
  evidenceNote: z.string().min(3),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const phoneE164 = request.nextUrl.searchParams.get('phoneE164');

    let query: FirebaseFirestore.Query = db
      .collection('whatsapp_consent_records')
      .orderBy('createdAt', 'desc')
      .limit(150);

    if (phoneE164) {
      query = db
        .collection('whatsapp_consent_records')
        .where('phoneE164', '==', phoneE164)
        .limit(100);
    }

    const [recordsSnap, supSnap] = await Promise.all([
      query.get(),
      db.collection('suppression_list').where('active', '==', true).limit(250).get(),
    ]);

    return jsonOk({
      records: recordsSnap.docs.map((d) => d.data() as WhatsAppConsentRecord),
      suppressed: supSnap.docs.map((d) => d.data()),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = consentSchema.parse(await request.json());
    const record = await recordWhatsAppConsent({
      phoneE164: body.phoneE164,
      newStatus: body.newStatus,
      channel: 'superadmin_manual',
      evidenceNote: body.evidenceNote,
      actorId: session.uid,
    });
    return jsonOk({ record }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
