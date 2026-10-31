import { type NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/server-session';
import { unlockPartnerForClient } from '@/lib/marketplace/candidate-unlocks';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['client']);
    const { id } = await context.params;
    const result = await unlockPartnerForClient({
      clientUid: session.uid,
      claimId: id,
      sourceChannel: 'web',
    });
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
