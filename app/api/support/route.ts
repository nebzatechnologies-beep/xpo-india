import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { createSupportOrAbuseTicket } from '@/lib/services/support';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { SupportTicket } from '@/lib/types/domain';

const createTicketSchema = z.object({
  targetType: z
    .enum(['requirement', 'user', 'connection', 'account_privacy'])
    .optional(),
  targetId: z.string().optional().nullable(),
  type: z.enum([
    'fake_requirement',
    'fraudulent_profile',
    'spam',
    'inappropriate_conduct',
    'unauthorized_contact_sharing',
    'whatsapp_support',
    'dpdp_data_correction',
    'dpdp_account_deletion',
  ]),
  subject: z.string().min(3),
  description: z.string().min(10),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const db = requireFirestore();
    const snap = await db
      .collection('support_tickets')
      .where('reporterUid', '==', session.uid)
      .limit(50)
      .get();

    const tickets = snap.docs
      .map((d) => d.data() as SupportTicket)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return jsonOk({ tickets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = createTicketSchema.parse(await request.json());
    const ticket = await createSupportOrAbuseTicket({
      reporterUid: session.uid,
      reporterPhoneE164: session.user.phoneE164,
      ...body,
    });
    return jsonOk({ ticket }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
