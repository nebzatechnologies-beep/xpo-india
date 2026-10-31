import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { getUserByUid, getUserRoleProfiles } from '@/lib/services/users';
import { NotFoundError } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  CustomerRole,
  TrustEvent,
  VerificationRequest,
  VerificationStatus,
} from '@/lib/types/domain';

export async function submitVerificationRequest(input: {
  uid: string;
  role: CustomerRole;
  documentType: VerificationRequest['documentType'];
  documentNumber?: string;
  storagePaths: string[];
  websiteUrl?: string;
  companyName?: string;
}): Promise<VerificationRequest> {
  const db = requireFirestore();
  const user = await getUserByUid(input.uid);
  if (!user) throw new NotFoundError('User account not found');

  const id = generateDocId('kyc');
  const nowIso = new Date().toISOString();

  const req: VerificationRequest = {
    id,
    uid: input.uid,
    role: input.role,
    businessId: user.linkedBusinessId || null,
    applicantName: user.displayName,
    companyName: input.companyName || '',
    documentType: input.documentType,
    documentNumber: input.documentNumber || '',
    storagePaths: input.storagePaths,
    websiteUrl: input.websiteUrl || '',
    status: 'verification_pending',
    submittedAt: nowIso,
  };

  const batch = db.batch();
  batch.set(db.collection('verification_requests').doc(id), req);
  batch.set(
    db.collection('users').doc(input.uid),
    { verificationStatus: 'verification_pending', updatedAt: nowIso },
    { merge: true }
  );
  batch.set(
    db.collection('role_profiles').doc(`${input.uid}_${input.role}`),
    { verificationStatus: 'verification_pending', updatedAt: nowIso },
    { merge: true }
  );
  if (user.phoneE164) {
    batch.set(
      db.collection('crm_contacts').doc(user.phoneE164),
      {
        verificationStatus: 'verification_pending',
        crmState: 'verification_pending',
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }
  await batch.commit();
  return req;
}

export async function reviewVerificationRequest(params: {
  requestId: string;
  decision: Extract<VerificationStatus, 'verified' | 'rejected' | 'expired'>;
  reviewNotes?: string;
  actor: { uid: string; name: string };
}): Promise<VerificationRequest> {
  const db = requireFirestore();
  const ref = db.collection('verification_requests').doc(params.requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Verification request not found');

  const req = snap.data() as VerificationRequest;
  const user = await getUserByUid(req.uid);
  const nowIso = new Date().toISOString();
  const oneYearIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const batch = db.batch();
  batch.set(
    ref,
    {
      status: params.decision,
      reviewedByUid: params.actor.uid,
      reviewNotes: params.reviewNotes || null,
      reviewedAt: nowIso,
      expiresAt: params.decision === 'verified' ? oneYearIso : null,
    },
    { merge: true }
  );

  batch.set(
    db.collection('users').doc(req.uid),
    { verificationStatus: params.decision, updatedAt: nowIso },
    { merge: true }
  );

  const profsSnap = await db.collection('role_profiles').where('uid', '==', req.uid).get();
  for (const pDoc of profsSnap.docs) {
    batch.set(pDoc.ref, { verificationStatus: params.decision, updatedAt: nowIso }, { merge: true });
  }

  if (req.businessId) {
    batch.set(
      db.collection('businesses').doc(req.businessId),
      {
        verificationStatus: params.decision,
        verifiedAt: params.decision === 'verified' ? nowIso : null,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  if (user?.phoneE164) {
    batch.set(
      db.collection('crm_contacts').doc(user.phoneE164),
      {
        verificationStatus: params.decision,
        crmState: params.decision === 'verified' ? 'verified_customer' : 'registered_customer',
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  const tevId = generateDocId('tev');
  const tev: TrustEvent = {
    id: tevId,
    uid: req.uid,
    businessId: req.businessId || null,
    type: params.decision === 'verified' ? 'kyc_approved' : 'kyc_rejected',
    summary:
      params.decision === 'verified'
        ? `Manual Superadmin KYC Verification Approved (${req.documentType.replace(/_/g, ' ')})`
        : `Verification status updated to ${params.decision}`,
    referenceId: req.id,
    createdAt: nowIso,
  };
  batch.set(db.collection('trust_events').doc(tevId), tev);

  await batch.commit();

  await recordAuditLog({
    actorUid: params.actor.uid,
    actorName: params.actor.name,
    actorRole: 'superadmin',
    module: 'verification',
    action: `kyc.${params.decision}`,
    targetType: 'verification_request',
    targetId: req.id,
    summary: `Reviewed KYC request for ${req.applicantName}: ${params.decision}`,
  });

  return (await ref.get()).data() as VerificationRequest;
}

/**
 * Builds the Masked Public Trust Profile —
 * NEVER exposes direct phone numbers or email addresses!
 */
export async function getMaskedTrustProfile(uid: string) {
  const db = requireFirestore();
  const user = await getUserByUid(uid);
  if (!user || user.status !== 'active') {
    throw new NotFoundError('XPO Trust Profile not found');
  }

  const [profiles, trustSnap, claimsSnap, connSnap] = await Promise.all([
    getUserRoleProfiles(uid),
    db.collection('trust_events').where('uid', '==', uid).limit(25).get(),
    db.collection('lead_claims').where('partnerUid', '==', uid).get(),
    db.collection('connections').where('status', '==', 'accepted').get(),
  ]);

  const mutualConnectionsCount = connSnap.docs.filter((d) => {
    const c = d.data();
    return c.initiatorUid === uid || c.recipientUid === uid;
  }).length;

  const events = trustSnap.docs
    .map((d) => d.data() as TrustEvent)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    uid: user.uid,
    displayName: user.displayName,
    city: user.primaryCity,
    country: user.country,
    role: user.role,
    enabledRoles: [user.role],
    isPhoneVerified: user.isPhoneVerified,
    verificationStatus: user.verificationStatus,
    memberSince: user.createdAt,
    partnerSummary: profiles.partner
      ? {
          businessName: profiles.partner.businessName || profiles.partner.name,
          classification: profiles.partner.partnerClassification,
          operatingRegions: profiles.partner.operatingRegions,
          servicesOffered: profiles.partner.servicesOffered || [],
          skillNames: profiles.partner.skillNames,
          capabilities: profiles.partner.capabilities,
          portfolioUrl: profiles.partner.portfolioUrl || null,
          availability: profiles.partner.availability,
        }
      : null,
    clientSummary: profiles.client
      ? {
          businessName: profiles.client.businessName,
          businessInfo: profiles.client.businessInfo || '',
          industryName: profiles.client.industryName,
          requirementsPostedCount: profiles.client.requirementsPostedCount,
        }
      : null,
    stats: {
      totalValidClaims: claimsSnap.size,
      mutualConnectionsCount,
    },
    trustEvents: events,
  };
}
