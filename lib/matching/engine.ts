import { requireFirestore } from '@/lib/firebase/admin';
import { isPhoneSuppressed } from '@/lib/services/crm';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import type {
  MatchCandidateItem,
  PartnerRoleProfile,
  ServiceRequirement,
  XpoUser,
} from '@/lib/types/domain';

function normalizeLocationToken(loc: string): string {
  return loc.trim().toLowerCase();
}

/**
 * Automatic Partner Matching Engine (Superadmin Step 7):
 * Identifies suitable registered Partners based on categories, subcategories,
 * services offered, skills, locations, quota readiness, and 24h fairness exposure penalty.
 */
export async function rankPartnersForRequirement(
  req: ServiceRequirement
): Promise<MatchCandidateItem[]> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  if (!settings.roles.partnerEnabled) return [];
  const now = new Date().toISOString();

  const [partnersSnap, existingCandidatesSnap] = await Promise.all([
    db
      .collection('role_profiles')
      .where('role', '==', 'partner')
      .where('isActive', '==', true)
      .get(),
    db
      .collection('requirements')
      .doc(req.id)
      .collection('match_candidates')
      .get(),
  ]);

  if (partnersSnap.empty) return [];

  const existingMap = new Map<string, MatchCandidateItem>();
  for (const doc of existingCandidatesSnap.docs) {
    existingMap.set(doc.id, doc.data() as MatchCandidateItem);
  }

  const reqLocationNorm = normalizeLocationToken(req.workLocation);
  const reqSkillSet = new Set((req.skillTagIds || []).map((s) => s.toLowerCase()));
  const reqCorpus = `${req.title} ${req.specifications}`.toLowerCase();
  const candidates: MatchCandidateItem[] = [];

  for (const doc of partnersSnap.docs) {
    const partner = doc.data() as PartnerRoleProfile;
    if (partner.uid === req.clientUid) continue;
    if (partner.availability !== 'available' || partner.notificationsPaused) continue;

    if (
      settings.moderation.requirePartnerKycForClaims &&
      partner.verificationStatus !== 'verified'
    ) {
      continue;
    }

    const userSnap = await db.collection('users').doc(partner.uid).get();
    if (!userSnap.exists) continue;
    const user = userSnap.data() as XpoUser;
    if (user.status !== 'active' || !user.phoneE164) continue;

    if (settings.moderation.launchGeographyScope === 'india_only') {
      const isIndia =
        user.countryIso2 === 'IN' ||
        !user.country ||
        ['india', 'in'].includes(user.country.toLowerCase());
      if (!isIndia) continue;
    }

    if (!req.isSimulated) {
      const suppressed = await isPhoneSuppressed(user.phoneE164);
      if (suppressed) continue;
    }

    let relevanceScore = 0;
    const matchReasons: string[] = [];

    const hasCategory = (partner.categoryIds || []).includes(req.categoryId);
    const hasSector = (partner.sectorIds || []).includes(req.sectorId);
    const hasSubcategory =
      Boolean(req.subcategoryId) &&
      (partner.subcategoryIds || []).includes(req.subcategoryId!);

    const matchedServices = (partner.servicesOffered || []).filter((srv) => {
      const clean = srv.trim().toLowerCase();
      return clean.length >= 3 && reqCorpus.includes(clean);
    });

    if (hasCategory) {
      relevanceScore += 45;
      matchReasons.push(`Category match: ${req.categoryName}`);
    } else if (hasSector) {
      relevanceScore += 20;
      matchReasons.push(`Sector match: ${req.sectorName}`);
    } else if (matchedServices.length > 0) {
      relevanceScore += 25;
      matchReasons.push(`Service match: ${matchedServices[0]}`);
    } else {
      continue;
    }

    if (hasSubcategory) {
      relevanceScore += 15;
      matchReasons.push('Exact subcategory specialization');
    }

    if (matchedServices.length > 0 && (hasCategory || hasSector)) {
      relevanceScore += 10;
      matchReasons.push(`Offers ${matchedServices[0]}`);
    }

    // Skill / Tag overlap
    if (reqSkillSet.size > 0) {
      const overlapCount = (partner.skillTagIds || []).filter((id) =>
        reqSkillSet.has(id.toLowerCase())
      ).length;
      if (overlapCount > 0) {
        const skillPoints = Math.min(20, overlapCount * 7);
        relevanceScore += skillPoints;
        matchReasons.push(`${overlapCount} matching skill tag(s)`);
      }
    }

    // Geographic suitability
    const regionsNorm = [partner.city, ...(partner.operatingRegions || [])]
      .filter(Boolean)
      .map(normalizeLocationToken);

    const servesPanIndiaOrRemote = regionsNorm.some(
      (r) =>
        r.includes('pan-india') ||
        r.includes('pan india') ||
        r.includes('all india') ||
        r.includes('global') ||
        r.includes('remote')
    );
    const exactCityMatch = regionsNorm.some(
      (r) => r && (reqLocationNorm.includes(r) || r.includes(reqLocationNorm))
    );

    if (exactCityMatch) {
      relevanceScore += 15;
      matchReasons.push(`Serves ${req.workLocation}`);
    } else if (servesPanIndiaOrRemote || reqLocationNorm.includes('remote')) {
      relevanceScore += 10;
      matchReasons.push('Pan-region / Remote capability');
    }

    // KYC Verified trust boost
    if (user.verificationStatus === 'verified' || partner.verificationStatus === 'verified') {
      relevanceScore += 10;
      matchReasons.push('KYC Verified Partner');
    }

    // Quota readiness priority boost so Clients get fast claimable responses
    const hasAvailableQuota =
      (partner.freeClaimsRemaining || 0) > 0 ||
      Boolean(partner.paidClaimsUnlimited) ||
      (partner.paidClaimsRemaining || 0) > 0;
    if (hasAvailableQuota) {
      relevanceScore += 10;
    }

    // 24h Exposure Fairness Penalty
    let exposure24h = partner.recentExposureCount24h || 0;
    if (partner.exposureResetAt && new Date(partner.exposureResetAt).getTime() < Date.now()) {
      exposure24h = 0;
    }
    const fairnessPenalty = Math.min(30, exposure24h * 6);
    const finalScore = Math.max(1, relevanceScore - fairnessPenalty);

    const existing = existingMap.get(partner.uid);
    const shouldPreserveStatus =
      Boolean(existing) && !settings.leadDistribution.duplicateOffersPermitted;

    candidates.push({
      candidateUid: partner.uid,
      phoneE164: user.phoneE164,
      displayName: partner.name || user.displayName,
      businessName: partner.businessName || partner.name || user.displayName,
      relevanceScore,
      fairnessPenalty,
      finalScore,
      matchReasons,
      offerStatus: shouldPreserveStatus && existing ? existing.offerStatus : 'queued',
      offerId: shouldPreserveStatus && existing ? existing.offerId : null,
      offeredRound: shouldPreserveStatus && existing ? existing.offeredRound : undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
  }

  candidates.sort((a, b) => b.finalScore - a.finalScore);

  if (candidates.length > 0) {
    const batch = db.batch();
    for (const item of candidates.slice(0, 100)) {
      const ref = db
        .collection('requirements')
        .doc(req.id)
        .collection('match_candidates')
        .doc(item.candidateUid);
      batch.set(ref, item);
    }
    await batch.commit();
  }

  return candidates;
}
