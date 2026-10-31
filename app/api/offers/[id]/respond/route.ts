import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/server-session';
import { respondToLeadOffer } from '@/lib/marketplace/lead-distribution';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const respondSchema = z.object({
  action: z.enum(['claim', 'decline']),
  capabilityNote: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['partner']);
    const { id } = await context.params;
    const body = respondSchema.parse(await request.json());

    const result = await respondToLeadOffer({
      offerId: id,
      partnerUid: session.uid,
      action: body.action,
      capabilityNote: body.capabilityNote,
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
