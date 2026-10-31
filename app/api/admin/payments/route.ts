import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { PaymentEventRecord } from '@/lib/types/domain';

export async function GET() {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const snap = await db
      .collection('payment_events')
      .orderBy('occurredAt', 'desc')
      .limit(200)
      .get();

    const events = snap.docs.map((d) => d.data() as PaymentEventRecord);
    const totalInr = events
      .filter((e) => e.status === 'captured' && e.currency === 'INR')
      .reduce((a, b) => a + b.amount, 0);
    const totalGstInr = events
      .filter((e) => e.status === 'captured' && e.currency === 'INR')
      .reduce((a, b) => a + b.taxAmount, 0);
    const totalUsd = events
      .filter((e) => e.status === 'captured' && e.currency === 'USD')
      .reduce((a, b) => a + b.amount, 0);

    return jsonOk({
      events,
      summary: {
        totalInr: Number(totalInr.toFixed(2)),
        totalGstInr: Number(totalGstInr.toFixed(2)),
        totalUsd: Number(totalUsd.toFixed(2)),
        failedEventsCount: events.filter((e) => e.status === 'failed').length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
