import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import {
  listUserConnections,
  requestMutualConnection,
} from '@/lib/marketplace/connections';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const requestConnSchema = z.object({
  marketplaceType: z.literal('service').optional(),
  claimOrApplicationId: z.string().min(1),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const connections = await listUserConnections(session.uid);
    return jsonOk({ connections });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = requestConnSchema.parse(await request.json());
    const connection = await requestMutualConnection({
      marketplaceType: 'service',
      claimOrApplicationId: body.claimOrApplicationId,
      initiatorUid: session.uid,
    });
    return jsonOk({ connection }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
