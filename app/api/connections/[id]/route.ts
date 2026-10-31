import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { respondToMutualConnection } from '@/lib/marketplace/connections';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const respondConnSchema = z.object({
  decision: z.enum(['accepted', 'declined']),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = respondConnSchema.parse(await request.json());
    const connection = await respondToMutualConnection({
      connectionId: id,
      recipientUid: session.uid,
      decision: body.decision,
    });
    return jsonOk({ connection });
  } catch (err) {
    return handleApiError(err);
  }
}
