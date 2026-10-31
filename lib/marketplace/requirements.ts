import { requireFirestore } from '@/lib/firebase/admin';
import { rankPartnersForRequirement } from '@/lib/matching/engine';
import { dispatchNextOfferRound } from '@/lib/marketplace/lead-distribution';
import { recordAuditLog } from '@/lib/services/audit';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import { getUserByUid } from '@/lib/services/users';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/lib/utils/api-handler';
import { generateDocId, generateRequirementCode } from '@/lib/utils/id-generator';
import type {
  ClientRoleProfile,
  LeadClaim,
  MatchCandidateItem,
  ModerationStatus,
  ServiceRequirement,
  WhatsAppLeadOffer,
} from '@/lib/types/domain';

function detectModerationFlags(text: string, blockedKeywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of blockedKeywords) {
    if (kw.trim() && lower.includes(kw.trim().toLowerCase())) {
      return `Flagged for manual moderation review (matched restricted term: "${kw}")`;
    }
  }
  // Detect attempts to embed raw phone numbers inside requirement specifications to bypass consent
  if (/(?:\+91[\s\-]?[6-9]\d{9}|(?:\b[6-9]\d{9}\b)|(?:\b\d{3,5}[\s\-]\d{6,8}\b))/.test(text)) {
    return 'Flagged for manual moderation review (direct contact number detected in description)';
  }
  return null;
}

