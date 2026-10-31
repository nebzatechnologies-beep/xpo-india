import { NextResponse, type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { getExecutiveDashboardAnalytics } from '@/lib/services/analytics';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const analytics = await getExecutiveDashboardAnalytics();

    if (request.nextUrl.searchParams.get('format') === 'csv') {
      const k = analytics.commercialHealthKpis;
      const o = analytics.overviewCounts;
      const lines = [
        'Metric,Value',
        `Client Database Contacts,${o.clientDatabaseCount}`,
        `Client Database Opted-In,${o.clientOptedInCount}`,
        `Partner Database Contacts,${o.partnerDatabaseCount}`,
        `Partner Database Opted-In,${o.partnerOptedInCount}`,
        `Client WhatsApp Invitations Sent,${o.clientInvitationsSent}`,
        `Partner WhatsApp Invitations Sent,${o.partnerInvitationsSent}`,
        `Registered Clients,${o.clientsCount}`,
        `Registered Partners,${o.partnersCount}`,
        `Total Client Requirements,${o.totalRequirements}`,
        `Active Distributing Requirements,${o.activeRequirements}`,
        `5-Min Partner Offers Dispatched,${o.offersDispatchedCount}`,
        `5-Min Partner Responses (Claimed),${o.offersClaimedCount}`,
        `Partner Profiles Unlocked by Clients,${o.partnerProfilesUnlockedCount}`,
        `Mutual Connections Accepted,${o.acceptedConnectionsCount}`,
        `Active Client Subscriptions,${o.activeClientPlans}`,
        `Active Partner Subscriptions,${o.activePartnerPlans}`,
        `Total INR Revenue,${o.revenueInrTotal}`,
        `Total USD Revenue,${o.revenueUsdTotal}`,
        `Estimated WhatsApp Spend INR,${o.whatsappCostInrTotal}`,
        `Avg Requirement to Match (sec),${k.avgRequirementToMatchSeconds}`,
        `First Round Partner Response Rate (%),${k.firstRoundPartnerResponseRatePercent}`,
        `Avg Time to 3 Interested Partners (min),${k.avgTimeToThreeInterestedMinutes}`,
        `Offer Expiry Rate (%),${k.offerExpiryRatePercent}`,
        `Mutual Connection Acceptance Rate (%),${k.mutualConnectionAcceptanceRatePercent}`,
        `Free-to-Paid Partner Conversion (%),${k.freeToPaidPartnerConversionPercent}`,
        `Free-to-Paid Client Conversion (%),${k.freeToPaidClientConversionPercent}`,
        `Monthly Subscription Retention (%),${k.monthlySubscriptionRetentionPercent}`,
        `WhatsApp Delivery Success (%),${k.whatsappDeliverySuccessPercent}`,
        `Opt-Out Suppression Rate (%),${k.optOutSuppressionRatePercent}`,
        `Verified Profile Percentage (%),${k.verifiedProfilePercent}`,
        `Abuse/Spam Incident Rate (%),${k.abuseSpamIncidentRatePercent}`,
      ];
      return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="XPO_Monitoring_Report.csv"',
        },
      });
    }

    return jsonOk(analytics);
  } catch (err) {
    return handleApiError(err);
  }
}
