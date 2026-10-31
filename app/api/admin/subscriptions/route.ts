import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '@/lib/services/platform-settings';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { UserSubscription } from '@/lib/types/domain';

const adminSubscriptionsPatchSchema = z
  .object({
    subscriptions: z
      .object({
        partnerFreeClaims: z.number().min(0).max(100).optional(),
        partnerPaidMonthlyClaims: z.number().min(1).max(1000).optional(),
        partnerPlanUnlimited: z.boolean().optional(),
        partnerInrMonthlyPrice: z.number().min(0).optional(),
        partnerUsdMonthlyPrice: z.number().min(0).optional(),
        clientFreePartnerViews: z.number().min(0).max(100).optional(),
        clientPaidMonthlyPartnerViews: z.number().min(1).max(1000).optional(),
        clientPlanUnlimited: z.boolean().optional(),
        clientInrMonthlyPrice: z.number().min(0).optional(),
        clientUsdMonthlyPrice: z.number().min(0).optional(),
        gstPercentInr: z.number().min(0).max(50).optional(),
        unusedPaidAllowanceRollover: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export async function GET() {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const [settings, subsSnap] = await Promise.all([
      getPlatformSettings(),
      db.collection('subscriptions').orderBy('createdAt', 'desc').limit(150).get(),
    ]);

    return jsonOk({
      subscriptionSettings: settings.subscriptions,
      subscriptions: subsSnap.docs.map((d) => d.data() as UserSubscription),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = adminSubscriptionsPatchSchema.parse(await request.json());
    const payload = (body.subscriptions || body) as Record<string, unknown>;
    const updated = await updatePlatformSettings(
      { subscriptions: payload },
      { uid: session.uid, name: session.user.displayName }
    );
    return jsonOk({ subscriptionSettings: updated.subscriptions });
  } catch (err) {
    return handleApiError(err);
  }
}
