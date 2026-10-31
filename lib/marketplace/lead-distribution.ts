import { requireFirestore } from '@/lib/firebase/admin';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getUserByUid } from '@/lib/services/users';
import { enqueueCloudTask } from '@/lib/tasks/cloud-tasks';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  QuotaExceededError,
} from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import { getMetaWhatsAppConfig } from '@/lib/whatsapp/meta-client';
import { dispatchOutboundWhatsApp } from '@/lib/whatsapp/notification-service';
import type {
  EntitlementLedgerEntry,
  LeadClaim,
  MatchCandidateItem,
  PartnerRoleProfile,
  ServiceRequirement,
  TrustEvent,
  WhatsAppLeadOffer,
} from '@/lib/types/domain';

function resolveSessionIdForPhone(phoneE164: string, isSimulated: boolean): string {
  return isSimulated ? `sim_${phoneE164}` : phoneE164;
}

/**
 * Dispatches the next batch of up to `partnersPerRound` (default 3) 5-minute WhatsApp
 * Lead Offers for an approved ServiceRequirement.
 */
export async function dispatchNextOfferRound(reqId: string): Promise<{
  dispatchedOffers: WhatsAppLeadOffer[];
  distributionStatus: ServiceRequirement['distributionStatus'];
}> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const reqRef = db.collection('requirements').doc(reqId);
  const reqSnap = await reqRef.get();

  if (!reqSnap.exists) throw new NotFoundError('Requirement not found');
  const req = reqSnap.data() as ServiceRequirement;

  if (
    req.moderationStatus !== 'approved' ||
    req.distributionStatus === 'closed' ||
    req.interestedCount >= req.targetInterestedCount
  ) {
    if (
      req.interestedCount >= req.targetInterestedCount &&
      req.distributionStatus !== 'target_reached'
    ) {
      await reqRef.set(
        { distributionStatus: 'target_reached', updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return { dispatchedOffers: [], distributionStatus: 'target_reached' };
    }
    return { dispatchedOffers: [], distributionStatus: req.distributionStatus };
  }

  const openOffersSnap = await db
    .collection('whatsapp_lead_offers')
    .where('reqId', '==', reqId)
    .where('status', 'in', ['dispatched', 'delivered'])
    .get();

  const activeOpenCount = openOffersSnap.size;
  const slotsToFill = Math.max(0, settings.leadDistribution.partnersPerRound - activeOpenCount);

  if (slotsToFill === 0) {
    return { dispatchedOffers: [], distributionStatus: 'distributing' };
  }

  const candSnap = await reqRef
    .collection('match_candidates')
    .where('offerStatus', '==', 'queued')
    .get();

  const queuedCandidates = candSnap.docs
    .map((d) => d.data() as MatchCandidateItem)
    .sort((a, b) => b.finalScore - a.finalScore);

  if (queuedCandidates.length === 0) {
    const nextStatus = activeOpenCount > 0 ? 'distributing' : 'pool_exhausted';
    await reqRef.set(
      { distributionStatus: nextStatus, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return { dispatchedOffers: [], distributionStatus: nextStatus };
  }

  const selected = queuedCandidates.slice(0, slotsToFill);
  const nextRound = (req.currentRound || 0) + 1;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const windowSec = settings.leadDistribution.responseWindowSeconds || 300;
  const fallbackSec =
    settings.leadDistribution.clockStartPolicy === 'on_delivered_with_60s_fallback'
      ? settings.leadDistribution.deliveryFallbackSeconds || 60
      : 0;

  const initialExpiresIso = new Date(nowMs + (windowSec + fallbackSec) * 1000).toISOString();
  const dispatchedOffers: WhatsAppLeadOffer[] = [];

  const waConfig = await getMetaWhatsAppConfig().catch(() => null);
  const hasMetaWa = Boolean(waConfig?.phoneNumberId && waConfig?.accessToken);

  for (const cand of selected) {
    const offerId = generateDocId('off');
    const sessionId = resolveSessionIdForPhone(cand.phoneE164, req.isSimulated);
    const budgetText =
      req.budgetMode === 'specified' && req.estimatedBudget
        ? req.estimatedBudget
        : 'To be discussed';

    const offerBody =
      `*New XPO Business Opportunity* (${req.xpoCode})\n\n` +
      `*Requirement:* ${req.title}\n` +
      `*Category:* ${req.categoryName}${req.subcategoryName ? ` › ${req.subcategoryName}` : ''}\n` +
      `*Location:* ${req.workLocation}\n` +
      `*Timeline:* ${req.timeline}\n` +
      `*Budget:* ${budgetText}\n` +
      `*Client Status:* ${req.clientVerificationStatus === 'verified' ? 'KYC Verified Client' : 'Phone Verified Client'}\n\n` +
      `⏱ *5-Minute Priority Window:* Tap *I'm Interested* within 5 minutes to express interest. Unanswered or declined notifications deduct *zero* credits.`;

    let waMessageId: string | null = null;
    if (hasMetaWa && !req.isSimulated) {
      try {
        const msgRecord = await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164: cand.phoneE164,
          isSimulated: req.isSimulated,
          messageType: 'interactive_buttons',
          headerText: 'XPO 5-Min Opportunity Alert',
          body: offerBody,
          footerText: 'Zero deduction on ignore or decline',
          interactiveOptions: [
            { id: `offer_claim:${offerId}`, title: "I'm Interested" },
            { id: `offer_decline:${offerId}`, title: 'Not Interested' },
            { id: `offer_details:${offerId}`, title: 'View Details' },
          ],
          outsideWindowTemplate: {
            name: 'xpo_partner_lead_offer_v1',
            language: 'en',
            category: 'UTILITY',
            variables: [
              cand.displayName,
              req.xpoCode,
              req.title,
              req.workLocation,
              req.timeline,
              budgetText,
            ],
          },
        });
        waMessageId = msgRecord.waMessageId;
      } catch (err) {
        await reqRef.collection('match_candidates').doc(cand.candidateUid).set(
          {
            offerStatus: 'delivery_failed',
            updatedAt: nowIso,
          },
          { merge: true }
        );
        console.error(`[LeadDistribution] Failed to dispatch offer to ${cand.phoneE164}:`, err);
        continue;
      }
    }

    const deliveryCheckTaskName =
      fallbackSec > 0 && !req.isSimulated && hasMetaWa
        ? await enqueueCloudTask({
            targetPath: '/api/internal/tasks/check-offer-delivery',
            payload: { offerId },
            delaySeconds: fallbackSec,
            taskIdHint: `chk_${offerId}`,
          })
        : null;

    const isDirectDelivery = req.isSimulated || !hasMetaWa;
    const expiryTaskName = !req.isSimulated
      ? await enqueueCloudTask({
          targetPath: '/api/internal/tasks/expire-lead-offer',
          payload: { offerId },
          delaySeconds: isDirectDelivery ? windowSec : windowSec + fallbackSec,
          taskIdHint: `exp_init_${offerId}`,
        })
      : null;

    const offerDoc: WhatsAppLeadOffer = {
      id: offerId,
      reqId: req.id,
      xpoCode: req.xpoCode,
      partnerUid: cand.candidateUid,
      partnerPhoneE164: cand.phoneE164,
      partnerName: cand.businessName || cand.displayName,
      round: nextRound,
      status: isDirectDelivery ? 'delivered' : 'dispatched',
      waMessageId,
      dispatchedAt: nowIso,
      deliveredAt: isDirectDelivery ? nowIso : null,
      clockStartedAt: nowIso,
      expiresAt: isDirectDelivery
        ? new Date(nowMs + windowSec * 1000).toISOString()
        : initialExpiresIso,
      deliveryCheckTaskName,
      expiryTaskName,
      isSimulated: req.isSimulated,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const batch = db.batch();
    batch.set(db.collection('whatsapp_lead_offers').doc(offerId), offerDoc);
    batch.set(
      reqRef.collection('match_candidates').doc(cand.candidateUid),
      {
        offerStatus: 'offered',
        offeredRound: nextRound,
        offerId,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    batch.set(
      db.collection('whatsapp_sessions').doc(sessionId),
      {
        id: sessionId,
        phoneE164: cand.phoneE164,
        uid: cand.candidateUid,
        state: 'OFFER_SENT',
        activeOfferId: offerId,
        isSimulated: req.isSimulated,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    const partnerProfRef = db.collection('role_profiles').doc(`${cand.candidateUid}_partner`);
    const partnerProfSnap = await partnerProfRef.get();
    if (partnerProfSnap.exists) {
      const pData = partnerProfSnap.data() as PartnerRoleProfile;
      const resetExpired =
        !pData.exposureResetAt || new Date(pData.exposureResetAt).getTime() < nowMs;
      batch.set(
        partnerProfRef,
        {
          lastOfferSentAt: nowIso,
          recentExposureCount24h: resetExpired ? 1 : (pData.recentExposureCount24h || 0) + 1,
          exposureResetAt: resetExpired
            ? new Date(nowMs + 24 * 60 * 60 * 1000).toISOString()
            : pData.exposureResetAt,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    }

    await batch.commit();
    dispatchedOffers.push(offerDoc);
  }

  const finalStatus: ServiceRequirement['distributionStatus'] =
    dispatchedOffers.length > 0 || activeOpenCount > 0 ? 'distributing' : 'pool_exhausted';

  await reqRef.set(
    {
      distributionStatus: finalStatus,
      currentRound: nextRound,
      offersSentCount: (req.offersSentCount || 0) + dispatchedOffers.length,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  return { dispatchedOffers, distributionStatus: finalStatus };
}

export async function handleOfferDeliveredWebhook(waMessageId: string): Promise<void> {
  const db = requireFirestore();
  const snap = await db
    .collection('whatsapp_lead_offers')
    .where('waMessageId', '==', waMessageId)
    .limit(1)
    .get();

  if (snap.empty) return;
  const offer = snap.docs[0]!.data() as WhatsAppLeadOffer;
  if (offer.status !== 'dispatched') return;

  const settings = await getPlatformSettings();
  const windowSec = settings.leadDistribution.responseWindowSeconds || 300;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const exactExpiresIso = new Date(nowMs + windowSec * 1000).toISOString();

  const expiryTaskName = await enqueueCloudTask({
    targetPath: '/api/internal/tasks/expire-lead-offer',
    payload: { offerId: offer.id },
    delaySeconds: windowSec,
    taskIdHint: `exp_deliv_${offer.id}`,
  });

  await snap.docs[0]!.ref.set(
    {
      status: 'delivered',
      deliveredAt: nowIso,
      clockStartedAt: nowIso,
      expiresAt: exactExpiresIso,
      expiryTaskName,
      updatedAt: nowIso,
    },
    { merge: true }
  );
}

export async function handleOfferFailedWebhook(
  waMessageId: string,
  failureReason: string
): Promise<void> {
  const db = requireFirestore();
  const snap = await db
    .collection('whatsapp_lead_offers')
    .where('waMessageId', '==', waMessageId)
    .limit(1)
    .get();

  if (snap.empty) return;
  const offer = snap.docs[0]!.data() as WhatsAppLeadOffer;
  if (offer.status !== 'dispatched' && offer.status !== 'delivered') return;

  const nowIso = new Date().toISOString();
  await Promise.all([
    snap.docs[0]!.ref.set(
      {
        status: 'delivery_failed',
        failureReason,
        updatedAt: nowIso,
      },
      { merge: true }
    ),
    db
      .collection('requirements')
      .doc(offer.reqId)
      .collection('match_candidates')
      .doc(offer.partnerUid)
      .set({ offerStatus: 'delivery_failed', updatedAt: nowIso }, { merge: true }),
  ]);

  await dispatchNextOfferRound(offer.reqId);
}

export async function checkOfferDeliveryFallback(offerId: string): Promise<void> {
  const db = requireFirestore();
  const ref = db.collection('whatsapp_lead_offers').doc(offerId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const offer = snap.data() as WhatsAppLeadOffer;
  if (offer.status !== 'dispatched') return;

  const settings = await getPlatformSettings();
  const windowSec = settings.leadDistribution.responseWindowSeconds || 300;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  await ref.set(
    {
      clockStartedAt: nowIso,
      expiresAt: new Date(nowMs + windowSec * 1000).toISOString(),
      updatedAt: nowIso,
    },
    { merge: true }
  );
}

/**
 * Expires an unanswered 5-minute Lead Offer with ZERO credit deduction and redirects
 * to the next ranked eligible Partners.
 */
export async function expireLeadOfferAndCascade(
  offerId: string,
  options?: { forceImmediate?: boolean }
): Promise<{ expired: boolean; cascadedCount: number }> {
  const db = requireFirestore();
  const ref = db.collection('whatsapp_lead_offers').doc(offerId);
  const snap = await ref.get();
  if (!snap.exists) return { expired: false, cascadedCount: 0 };

  const offer = snap.data() as WhatsAppLeadOffer;
  if (offer.status !== 'dispatched' && offer.status !== 'delivered') {
    return { expired: false, cascadedCount: 0 };
  }

  if (!options?.forceImmediate && Date.now() < new Date(offer.expiresAt).getTime() - 1500) {
    return { expired: false, cascadedCount: 0 };
  }

  const nowIso = new Date().toISOString();
  const sessionId = resolveSessionIdForPhone(offer.partnerPhoneE164, offer.isSimulated);

  await Promise.all([
    ref.set({ status: 'expired', respondedAt: nowIso, updatedAt: nowIso }, { merge: true }),
    db
      .collection('requirements')
      .doc(offer.reqId)
      .collection('match_candidates')
      .doc(offer.partnerUid)
      .set({ offerStatus: 'expired', updatedAt: nowIso }, { merge: true }),
    db
      .collection('whatsapp_sessions')
      .doc(sessionId)
      .set({ state: 'OFFER_EXPIRED', activeOfferId: null, updatedAt: nowIso }, { merge: true }),
  ]);

  const cascadeRes = await dispatchNextOfferRound(offer.reqId);
  return { expired: true, cascadedCount: cascadeRes.dispatchedOffers.length };
}

/**
 * Handles Partner's response (`claim` or `decline`) to a 5-minute Lead Offer.
 * Executes an atomic Firestore transaction for Claim + Partner Quota Deduction + Ledger Audit!
 */
export async function respondToLeadOffer(params: {
  offerId: string;
  partnerUid: string;
  action: 'claim' | 'decline';
  capabilityNote?: string;
}): Promise<{
  status: 'claimed' | 'declined';
  claim?: LeadClaim;
  remainingFreeClaims?: number;
  remainingPaidClaims?: number;
  unlimitedClaims?: boolean;
}> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (params.action === 'decline') {
    const offerRef = db.collection('whatsapp_lead_offers').doc(params.offerId);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) throw new NotFoundError('Lead offer not found');
    const offer = offerSnap.data() as WhatsAppLeadOffer;
    if (offer.partnerUid !== params.partnerUid) {
      throw new ForbiddenError('This lead offer belongs to another Partner account.');
    }
    if (offer.status === 'claimed') {
      throw new ConflictError('This lead offer has already been claimed.');
    }

    const sessionId = resolveSessionIdForPhone(offer.partnerPhoneE164, offer.isSimulated);
    await Promise.all([
      offerRef.set({ status: 'declined', respondedAt: nowIso, updatedAt: nowIso }, { merge: true }),
      db
        .collection('requirements')
        .doc(offer.reqId)
        .collection('match_candidates')
        .doc(offer.partnerUid)
        .set({ offerStatus: 'declined', updatedAt: nowIso }, { merge: true }),
      db
        .collection('whatsapp_sessions')
        .doc(sessionId)
        .set({ state: 'ACTIVE', activeOfferId: null, updatedAt: nowIso }, { merge: true }),
    ]);

    await dispatchNextOfferRound(offer.reqId);
    return { status: 'declined' };
  }

  let createdClaim!: LeadClaim;
  let remainingFreeClaims = 0;
  let remainingPaidClaims = 0;
  let unlimitedClaims = false;
  let clientUidToNotify = '';
  let reqTitle = '';
  let isSimulatedReq = false;

  await db.runTransaction(async (tx) => {
    const offerRef = db.collection('whatsapp_lead_offers').doc(params.offerId);
    const offerSnap = await tx.get(offerRef);
    if (!offerSnap.exists) throw new NotFoundError('Lead offer not found');
    const offer = offerSnap.data() as WhatsAppLeadOffer;

    if (offer.partnerUid !== params.partnerUid) {
      throw new ForbiddenError('You cannot claim an offer assigned to another Partner.');
    }
    if (offer.status === 'claimed') {
      throw new ConflictError('You have already claimed this lead.');
    }
    if (offer.status !== 'dispatched' && offer.status !== 'delivered') {
      throw new ConflictError(
        `This 5-minute opportunity window is ${offer.status} and can no longer be claimed.`
      );
    }
    if (nowMs > new Date(offer.expiresAt).getTime()) {
      throw new ConflictError(
        'The 5-minute response window for this opportunity has expired. Zero credits were deducted.'
      );
    }

    const reqRef = db.collection('requirements').doc(offer.reqId);
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new NotFoundError('Requirement not found');
    const req = reqSnap.data() as ServiceRequirement;

    if (req.distributionStatus === 'closed' || req.interestedCount >= req.targetInterestedCount) {
      throw new ConflictError(
        'This requirement has already reached its target of interested Partners. Zero credits were deducted.'
      );
    }

    const partnerProfRef = db.collection('role_profiles').doc(`${params.partnerUid}_partner`);
    const partnerProfSnap = await tx.get(partnerProfRef);
    if (!partnerProfSnap.exists) {
      throw new ForbiddenError('Active Partner profile is required to claim leads.');
    }
    const partnerProf = partnerProfSnap.data() as PartnerRoleProfile;

    if (
      settings.moderation.requirePartnerKycForClaims &&
      partnerProf.verificationStatus !== 'verified'
    ) {
      throw new ForbiddenError('KYC verification is required before claiming leads.');
    }

    const deduct = settings.leadDistribution.deductOnClaim || 1;
    let entitlementUsed: 'free' | 'paid';
    let creditPool: EntitlementLedgerEntry['creditPool'];
    let delta = -deduct;
    let nextFree = partnerProf.freeClaimsRemaining || 0;
    let nextPaid = partnerProf.paidClaimsRemaining || 0;
    const isUnlimited = Boolean(partnerProf.paidClaimsUnlimited);

    if (nextFree >= deduct) {
      nextFree -= deduct;
      entitlementUsed = 'free';
      creditPool = 'free';
    } else if (isUnlimited) {
      entitlementUsed = 'paid';
      creditPool = 'unlimited';
      delta = 0;
    } else if (nextPaid >= deduct) {
      nextPaid -= deduct;
      entitlementUsed = 'paid';
      creditPool = 'paid';
    } else {
      const allowanceText = settings.subscriptions.partnerPlanUnlimited
        ? 'unlimited lead applications'
        : `${settings.subscriptions.partnerPaidMonthlyClaims} lead applications/month`;
      throw new QuotaExceededError(
        `You have used all ${settings.subscriptions.partnerFreeClaims} free starter applications. Activate the XPO Partner Plan to unlock ${allowanceText}.`,
        {
          role: 'partner',
          inrPrice: settings.subscriptions.partnerInrMonthlyPrice,
          usdPrice: settings.subscriptions.partnerUsdMonthlyPrice,
          monthlyAllowance: settings.subscriptions.partnerPaidMonthlyClaims,
          unlimited: settings.subscriptions.partnerPlanUnlimited,
        }
      );
    }

    const claimId = `clm_${offer.reqId}_${params.partnerUid}`;
    const clmSnap = await tx.get(db.collection('lead_claims').doc(claimId));
    if (clmSnap.exists) {
      throw new ConflictError('You have already claimed this requirement.');
    }

    createdClaim = {
      id: claimId,
      reqId: req.id,
      xpoCode: req.xpoCode,
      offerId: offer.id,
      partnerUid: params.partnerUid,
      partnerBusinessName: partnerProf.businessName || partnerProf.name,
      partnerCity: partnerProf.city,
      partnerVerificationStatus: partnerProf.verificationStatus,
      partnerPortfolioUrl: partnerProf.portfolioUrl,
      capabilityNote: params.capabilityNote || partnerProf.capabilities || '',
      clientUid: req.clientUid,
      entitlementUsed,
      unlockedByClient: false,
      unlockedAt: null,
      clientEntitlementUsed: null,
      status: 'claimed',
      connectionId: null,
      isSimulated: req.isSimulated,
      claimedAt: nowIso,
      updatedAt: nowIso,
    };

    const nextInterested = (req.interestedCount || 0) + 1;
    const reachedTarget = nextInterested >= req.targetInterestedCount;

    tx.set(db.collection('lead_claims').doc(claimId), createdClaim);
    tx.set(
      offerRef,
      { status: 'claimed', respondedAt: nowIso, updatedAt: nowIso },
      { merge: true }
    );
    tx.set(
      reqRef.collection('match_candidates').doc(params.partnerUid),
      { offerStatus: 'claimed', updatedAt: nowIso },
      { merge: true }
    );
    tx.set(
      partnerProfRef,
      {
        freeClaimsRemaining: nextFree,
        paidClaimsRemaining: nextPaid,
        totalValidClaims: (partnerProf.totalValidClaims || 0) + 1,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    tx.set(
      reqRef,
      {
        interestedCount: nextInterested,
        distributionStatus: reachedTarget ? 'target_reached' : req.distributionStatus,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    const ledgerId = generateDocId('led');
    const ledgerEntry: EntitlementLedgerEntry = {
      id: ledgerId,
      uid: params.partnerUid,
      role: 'partner',
      eventType: 'partner_lead_claim',
      creditPool,
      delta,
      balanceAfter: {
        freeRemaining: nextFree,
        paidRemaining: nextPaid,
        unlimited: isUnlimited,
      },
      referenceId: claimId,
      summary: `Applied to Client requirement ${req.xpoCode} within 5-minute window`,
      createdAt: nowIso,
    };
    tx.set(db.collection('entitlement_ledger').doc(ledgerId), ledgerEntry);

    const trustId = generateDocId('tev');
    const trustEvt: TrustEvent = {
      id: trustId,
      uid: params.partnerUid,
      businessId: partnerProf.businessId || null,
      type: 'lead_claimed',
      summary: `Claimed requirement ${req.xpoCode} within 5-minute response window`,
      referenceId: claimId,
      createdAt: nowIso,
    };
    tx.set(db.collection('trust_events').doc(trustId), trustEvt);

    remainingFreeClaims = nextFree;
    remainingPaidClaims = nextPaid;
    unlimitedClaims = isUnlimited;
    clientUidToNotify = req.clientUid;
    reqTitle = req.title;
    isSimulatedReq = req.isSimulated;
  });

  const reqAfter = (await db.collection('requirements').doc(createdClaim.reqId).get()).data() as
    | ServiceRequirement
    | undefined;

  if (reqAfter && reqAfter.interestedCount >= reqAfter.targetInterestedCount) {
    const openSnap = await db
      .collection('whatsapp_lead_offers')
      .where('reqId', '==', createdClaim.reqId)
      .where('status', 'in', ['dispatched', 'delivered'])
      .get();
    const batch = db.batch();
    for (const d of openSnap.docs) {
      batch.set(d.ref, { status: 'superseded', updatedAt: nowIso }, { merge: true });
    }
    await batch.commit();
  }

  // Notify Client via WhatsApp with a Server-Redacted Teaser & 1-Tap "View Partner" button!
  try {
    const clientUser = await getUserByUid(clientUidToNotify);
    if (clientUser?.phoneE164) {
      const clientSessionId = resolveSessionIdForPhone(clientUser.phoneE164, isSimulatedReq);
      const badgeLabel =
        createdClaim.partnerVerificationStatus === 'verified'
          ? 'KYC Verified Partner'
          : 'Phone Verified Partner';

      await dispatchOutboundWhatsApp({
        sessionId: clientSessionId,
        phoneE164: clientUser.phoneE164,
        isSimulated: isSimulatedReq,
        messageType: 'interactive_buttons',
        headerText: 'Partner Responded to Requirement',
        body:
          `Great news! A *${badgeLabel}* in *${createdClaim.partnerCity || 'India'}* responded within 5 minutes to your requirement *${createdClaim.xpoCode}* (${reqTitle}).\n\n` +
          `Tap *View Partner* below to unlock their full Partner profile, services, and Trust Summary (1 Partner view credit — unlock once, view anytime).`,
        interactiveOptions: [
          { id: `unlock_claim:${createdClaim.id}`, title: 'View Partner' },
        ],
        outsideWindowTemplate: {
          name: 'xpo_client_partner_interested_v2',
          language: 'en',
          category: 'UTILITY',
          variables: [
            clientUser.displayName,
            createdClaim.partnerCity || 'India',
            badgeLabel,
            createdClaim.xpoCode,
          ],
        },
      });
    }
  } catch (err) {
    console.error('[LeadDistribution] Client notification error after claim:', err);
  }

  return {
    status: 'claimed',
    claim: createdClaim,
    remainingFreeClaims,
    remainingPaidClaims,
    unlimitedClaims,
  };
}

export async function reconcileOverdueLeadOffers(): Promise<{ expiredCount: number }> {
  const db = requireFirestore();
  const nowIso = new Date().toISOString();
  try {
    const snap = await db
      .collection('whatsapp_lead_offers')
      .where('status', 'in', ['dispatched', 'delivered'])
      .limit(100)
      .get();

    let expiredCount = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as WhatsAppLeadOffer;
      if (data.expiresAt && data.expiresAt <= nowIso) {
        const res = await expireLeadOfferAndCascade(doc.id, { forceImmediate: true });
        if (res.expired) expiredCount++;
      }
    }
    return { expiredCount };
  } catch (err) {
    console.warn('[reconcileOverdueLeadOffers] Failed to reconcile overdue offers:', err);
    return { expiredCount: 0 };
  }
}
