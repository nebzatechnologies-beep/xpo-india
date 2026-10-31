import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '@/lib/services/platform-settings';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const settingsPatchSchema = z
  .object({
    roles: z
      .object({
        clientEnabled: z.boolean().optional(),
        partnerEnabled: z.boolean().optional(),
      })
      .optional(),
    matching: z
      .object({
        roundsEnabled: z.boolean().optional(),
        roundTimeoutSeconds: z.number().min(30).max(3600).optional(),
        batchSize: z.number().min(1).max(50).optional(),
        maxConcurrentOffers: z.number().min(1).max(50).optional(),
        deductOnExpired: z.boolean().optional(),
        deductOnDeclined: z.boolean().optional(),
        duplicateOffersPermitted: z.boolean().optional(),
        launchGeographyScope: z.enum(['india_only', 'global']).optional(),
      })
      .passthrough()
      .optional(),
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
    const settings = await getPlatformSettings();
    return jsonOk({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = settingsPatchSchema.parse(await request.json());
    const settings = await updatePlatformSettings(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  return PATCH(request);
}
