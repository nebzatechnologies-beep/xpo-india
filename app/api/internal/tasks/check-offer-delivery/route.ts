import { NextResponse, type NextRequest } from 'next/server';
import { checkOfferDeliveryFallback } from '@/lib/marketplace/lead-distribution';
import {
  markScheduledTaskCompleted,
  verifyInternalWorkerSecret,
} from '@/lib/tasks/cloud-tasks';
import { handleApiError } from '@/lib/utils/api-handler';

export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalWorkerSecret(request.headers.get('authorization'))) {
      return NextResponse.json({ ok: false, error: 'Unauthorized worker call' }, { status: 401 });
    }
    const body = (await request.json()) as { offerId?: string; scheduledTaskId?: string };
    if (body.offerId) {
      await checkOfferDeliveryFallback(body.offerId);
    }
    await markScheduledTaskCompleted(body.scheduledTaskId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
