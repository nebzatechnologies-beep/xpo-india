import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { redactClaimForClient } from '@/lib/marketplace/candidate-unlocks';
import { getUserRoleProfiles } from '@/lib/services/users';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { LeadClaim, ServiceRequirement } from '@/lib/types/domain';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const db = requireFirestore();
    const roleFilter = request.nextUrl.searchParams.get('role') || session.user.role;

    const isClientQuery = roleFilter === 'client';
    const field = isClientQuery ? 'clientUid' : 'partnerUid';
    const snap = await db
      .collection('lead_claims')
      .where(field, '==', session.uid)
      .limit(100)
      .get();

    const claims = snap.docs
      .map((d) => d.data() as LeadClaim)
      .filter((c) => !c.isSimulated)
      .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));

    const enriched = await Promise.all(
      claims.map(async (c) => {
        const reqSnap = await db.collection('requirements').doc(c.reqId).get();
        const req = reqSnap.exists ? (reqSnap.data() as ServiceRequirement) : null;
        const dto =
          isClientQuery && !session.user.isSuperadmin ? redactClaimForClient(c) : c;
        return {
          ...dto,
          requirementTitle: req?.title || c.xpoCode,
          categoryName: req?.categoryName || '',
          workLocation: req?.workLocation || '',
        };
      })
    );

    const profiles = isClientQuery ? await getUserRoleProfiles(session.uid) : null;

    return jsonOk({
      claims: enriched,
      clientViewCredits: profiles?.client
        ? {
            freePartnerViewsRemaining: profiles.client.freePartnerViewsRemaining,
            paidPartnerViewsRemaining: profiles.client.paidPartnerViewsRemaining,
            paidViewsUnlimited: Boolean(profiles.client.paidViewsUnlimited),
            totalPartnersViewed: profiles.client.totalPartnersViewed || 0,
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
