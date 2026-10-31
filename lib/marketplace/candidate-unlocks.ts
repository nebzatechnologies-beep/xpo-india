import { requireFirestore } from '@/lib/firebase/admin';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import {
  ForbiddenError,
  NotFoundError,
  QuotaExceededError,
} from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  ClientCandidateUnlock,
  ClientLeadClaimView,
  ClientRoleProfile,
  EntitlementLedgerEntry,
  LeadClaim,
  TrustEvent,
} from '@/lib/types/domain';

/**
 * Zero-Trust Server-Side Redaction of LeadClaim records for Clients.
 * Never exposes `partnerUid`, `partnerBusinessName`, `partnerPortfolioUrl`, or `capabilityNote`
 * when `unlockedByClient !== true`.
 */
export function redactClaimForClient(claim: LeadClaim): ClientLeadClaimView {
  const isUnlocked = Boolean(claim.unlockedByClient);

  if (!isUnlocked) {
    return {
      id: claim.id,
      reqId: claim.reqId,
      xpoCode: claim.xpoCode,
      offerId: claim.offerId,
      partnerUid: '',
      partnerBusinessName: 'Verified XPO Partner',
      partnerCity: claim.partnerCity || 'India',
      partnerVerificationStatus: claim.partnerVerificationStatus,
      clientUid: claim.clientUid,
      status: claim.status,
      connectionId: claim.connectionId || null,
      unlockedByClient: false,
      unlockedAt: null,
      clientEntitlementUsed: null,
      isSimulated: claim.isSimulated,
      claimedAt: claim.claimedAt,
      updatedAt: claim.updatedAt,
    };
  }

  return {
    id: claim.id,
    reqId: claim.reqId,
    xpoCode: claim.xpoCode,
    offerId: claim.offerId,
    partnerUid: claim.partnerUid,
    partnerBusinessName: claim.partnerBusinessName,
    partnerCity: claim.partnerCity,
    partnerVerificationStatus: claim.partnerVerificationStatus,
    partnerPortfolioUrl: claim.partnerPortfolioUrl,
    capabilityNote: claim.capabilityNote,
    clientUid: claim.clientUid,
    status: claim.status,
    connectionId: claim.connectionId || null,
    unlockedByClient: true,
    unlockedAt: claim.unlockedAt || claim.claimedAt,
    clientEntitlementUsed: claim.clientEntitlementUsed || 'free',
    isSimulated: claim.isSimulated,
    claimedAt: claim.claimedAt,
    updatedAt: claim.updatedAt,
  };
}

/**
 * Atomic, Idempotent Client Partner-View Unlock Transaction:
 * - Checks `client_candidate_unlocks/{clientUid}_{claimId}` first (Unlock Once, View Forever — 0 double deductions)
 * - Consumes 1 initial free view (`freePartnerViewsRemaining`), or active Client Plan (`paidViewsUnlimited` / `paidPartnerViewsRemaining`)
 * - Throws `QuotaExceededError` (HTTP 402) when quota is exhausted
 */
