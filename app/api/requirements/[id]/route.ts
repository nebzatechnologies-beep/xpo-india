import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { redactClaimForClient } from '@/lib/marketplace/candidate-unlocks';
import { getServiceRequirementDetails } from '@/lib/marketplace/requirements';
import {
  ForbiddenError,
  handleApiError,
  jsonOk,
  NotFoundError,
} from '@/lib/utils/api-handler';
import type { ServiceRequirement } from '@/lib/types/domain';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const details = await getServiceRequirementDetails(id);

    if (
      !session.user.isSuperadmin &&
      details.requirement.clientUid !== session.uid
    ) {
      throw new ForbiddenError('You can only inspect requirements posted by your account.');
    }

    if (session.user.isSuperadmin) {
      return jsonOk(details);
    }

    // Zero-trust server-side redaction for Client reads so locked Partner identities never leak
    const safeCandidates = details.candidates.map((c) => ({
      ...c,
      candidateUid: '',
      phoneE164: 'MASKED',
      displayName: 'Matched XPO Partner',
      businessName: 'Matched XPO Partner',
    }));

    const safeOffers = details.offers.map((o) => ({
      ...o,
      partnerUid: '',
      partnerPhoneE164: 'MASKED',
      partnerName: 'Matched XPO Partner',
    }));

    const safeClaims = details.claims.map((clm) => redactClaimForClient(clm));

    return jsonOk({
      requirement: details.requirement,
      candidates: safeCandidates,
      offers: safeOffers,
      claims: safeClaims,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const db = requireFirestore();
    const ref = db.collection('requirements').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Requirement not found');

    const req = snap.data() as ServiceRequirement;
    if (!session.user.isSuperadmin && req.clientUid !== session.uid) {
      throw new ForbiddenError('Not authorized to modify this requirement.');
    }

    const body = (await request.json()) as { action?: string };
    if (body.action === 'close') {
      const nowIso = new Date().toISOString();
      await ref.set(
        { distributionStatus: 'closed', closedAt: nowIso, updatedAt: nowIso },
        { merge: true }
      );
      if (req.distributionStatus !== 'closed') {
        const profRef = db.collection('role_profiles').doc(`${req.clientUid}_client`);
        const profSnap = await profRef.get();
        if (profSnap.exists) {
          const currentCount = (profSnap.data()?.activeRequirementsCount as number) || 0;
          await profRef.set(
            { activeRequirementsCount: Math.max(0, currentCount - 1), updatedAt: nowIso },
            { merge: true }
          );
        }
      }
    }

    return jsonOk({ requirement: (await ref.get()).data() });
  } catch (err) {
    return handleApiError(err);
  }
}