export async function createServiceRequirement(input: {
  clientRequestId?: string;
  clientUid: string;
  title: string;
  categoryId: string;
  subcategoryId?: string | null;
  skillTagIds?: string[];
  specifications: string;
  customFields?: Record<string, unknown>;
  workLocation: string;
  country?: string;
  timeline: string;
  estimatedBudget?: string | null;
  supportingDocPaths?: string[];
  sourceChannel: 'whatsapp' | 'web';
  isSimulated?: boolean;
}): Promise<{
  requirement: ServiceRequirement;
  matchedCount: number;
  dispatchedOffersCount: number;
}> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();

  if (!settings.roles.clientEnabled) {
    throw new ForbiddenError('Client requirement posting is currently paused by platform settings.');
  }

  const user = await getUserByUid(input.clientUid);
  if (!user || user.status !== 'active') {
    throw new ForbiddenError('Active Client account is required.');
  }

  // Enforce daily anti-spam cap if > 0
  if (settings.subscriptions.clientFreeDailyRequirementLimit > 0 && !input.isSimulated) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const todaySnap = await db
      .collection('requirements')
      .where('clientUid', '==', input.clientUid)
      .get();
    const todayCount = todaySnap.docs.filter(
      (d) => (d.data() as ServiceRequirement).createdAt >= startOfDay.toISOString()
    ).length;
    if (todayCount >= settings.subscriptions.clientFreeDailyRequirementLimit) {
      throw new ValidationError(
        `Daily requirement submission limit (${settings.subscriptions.clientFreeDailyRequirementLimit}) reached. Please contact support for bulk procurement.`
      );
    }
  }

  // Detect recent exact duplicate submission (within 60 seconds) by the same Client
  const recentDuplicateSnap = await db
    .collection('requirements')
    .where('clientUid', '==', input.clientUid)
    .where('categoryId', '==', input.categoryId)
    .limit(5)
    .get();

  const sixtySecsAgo = new Date(Date.now() - 60000).toISOString();
  const existingDuplicate = recentDuplicateSnap.docs
    .map((d) => d.data() as ServiceRequirement)
    .find(
      (r) =>
        r.title.toLowerCase() === input.title.trim().toLowerCase() &&
        r.createdAt >= sixtySecsAgo
    );

  if (existingDuplicate) {
    return {
      requirement: existingDuplicate,
      matchedCount: existingDuplicate.offersSentCount || 0,
      dispatchedOffersCount: existingDuplicate.offersSentCount || 0,
    };
  }

  const tree = await getFullTaxonomyTree({ includeInactive: true });
  const cat = tree.categories.find((c) => c.id === input.categoryId);
  if (!cat) {
    throw new ValidationError('Please select a valid XPO Category.');
  }
  const sec = tree.sectors.find((s) => s.id === cat.sectorId);
  const sub = input.subcategoryId
    ? tree.subcategories.find((s) => s.id === input.subcategoryId)
    : undefined;

  const clientProfSnap = await db
    .collection('role_profiles')
    .doc(`${input.clientUid}_client`)
    .get();
  const clientProf = clientProfSnap.exists
    ? (clientProfSnap.data() as ClientRoleProfile)
    : null;

  const combinedText = `${input.title} ${input.specifications}`;
  const flagReason = detectModerationFlags(combinedText, settings.moderation.blockedKeywords);

  const autoApprove = settings.moderation.autoApproveCleanRequirements && !flagReason;
  const moderationStatus: ModerationStatus = autoApprove ? 'approved' : 'pending_review';
  const nowIso = new Date().toISOString();

  const id = generateDocId('req');
  const budgetTrimmed = input.estimatedBudget?.trim() || '';
  const isTbd =
    !budgetTrimmed ||
    budgetTrimmed.toLowerCase() === 'tbd' ||
    budgetTrimmed.toLowerCase().includes('discuss');

  const requirement: ServiceRequirement = {
    id,
    xpoCode: generateRequirementCode(),
    clientUid: input.clientUid,
    clientBusinessName: clientProf?.businessName || user.displayName,
    clientCity: clientProf?.city || user.primaryCity || input.workLocation,
    clientVerificationStatus: user.verificationStatus,
    title: input.title.trim(),
    sectorId: sec?.id || cat.sectorId,
    sectorName: sec?.name || 'General Business',
    categoryId: cat.id,
    categoryName: cat.name,
    subcategoryId: sub?.id || null,
    subcategoryName: sub?.name || undefined,
    skillTagIds: input.skillTagIds || sub?.tagIds || [],
    specifications: input.specifications.trim(),
    customFields: input.customFields || {},
    workLocation: input.workLocation.trim(),
    country: input.country || user.country || 'India',
    timeline: input.timeline.trim(),
    estimatedBudget: isTbd ? null : budgetTrimmed,
    budgetMode: isTbd ? 'to_be_discussed' : 'specified',
    supportingDocPaths: input.supportingDocPaths || [],
    moderationStatus,
    moderationReason: flagReason,
    distributionStatus: autoApprove ? 'queued' : 'awaiting_approval',
    currentRound: 0,
    offersSentCount: 0,
    interestedCount: 0,
    targetInterestedCount: settings.leadDistribution.interestedPartnerTarget || 3,
    sourceChannel: input.sourceChannel,
    isSimulated: Boolean(input.isSimulated),
    createdAt: nowIso,
    approvedAt: autoApprove ? nowIso : null,
    updatedAt: nowIso,
  };

  await db.collection('requirements').doc(id).set(requirement);

  if (clientProfSnap.exists) {
    await clientProfSnap.ref.set(
      {
        requirementsPostedCount: (clientProf?.requirementsPostedCount || 0) + 1,
        activeRequirementsCount: (clientProf?.activeRequirementsCount || 0) + 1,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  let matchedCount = 0;
  let dispatchedOffersCount = 0;

  if (autoApprove) {
    const candidates = await rankPartnersForRequirement(requirement);
    matchedCount = candidates.length;
    const dist = await dispatchNextOfferRound(requirement.id);
    dispatchedOffersCount = dist.dispatchedOffers.length;
    requirement.distributionStatus = dist.distributionStatus;
  }

  return {
    requirement,
    matchedCount,
    dispatchedOffersCount,
  };
}

export async function moderateServiceRequirement(params: {
  reqId: string;
  decision: 'approved' | 'rejected' | 'closed';
  reason?: string;
  actor: { uid: string; name: string };
}): Promise<ServiceRequirement> {
  const db = requireFirestore();
  const ref = db.collection('requirements').doc(params.reqId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Requirement not found');

  const req = snap.data() as ServiceRequirement;
  if (req.moderationStatus === 'approved' && params.decision === 'approved') {
    return req;
  }
  const nowIso = new Date().toISOString();

  if (params.decision === 'closed') {
    await ref.set(
      {
        distributionStatus: 'closed',
        closedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    if (req.distributionStatus !== 'closed') {
      const profRef = db.collection('role_profiles').doc(`${req.clientUid}_client`);
      const profSnap = await profRef.get();
      if (profSnap.exists) {
        const cur = (profSnap.data()?.activeRequirementsCount as number) || 0;
        await profRef.set(
          { activeRequirementsCount: Math.max(0, cur - 1), updatedAt: nowIso },
          { merge: true }
        );
      }
    }
  } else if (params.decision === 'rejected') {
    await ref.set(
      {
        moderationStatus: 'rejected',
        moderationReason: params.reason || 'Rejected by Superadmin moderation',
        moderatedBy: params.actor.uid,
        distributionStatus: 'closed',
        closedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    if (req.distributionStatus !== 'closed') {
      const profRef = db.collection('role_profiles').doc(`${req.clientUid}_client`);
      const profSnap = await profRef.get();
      if (profSnap.exists) {
        const cur = (profSnap.data()?.activeRequirementsCount as number) || 0;
        await profRef.set(
          { activeRequirementsCount: Math.max(0, cur - 1), updatedAt: nowIso },
          { merge: true }
        );
      }
    }
  } else {
    await ref.set(
      {
        moderationStatus: 'approved',
        moderationReason: null,
        moderatedBy: params.actor.uid,
        distributionStatus: 'queued',
        approvedAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    const updatedReq = (await ref.get()).data() as ServiceRequirement;
    await rankPartnersForRequirement(updatedReq);
    await dispatchNextOfferRound(req.id);
  }

  await recordAuditLog({
    actorUid: params.actor.uid,
    actorName: params.actor.name,
    actorRole: 'superadmin',
    module: 'leads',
    action: `requirement.${params.decision}`,
    targetType: 'requirement',
    targetId: req.id,
    summary: `Marked requirement ${req.xpoCode} as ${params.decision}`,
  });

  return (await ref.get()).data() as ServiceRequirement;
}

export async function getServiceRequirementDetails(reqId: string): Promise<{
  requirement: ServiceRequirement;
  candidates: MatchCandidateItem[];
  offers: WhatsAppLeadOffer[];
  claims: LeadClaim[];
}> {
  const db = requireFirestore();
  const ref = db.collection('requirements').doc(reqId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Requirement not found');

  const [candSnap, offersSnap, claimsSnap] = await Promise.all([
    ref.collection('match_candidates').get(),
    db.collection('whatsapp_lead_offers').where('reqId', '==', reqId).get(),
    db.collection('lead_claims').where('reqId', '==', reqId).get(),
  ]);

  return {
    requirement: snap.data() as ServiceRequirement,
    candidates: candSnap.docs
      .map((d) => d.data() as MatchCandidateItem)
      .sort((a, b) => b.finalScore - a.finalScore),
    offers: offersSnap.docs
      .map((d) => d.data() as WhatsAppLeadOffer)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    claims: claimsSnap.docs
      .map((d) => d.data() as LeadClaim)
      .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt)),
  };
}
