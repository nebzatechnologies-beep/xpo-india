import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { createSupportOrAbuseTicket } from '@/lib/services/support';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const dpdpSchema = z.object({
  requestType: z.enum(['dpdp_data_correction', 'dpdp_account_deletion']),
  details: z.string().min(5, 'Please provide reason or correction details'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = dpdpSchema.parse(await request.json());
    const ticket = await createSupportOrAbuseTicket({
      reporterUid: session.uid,
      reporterPhoneE164: session.user.phoneE164,
      targetType: 'account_privacy',
      targetId: session.uid,
      type: body.requestType,
      subject:
        body.requestType === 'dpdp_account_deletion'
          ? 'DPDP Statutory Account & PII Deletion Request'
          : 'DPDP Statutory Personal Data Correction Request',
      description: body.details,
    });
    return jsonOk({ ticket }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
