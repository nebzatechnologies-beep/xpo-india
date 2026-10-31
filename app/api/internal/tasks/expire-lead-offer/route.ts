import { NextResponse, type NextRequest } from 'next/server';
import {
  expireLeadOfferAndCascade,
  reconcileOverdueLeadOffers,
} from '@/lib/marketplace/lead-distribution';
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
    const body = (await request.json()) as {
      offerId?: string;
      reconcileAll?: boolean;
      scheduledTaskId?: string;
    };

    if (body.reconcileAll) {
      const res = await reconcileOverdueLeadOffers();
      return NextResponse.json({ ok: true, ...res });
    }

    let result = { expired: false, cascadedCount: 0 };
    if (body.offerId) {
      result = await expireLeadOfferAndCascade(body.offerId);
    }
    await markScheduledTaskCompleted(body.scheduledTaskId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
