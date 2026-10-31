import { getPlatformSettings } from '@/lib/services/platform-settings';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return jsonOk({
      subscriptions: {
        partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
        partnerPaidMonthlyClaims: settings.subscriptions.partnerPaidMonthlyClaims,
        partnerPlanUnlimited: settings.subscriptions.partnerPlanUnlimited,
        partnerInrMonthlyPrice: settings.subscriptions.partnerInrMonthlyPrice,
        partnerUsdMonthlyPrice: settings.subscriptions.partnerUsdMonthlyPrice,
        clientFreePartnerViews: settings.subscriptions.clientFreePartnerViews,
        clientPaidMonthlyPartnerViews: settings.subscriptions.clientPaidMonthlyPartnerViews,
        clientPlanUnlimited: settings.subscriptions.clientPlanUnlimited,
        clientInrMonthlyPrice: settings.subscriptions.clientInrMonthlyPrice,
        clientUsdMonthlyPrice: settings.subscriptions.clientUsdMonthlyPrice,
        gstPercentInr: settings.subscriptions.gstPercentInr ?? 18,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
