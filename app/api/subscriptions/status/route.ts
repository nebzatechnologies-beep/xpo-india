import { requireAuth } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getUserRoleProfiles } from '@/lib/services/users';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type {
  EntitlementLedgerEntry,
  PaymentEventRecord,
  UserSubscription,
} from '@/lib/types/domain';

export async function GET() {
  try {
    const session = await requireAuth();
    const db = requireFirestore();

    const [subsSnap, evtsSnap, ledgerSnap, profiles, settings] = await Promise.all([
      db.collection('subscriptions').where('uid', '==', session.uid).limit(20).get(),
      db.collection('payment_events').where('uid', '==', session.uid).limit(30).get(),
      db.collection('entitlement_ledger').where('uid', '==', session.uid).limit(40).get(),
      getUserRoleProfiles(session.uid),
      getPlatformSettings(),
    ]);

    const subscriptions = subsSnap.docs
      .map((d) => d.data() as UserSubscription)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const paymentEvents = evtsSnap.docs
      .map((d) => d.data() as PaymentEventRecord)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const ledger = ledgerSnap.docs
      .map((d) => d.data() as EntitlementLedgerEntry)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return jsonOk({
      role: session.user.role,
      subscriptions,
      paymentEvents,
      ledger,
      quotas: {
        client: profiles.client
          ? {
              freePartnerViewsRemaining: profiles.client.freePartnerViewsRemaining,
              paidPartnerViewsRemaining: profiles.client.paidPartnerViewsRemaining,
              paidViewsUnlimited: Boolean(profiles.client.paidViewsUnlimited),
              totalPartnersViewed: profiles.client.totalPartnersViewed || 0,
            }
          : null,
        partner: profiles.partner
          ? {
              freeClaimsRemaining: profiles.partner.freeClaimsRemaining,
              paidClaimsRemaining: profiles.partner.paidClaimsRemaining,
              paidClaimsUnlimited: Boolean(profiles.partner.paidClaimsUnlimited),
              totalValidClaims: profiles.partner.totalValidClaims || 0,
            }
          : null,
      },
      pricingConfig: settings.subscriptions,
      billingCurrency: session.user.billingCurrency,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
