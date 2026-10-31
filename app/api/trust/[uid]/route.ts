import { type NextRequest } from 'next/server';
import { getMaskedTrustProfile } from '@/lib/services/verification';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;
    const profile = await getMaskedTrustProfile(uid);
    return jsonOk({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}