export async function unlockPartnerForClient(params: {
  clientUid: string;
  claimId: string;
  sourceChannel: 'whatsapp' | 'web';
}): Promise<{
  claim: ClientLeadClaimView;
  alreadyUnlocked: boolean;
  remainingFreeViews: number;
  remainingPaidViews: number;
  unlimitedViews: boolean;
}> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const nowIso = new Date().toISOString();

  let viewResult!: ClientLeadClaimView;
  let alreadyUnlocked = false;
  let remainingFreeViews = 0;
  let remainingPaidViews = 0;
  let unlimitedViews = false;

  await db.runTransaction(async (tx) => {
    const claimRef = db.collection('lead_claims').doc(params.claimId);
    const unlockDocId = `${params.clientUid}_${params.claimId}`;
    const unlockRef = db.collection('client_candidate_unlocks').doc(unlockDocId);
    const clientProfRef = db.collection('role_profiles').doc(`${params.clientUid}_client`);

    const [claimSnap, unlockSnap, clientProfSnap] = await Promise.all([
      tx.get(claimRef),
      tx.get(unlockRef),
      tx.get(clientProfRef),
    ]);

    if (!claimSnap.exists) {
      throw new NotFoundError('Interested Partner response not found.');
    }
    const claim = claimSnap.data() as LeadClaim;

    if (claim.clientUid !== params.clientUid) {
      throw new ForbiddenError(
        'You can only view Partners who responded to your own requirements.'
      );
    }

    if (!clientProfSnap.exists) {
      throw new ForbiddenError('Active Client profile is required to unlock Partner profiles.');
    }
    const clientProf = clientProfSnap.data() as ClientRoleProfile;

    // Idempotent check: already unlocked previously (for this claim or this partner) -> 0 credit deducted!
    const partnerUnlockRef = db
      .collection('client_candidate_unlocks')
      .doc(`${params.clientUid}_partner_${claim.partnerUid}`);
    const partnerUnlockSnap = await tx.get(partnerUnlockRef);

    if (unlockSnap.exists || partnerUnlockSnap.exists || claim.unlockedByClient) {
      alreadyUnlocked = true;
      remainingFreeViews = clientProf.freePartnerViewsRemaining || 0;
      remainingPaidViews = clientProf.paidPartnerViewsRemaining || 0;
      unlimitedViews = Boolean(clientProf.paidViewsUnlimited);

      if (!claim.unlockedByClient) {
        tx.set(
          claimRef,
          { unlockedByClient: true, unlockedAt: nowIso, updatedAt: nowIso },
          { merge: true }
        );
      }
      viewResult = redactClaimForClient({
        ...claim,
        unlockedByClient: true,
        unlockedAt: claim.unlockedAt || nowIso,
      });
      return;
    }

    let nextFree = clientProf.freePartnerViewsRemaining || 0;
    let nextPaid = clientProf.paidPartnerViewsRemaining || 0;
    const isUnlimited = Boolean(clientProf.paidViewsUnlimited);

    let entitlementUsed: 'free' | 'paid';
    let creditPool: EntitlementLedgerEntry['creditPool'];
    let delta = -1;

    if (nextFree >= 1) {
      nextFree -= 1;
      entitlementUsed = 'free';
      creditPool = 'free';
    } else if (isUnlimited) {
      entitlementUsed = 'paid';
      creditPool = 'unlimited';
      delta = 0;
    } else if (nextPaid >= 1) {
      nextPaid -= 1;
      entitlementUsed = 'paid';
      creditPool = 'paid';
    } else {
      const allowanceText = settings.subscriptions.clientPlanUnlimited
        ? 'unlimited Partner views'
        : `${settings.subscriptions.clientPaidMonthlyPartnerViews} Partner views/month`;
      throw new QuotaExceededError(
        `You have used all ${settings.subscriptions.clientFreePartnerViews} free Partner views. Activate the XPO Client Plan to unlock ${allowanceText}.`,
        {
          role: 'client',
          inrPrice: settings.subscriptions.clientInrMonthlyPrice,
          usdPrice: settings.subscriptions.clientUsdMonthlyPrice,
          monthlyAllowance: settings.subscriptions.clientPaidMonthlyPartnerViews,
          unlimited: settings.subscriptions.clientPlanUnlimited,
        }
      );
    }

    const updatedClaim: LeadClaim = {
      ...claim,
      unlockedByClient: true,
      unlockedAt: nowIso,
      clientEntitlementUsed: entitlementUsed,
      updatedAt: nowIso,
    };

    const unlockRecord: ClientCandidateUnlock = {
      id: unlockDocId,
      clientUid: params.clientUid,
      claimId: claim.id,
      reqId: claim.reqId,
      xpoCode: claim.xpoCode,
      partnerUid: claim.partnerUid,
      entitlementUsed,
      sourceChannel: params.sourceChannel,
      unlockedAt: nowIso,
    };

    const ledgerId = generateDocId('led');
    const ledgerEntry: EntitlementLedgerEntry = {
      id: ledgerId,
      uid: params.clientUid,
      role: 'client',
      eventType: 'client_partner_unlock',
      creditPool,
      delta,
      balanceAfter: {
        freeRemaining: nextFree,
        paidRemaining: nextPaid,
        unlimited: isUnlimited,
      },
      referenceId: claim.id,
      summary: `Unlocked interested Partner profile for requirement ${claim.xpoCode}`,
      createdAt: nowIso,
    };

    const tevId = generateDocId('tev');
    const trustEvt: TrustEvent = {
      id: tevId,
      uid: params.clientUid,
      businessId: clientProf.businessId || null,
      type: 'partner_unlocked',
      summary: `Unlocked interested Partner profile on requirement ${claim.xpoCode}`,
      referenceId: claim.id,
      createdAt: nowIso,
    };

    tx.set(claimRef, updatedClaim);
    tx.set(unlockRef, unlockRecord);
    tx.set(partnerUnlockRef, {
      ...unlockRecord,
      id: `${params.clientUid}_partner_${claim.partnerUid}`,
    });
    tx.set(
      clientProfRef,
      {
        freePartnerViewsRemaining: nextFree,
        paidPartnerViewsRemaining: nextPaid,
        totalPartnersViewed: (clientProf.totalPartnersViewed || 0) + 1,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    tx.set(db.collection('entitlement_ledger').doc(ledgerId), ledgerEntry);
    tx.set(db.collection('trust_events').doc(tevId), trustEvt);

    remainingFreeViews = nextFree;
    remainingPaidViews = nextPaid;
    unlimitedViews = isUnlimited;
    viewResult = redactClaimForClient(updatedClaim);
  });

  return {
    claim: viewResult,
    alreadyUnlocked,
    remainingFreeViews,
    remainingPaidViews,
    unlimitedViews,
  };
}
