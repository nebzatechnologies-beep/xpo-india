import { requireFirestore, requireAdminAuth } from '@/lib/firebase/admin';
import { normalizePhoneE164 } from '@/lib/crm/phone';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import { recordAuditLog } from '@/lib/services/audit';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  AnyRoleProfile,
  BillingCurrency,
  ClientRoleProfile,
  CrmContact,
  CustomerRole,
  EntitlementLedgerEntry,
  PartnerRoleProfile,
  PhoneIndexEntry,
  XpoBusiness,
  XpoUser,
} from '@/lib/types/domain';

export function normalizeCustomerRole(raw?: string | null): CustomerRole {
  if (raw === 'partner' || raw === 'job_seeker') return 'partner';
  return 'client';
}

function normalizeUserRecord(raw: Record<string, unknown>): XpoUser {
  const rawRole =
    (raw.role as string | undefined) ||
    (raw.activeRole as string | undefined) ||
    (Array.isArray(raw.enabledRoles) ? (raw.enabledRoles[0] as string | undefined) : undefined);
  const role = normalizeCustomerRole(rawRole);

  return {
    ...(raw as unknown as XpoUser),
    role,
    activeRole: role,
    enabledRoles: [role],
  };
}

function normalizeClientProfile(raw: ClientRoleProfile): ClientRoleProfile {
  return {
    ...raw,
    role: 'client',
    businessInfo: raw.businessInfo || '',
    freePartnerViewsRemaining:
      typeof raw.freePartnerViewsRemaining === 'number' ? raw.freePartnerViewsRemaining : 5,
    paidPartnerViewsRemaining:
      typeof raw.paidPartnerViewsRemaining === 'number' ? raw.paidPartnerViewsRemaining : 0,
    paidViewsUnlimited: Boolean(raw.paidViewsUnlimited),
    totalPartnersViewed: typeof raw.totalPartnersViewed === 'number' ? raw.totalPartnersViewed : 0,
    activeSubscriptionId: raw.activeSubscriptionId || null,
  };
}

function normalizePartnerProfile(raw: PartnerRoleProfile): PartnerRoleProfile {
  return {
    ...raw,
    role: 'partner',
    servicesOffered: Array.isArray(raw.servicesOffered) ? raw.servicesOffered : [],
    freeClaimsRemaining: typeof raw.freeClaimsRemaining === 'number' ? raw.freeClaimsRemaining : 5,
    paidClaimsRemaining: typeof raw.paidClaimsRemaining === 'number' ? raw.paidClaimsRemaining : 0,
    paidClaimsUnlimited: Boolean(raw.paidClaimsUnlimited),
    totalValidClaims: typeof raw.totalValidClaims === 'number' ? raw.totalValidClaims : 0,
    activeSubscriptionId: raw.activeSubscriptionId || null,
  };
}

function isSuperadminIdentity(email?: string | null, phoneE164?: string | null): boolean {
  const adminEmails = (
    process.env.SUPERADMIN_EMAILS ||
    process.env.FIREBASE_SUPERADMIN_EMAILS ||
    ''
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const adminPhones = (process.env.SUPERADMIN_PHONES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (email && adminEmails.includes(email.toLowerCase())) return true;
  if (phoneE164 && adminPhones.includes(phoneE164)) return true;
  return false;
}

export function buildDefaultRoleProfile(
  user: XpoUser,
  role: CustomerRole,
  quotas: { partnerFreeClaims: number; clientFreePartnerViews: number }
): AnyRoleProfile {
  const now = new Date().toISOString();
  const base = {
    id: `${user.uid}_${role}`,
    uid: user.uid,
    role,
    businessId: user.linkedBusinessId || null,
    isActive: true,
    verificationStatus: user.verificationStatus,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  if (role === 'partner') {
    const profile: PartnerRoleProfile = {
      ...base,
      role: 'partner',
      name: user.displayName,
      businessName: '',
      partnerClassification: 'Freelancer',
      city: user.primaryCity,
      operatingRegions: user.primaryCity ? [user.primaryCity] : [],
      sectorIds: [],
      categoryIds: [],
      subcategoryIds: [],
      skillTagIds: [],
      skillNames: [],
      servicesOffered: [],
      capabilities: '',
      availability: 'available',
      notificationsPaused: false,
      freeClaimsRemaining: quotas.partnerFreeClaims,
      paidClaimsRemaining: 0,
      paidClaimsUnlimited: false,
      totalValidClaims: 0,
      activeSubscriptionId: null,
      recentExposureCount24h: 0,
    };
    return profile;
  }

  const profile: ClientRoleProfile = {
    ...base,
    role: 'client',
    contactName: user.displayName,
    businessName: '',
    businessInfo: '',
    city: user.primaryCity,
    location: user.primaryCity,
    industryName: '',
    requirementsPostedCount: 0,
    activeRequirementsCount: 0,
    freePartnerViewsRemaining: quotas.clientFreePartnerViews,
    paidPartnerViewsRemaining: 0,
    paidViewsUnlimited: false,
    totalPartnersViewed: 0,
    activeSubscriptionId: null,
  };
  return profile;
}

export async function getUserByUid(uid: string): Promise<XpoUser | null> {
  const db = requireFirestore();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return normalizeUserRecord(snap.data() as Record<string, unknown>);
}

export async function getUserByPhone(phoneE164: string): Promise<XpoUser | null> {
  const db = requireFirestore();
  const idxSnap = await db.collection('phone_index').doc(phoneE164).get();
  if (idxSnap.exists) {
    const idx = idxSnap.data() as PhoneIndexEntry;
    if (idx.uid) {
      return getUserByUid(idx.uid);
    }
  }
  const q = await db.collection('users').where('phoneE164', '==', phoneE164).limit(1).get();
  if (q.empty) return null;
  return normalizeUserRecord(q.docs[0]!.data() as Record<string, unknown>);
}

export interface UserRoleProfileMap {
  client: ClientRoleProfile | null;
  partner: PartnerRoleProfile | null;
}

export async function getUserRoleProfiles(uid: string): Promise<UserRoleProfileMap> {
  const db = requireFirestore();
  const snap = await db.collection('role_profiles').where('uid', '==', uid).get();
  const result: UserRoleProfileMap = {
    client: null,
    partner: null,
  };
  for (const doc of snap.docs) {
    const data = doc.data() as AnyRoleProfile;
    if (data.role === 'client') {
      result.client = normalizeClientProfile(data);
    } else if (data.role === 'partner') {
      result.partner = normalizePartnerProfile(data);
    }
  }
  return result;
}

/**
 * Ensures a Firebase Auth user (or verified WhatsApp registrant) has a canonical
 * single-role `users/{uid}` document, `phone_index/{phoneE164}` mapping, linked
 * `crm_contacts/{phoneE164}`, an initialized `role_profiles/{uid}_{role}` document
 * with admin-configured free starter credits, and an `entitlement_ledger` grant record.
 */
export async function ensureAuthenticatedUser(params: {
  uid: string;
  phoneRaw?: string | null;
  confirmedCountry?: string | null;
  email?: string | null;
  displayName?: string | null;
  city?: string | null;
  initialRole?: CustomerRole;
  isPhoneVerified?: boolean;
}): Promise<{ user: XpoUser; profiles: UserRoleProfileMap }> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const now = new Date().toISOString();

  let normalizedPhone = '';
  let countryIso2 = 'IN';
  let countryName = 'India';

  if (params.phoneRaw) {
    const norm = normalizePhoneE164(params.phoneRaw, params.confirmedCountry || 'IN');
    if (norm.isValid && norm.phoneE164) {
      normalizedPhone = norm.phoneE164;
      countryIso2 = norm.countryIso2 || 'IN';
      countryName = countryIso2 === 'IN' ? 'India' : countryIso2;
    }
  }

  const billingCurrency: BillingCurrency = countryIso2 === 'IN' ? 'INR' : 'USD';
  const superadminMatch = isSuperadminIdentity(params.email, normalizedPhone);

  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(params.uid);
    const userSnap = await tx.get(userRef);

    let crmData: CrmContact | null = null;
    if (normalizedPhone) {
      const idxRef = db.collection('phone_index').doc(normalizedPhone);
      const idxSnap = await tx.get(idxRef);
      if (idxSnap.exists) {
        const idx = idxSnap.data() as PhoneIndexEntry;
        if (idx.uid && idx.uid !== params.uid) {
          throw new ConflictError(
            'This mobile/WhatsApp number is already linked to another XPO account.'
          );
        }
      }
      const crmRef = db.collection('crm_contacts').doc(normalizedPhone);
      const crmSnap = await tx.get(crmRef);
      if (crmSnap.exists) {
        crmData = crmSnap.data() as CrmContact;
      }
    }

    if (!userSnap.exists) {
      // Single customer role per account: respect explicit initialRole, else infer from CRM databaseType
      const resolvedRole: CustomerRole =
        params.initialRole ||
        (crmData?.databaseType === 'partner' || crmData?.roles?.includes('partner')
          ? 'partner'
          : 'client');

      if (resolvedRole === 'client' && !settings.roles.clientEnabled && !superadminMatch) {
        throw new ForbiddenError('Client registrations are currently disabled by platform settings.');
      }
      if (resolvedRole === 'partner' && !settings.roles.partnerEnabled && !superadminMatch) {
        throw new ForbiddenError('Partner registrations are currently disabled by platform settings.');
      }

      const newUser: XpoUser = {
        uid: params.uid,
        phoneE164: normalizedPhone,
        email: params.email || crmData?.email || null,
        displayName:
          params.displayName?.trim() ||
          crmData?.contactName ||
          params.email?.split('@')[0] ||
          'XPO Member',
        primaryCity: params.city?.trim() || crmData?.city || '',
        country: crmData?.country || countryName,
        countryIso2: crmData?.countryIso2 || countryIso2,
        billingCurrency,
        role: resolvedRole,
        enabledRoles: [resolvedRole],
        activeRole: resolvedRole,
        isSuperadmin: superadminMatch,
        isPhoneVerified: Boolean(params.isPhoneVerified || normalizedPhone),
        verificationStatus: crmData?.verificationStatus || 'unverified',
        status: 'active',
        linkedBusinessId: null,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(userRef, newUser);

      const profRef = db.collection('role_profiles').doc(`${params.uid}_${resolvedRole}`);
      const prof = buildDefaultRoleProfile(newUser, resolvedRole, {
        partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
        clientFreePartnerViews: settings.subscriptions.clientFreePartnerViews,
      });

      // Pre-populate from uploaded Client/Partner Excel CRM record if present
      if (crmData) {
        if (prof.role === 'client') {
          prof.businessName = crmData.companyName || '';
          prof.businessInfo = crmData.businessInfo || crmData.notes || '';
          prof.industryName = crmData.sectorName || '';
          prof.industrySectorId = crmData.sectorId || undefined;
        } else if (prof.role === 'partner') {
          prof.businessName = crmData.companyName || '';
          if (crmData.sectorId) prof.sectorIds = [crmData.sectorId];
          if (crmData.categoryId) prof.categoryIds = [crmData.categoryId];
          if (crmData.subcategoryId) prof.subcategoryIds = [crmData.subcategoryId];
          prof.skillTagIds = crmData.skillTagIds || [];
          prof.skillNames = crmData.skills || [];
          prof.servicesOffered = crmData.servicesOffered || crmData.skills || [];
          if (prof.servicesOffered.length > 0 && !prof.capabilities) {
            prof.capabilities = prof.servicesOffered.join(', ');
          }
        }
      }
      tx.set(profRef, prof);

      // Record immutable initial free starter quota grant in entitlement_ledger
      const initialFreeCount =
        resolvedRole === 'partner'
          ? settings.subscriptions.partnerFreeClaims
          : settings.subscriptions.clientFreePartnerViews;
      const ledgerId = generateDocId('led');
      const ledgerEntry: EntitlementLedgerEntry = {
        id: ledgerId,
        uid: params.uid,
        role: resolvedRole,
        eventType: 'initial_free_grant',
        creditPool: 'free',
        delta: initialFreeCount,
        balanceAfter: {
          freeRemaining: initialFreeCount,
          paidRemaining: 0,
          unlimited: false,
        },
        referenceId: `${params.uid}_${resolvedRole}`,
        summary:
          resolvedRole === 'partner'
            ? `Initial free Partner starter quota granted (${initialFreeCount} lead applications)`
            : `Initial free Client starter quota granted (${initialFreeCount} Partner profile views)`,
        createdAt: now,
      };
      tx.set(db.collection('entitlement_ledger').doc(ledgerId), ledgerEntry);

      if (normalizedPhone) {
        const idxEntry: PhoneIndexEntry = {
          phoneE164: normalizedPhone,
          uid: params.uid,
          crmContactId: normalizedPhone,
          linkedAt: now,
          updatedAt: now,
        };
        tx.set(db.collection('phone_index').doc(normalizedPhone), idxEntry, { merge: true });

        if (crmData) {
          const isPartnerMatchingReady =
            resolvedRole === 'partner' && Boolean(crmData.categoryId || crmData.skills?.length);
          tx.set(
            db.collection('crm_contacts').doc(normalizedPhone),
            {
              linkedUid: params.uid,
              databaseType: resolvedRole,
              roles: [resolvedRole],
              invitationStatus: 'registered',
              registeredAt: now,
              crmState: isPartnerMatchingReady
                ? 'eligible_matching_recipient'
                : crmData.crmState === 'imported_prospect'
                  ? 'registered_customer'
                  : crmData.crmState,
              updatedAt: now,
            },
            { merge: true }
          );
        }
      }
    } else {
      const existing = normalizeUserRecord(userSnap.data() as Record<string, unknown>);
      const updates: Partial<XpoUser> = {
        role: existing.role,
        activeRole: existing.role,
        enabledRoles: [existing.role],
        updatedAt: now,
      };

      if (superadminMatch && !existing.isSuperadmin) {
        updates.isSuperadmin = true;
      }
      if (normalizedPhone && !existing.phoneE164) {
        updates.phoneE164 = normalizedPhone;
        updates.isPhoneVerified = Boolean(params.isPhoneVerified ?? true);
        updates.countryIso2 = countryIso2;
        updates.billingCurrency = billingCurrency;
        tx.set(
          db.collection('phone_index').doc(normalizedPhone),
          {
            phoneE164: normalizedPhone,
            uid: params.uid,
            crmContactId: crmData ? normalizedPhone : null,
            linkedAt: now,
            updatedAt: now,
          } satisfies PhoneIndexEntry,
          { merge: true }
        );
      }
      if (params.email && !existing.email) {
        updates.email = params.email;
      }
      tx.set(userRef, updates, { merge: true });
    }
  });

  const user = await getUserByUid(params.uid);
  if (!user) {
    throw new NotFoundError('Failed to load user record after initialization');
  }
  if (user.isSuperadmin) {
    try {
      const adminAuth = requireAdminAuth();
      await adminAuth.setCustomUserClaims(user.uid, {
        superadmin: true,
        roles: [user.role],
      });
    } catch {
      // Non-fatal if custom claims update is performed on simulated user
    }
  }

  const profiles = await getUserRoleProfiles(params.uid);
  return { user, profiles };
}

export async function updateUserAndRoleProfile(params: {
  uid: string;
  role: CustomerRole;
  userUpdates?: Partial<Pick<XpoUser, 'displayName' | 'primaryCity' | 'state' | 'country' | 'email'>> & {
    phoneRaw?: string;
    confirmedCountry?: string;
  };
  profileUpdates?: Record<string, unknown>;
  businessUpdates?: Partial<
    Pick<
      XpoBusiness,
      | 'companyName'
      | 'registrationNumber'
      | 'industrySectorId'
      | 'industryName'
      | 'website'
      | 'city'
      | 'state'
      | 'country'
      | 'businessInfo'
    >
  >;
}): Promise<{ user: XpoUser; profile: AnyRoleProfile }> {
  const db = requireFirestore();
  const user = await getUserByUid(params.uid);
  if (!user) throw new NotFoundError('User account not found');

  // Enforce strict single customer role per account (Superadmin may manage their active profile)
  if (!user.isSuperadmin && user.role !== params.role) {
    throw new ForbiddenError(
      `This account is registered as a ${user.role}. Role switching is not permitted.`
    );
  }

  const now = new Date().toISOString();
  const userPatch: Partial<XpoUser> = { updatedAt: now };

  if (params.userUpdates?.displayName) userPatch.displayName = params.userUpdates.displayName.trim();
  if (params.userUpdates?.primaryCity) userPatch.primaryCity = params.userUpdates.primaryCity.trim();
  if (params.userUpdates?.state !== undefined) userPatch.state = params.userUpdates.state;
  if (params.userUpdates?.country) userPatch.country = params.userUpdates.country;
  if (params.userUpdates?.email !== undefined) userPatch.email = params.userUpdates.email;

  if (params.userUpdates?.phoneRaw) {
    const norm = normalizePhoneE164(
      params.userUpdates.phoneRaw,
      params.userUpdates.confirmedCountry || user.countryIso2 || 'IN'
    );
    if (!norm.isValid || !norm.phoneE164) {
      throw new ValidationError('Please provide a valid international or country-confirmed mobile number.');
    }
    const existingOwner = await getUserByPhone(norm.phoneE164);
    if (existingOwner && existingOwner.uid !== params.uid) {
      throw new ConflictError('This mobile/WhatsApp number is already linked to another XPO account.');
    }
    userPatch.phoneE164 = norm.phoneE164;
    userPatch.countryIso2 = norm.countryIso2 || user.countryIso2;
    userPatch.billingCurrency = userPatch.countryIso2 === 'IN' ? 'INR' : 'USD';
    await db
      .collection('phone_index')
      .doc(norm.phoneE164)
      .set(
        {
          phoneE164: norm.phoneE164,
          uid: params.uid,
          linkedAt: now,
          updatedAt: now,
        } satisfies PhoneIndexEntry,
        { merge: true }
      );
  }

  let businessId = user.linkedBusinessId || null;
  if (params.businessUpdates && params.businessUpdates.companyName) {
    if (!businessId) {
      businessId = `biz_${params.uid}`;
      userPatch.linkedBusinessId = businessId;
    }
    const bizRef = db.collection('businesses').doc(businessId);
    const bizSnap = await bizRef.get();
    if (!bizSnap.exists) {
      const biz: XpoBusiness = {
        id: businessId,
        ownerUid: params.uid,
        companyName: params.businessUpdates.companyName,
        registrationNumber: params.businessUpdates.registrationNumber,
        industrySectorId: params.businessUpdates.industrySectorId,
        industryName: params.businessUpdates.industryName,
        website: params.businessUpdates.website,
        city: params.businessUpdates.city || userPatch.primaryCity || user.primaryCity,
        state: params.businessUpdates.state || user.state,
        country: params.businessUpdates.country || user.country,
        businessInfo: params.businessUpdates.businessInfo,
        verificationStatus: user.verificationStatus,
        createdAt: now,
        updatedAt: now,
      };
      await bizRef.set(biz);
    } else {
      await bizRef.set({ ...params.businessUpdates, updatedAt: now }, { merge: true });
    }
  }

  await db.collection('users').doc(params.uid).set(userPatch, { merge: true });

  // Protect server-managed quota & fairness fields from arbitrary client profile edits
  const safeProfileUpdates = { ...(params.profileUpdates || {}) };
  delete safeProfileUpdates.freeClaimsRemaining;
  delete safeProfileUpdates.paidClaimsRemaining;
  delete safeProfileUpdates.paidClaimsUnlimited;
  delete safeProfileUpdates.totalValidClaims;
  delete safeProfileUpdates.freePartnerViewsRemaining;
  delete safeProfileUpdates.paidPartnerViewsRemaining;
  delete safeProfileUpdates.paidViewsUnlimited;
  delete safeProfileUpdates.totalPartnersViewed;
  delete safeProfileUpdates.verificationStatus;
  delete safeProfileUpdates.uid;
  delete safeProfileUpdates.id;
  delete safeProfileUpdates.role;

  const profRef = db.collection('role_profiles').doc(`${params.uid}_${params.role}`);
  const profSnap = await profRef.get();
  const existingProfData = profSnap.exists
    ? (profSnap.data() as Record<string, unknown>)
    : null;

  // Automatically resolve Partner sectorIds, categoryIds (when omitted on onboarding), and skillTagIds
  if (params.role === 'partner') {
    try {
      const tax = await getFullTaxonomyTree();
      const catIds = new Set<string>(
        Array.isArray(safeProfileUpdates.categoryIds)
          ? (safeProfileUpdates.categoryIds as string[])
          : Array.isArray(existingProfData?.categoryIds)
            ? (existingProfData.categoryIds as string[])
            : []
      );
      const subIds = new Set<string>(
        Array.isArray(safeProfileUpdates.subcategoryIds)
          ? (safeProfileUpdates.subcategoryIds as string[])
          : Array.isArray(existingProfData?.subcategoryIds)
            ? (existingProfData.subcategoryIds as string[])
            : []
      );
      const skillNames: string[] = Array.isArray(safeProfileUpdates.skillNames)
        ? (safeProfileUpdates.skillNames as string[])
        : Array.isArray(existingProfData?.skillNames)
          ? (existingProfData.skillNames as string[])
          : [];
      const servicesOffered: string[] = Array.isArray(safeProfileUpdates.servicesOffered)
        ? (safeProfileUpdates.servicesOffered as string[])
        : Array.isArray(existingProfData?.servicesOffered)
          ? (existingProfData.servicesOffered as string[])
          : [];

      // Ensure parent categoryIds are included for any selected subcategoryIds
      for (const scId of subIds) {
        const sc = tax.subcategories.find((s) => s.id === scId);
        if (sc) catIds.add(sc.categoryId);
      }

      // If Partner has not explicitly picked categories yet, infer from servicesOffered & skillNames
      if (catIds.size === 0 && (servicesOffered.length > 0 || skillNames.length > 0)) {
        const corpus = [...servicesOffered, ...skillNames].join(' ').toLowerCase();
        for (const sc of tax.subcategories) {
          if (corpus.includes(sc.name.toLowerCase())) {
            subIds.add(sc.id);
            catIds.add(sc.categoryId);
          }
        }
        for (const c of tax.categories) {
          const words = c.name
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length >= 4);
          if (
            corpus.includes(c.name.toLowerCase()) ||
            words.some((w) => corpus.includes(w))
          ) {
            catIds.add(c.id);
          }
        }
      }

      const sectorIds = new Set<string>(
        Array.isArray(safeProfileUpdates.sectorIds)
          ? (safeProfileUpdates.sectorIds as string[])
          : []
      );
      for (const cId of catIds) {
        const cat = tax.categories.find((c) => c.id === cId);
        if (cat) sectorIds.add(cat.sectorId);
      }

      const skillTagIds = new Set<string>(
        Array.isArray(safeProfileUpdates.skillTagIds)
          ? (safeProfileUpdates.skillTagIds as string[])
          : []
      );
      const lowerSkills = skillNames.map((s) => s.trim().toLowerCase());
      const lowerServices = servicesOffered.map((s) => s.trim().toLowerCase());
      for (const tag of tax.tags) {
        const tn = tag.name.toLowerCase();
        if (
          lowerSkills.some((s) => s === tn || s.includes(tn) || tn.includes(s)) ||
          lowerServices.some((s) => s.includes(tn))
        ) {
          skillTagIds.add(tag.id);
        }
      }

      safeProfileUpdates.categoryIds = Array.from(catIds);
      safeProfileUpdates.subcategoryIds = Array.from(subIds);
      safeProfileUpdates.sectorIds = Array.from(sectorIds);
      safeProfileUpdates.skillTagIds = Array.from(skillTagIds);
    } catch {
      // Non-fatal if taxonomy tree is temporarily unavailable
    }
  }

  if (!profSnap.exists) {
    const settings = await getPlatformSettings();
    const fresh = buildDefaultRoleProfile(user, params.role, {
      partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
      clientFreePartnerViews: settings.subscriptions.clientFreePartnerViews,
    });
    await profRef.set({
      ...fresh,
      ...safeProfileUpdates,
      businessId,
      onboardingCompleted: true,
      updatedAt: now,
    });
  } else {
    await profRef.set(
      {
        ...safeProfileUpdates,
        ...(businessId ? { businessId } : {}),
        onboardingCompleted: true,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  const updatedUser = (await getUserByUid(params.uid))!;
  const updatedProfRaw = (await profRef.get()).data() as AnyRoleProfile;
  const updatedProf =
    updatedProfRaw.role === 'client'
      ? normalizeClientProfile(updatedProfRaw)
      : normalizePartnerProfile(updatedProfRaw);

  if (updatedUser.phoneE164) {
    const crmRef = db.collection('crm_contacts').doc(updatedUser.phoneE164);
    const crmSnap = await crmRef.get();
    if (crmSnap.exists) {
      const existingCrm = crmSnap.data() as Record<string, unknown>;
      const prevTypes = Array.isArray(existingCrm.databaseTypes)
        ? (existingCrm.databaseTypes as string[])
        : existingCrm.databaseType
          ? [String(existingCrm.databaseType)]
          : [];
      const mergedDatabaseTypes = Array.from(new Set([...prevTypes, params.role]));
      const prevRoles = Array.isArray(existingCrm.roles) ? (existingCrm.roles as string[]) : [];
      const mergedRoles = Array.from(new Set([...prevRoles, params.role]));

      const isMatchingRecipient =
        updatedProf.role === 'partner' &&
        (updatedProf.categoryIds?.length > 0 || updatedProf.servicesOffered?.length > 0);
      await crmRef.set(
        {
          linkedUid: params.uid,
          databaseType: (existingCrm.databaseType as string) || params.role,
          databaseTypes: mergedDatabaseTypes,
          roles: mergedRoles,
          contactName: updatedUser.displayName,
          city: updatedUser.primaryCity,
          invitationStatus: 'registered',
          ...(params.role === 'client'
            ? { clientInvitationStatus: 'registered' }
            : { partnerInvitationStatus: 'registered' }),
          registeredAt: (existingCrm.registeredAt as string) || now,
          crmState: isMatchingRecipient ? 'eligible_matching_recipient' : 'registered_customer',
          updatedAt: now,
        },
        { merge: true }
      );
    }
  }

  await recordAuditLog({
    actorUid: params.uid,
    actorName: updatedUser.displayName,
    actorRole: params.role,
    module: 'auth',
    action: 'role_profile.updated',
    targetType: 'role_profile',
    targetId: `${params.uid}_${params.role}`,
    summary: `Updated ${params.role} profile for ${updatedUser.displayName}`,
  });

  return { user: updatedUser, profile: updatedProf };
}

/**
 * Superadmin atomic per-account quota override for either Client or Partner.
 * Writes an immutable `entitlement_ledger` record + `audit_logs` entry.
 */
export async function adjustCustomerQuotaByAdmin(params: {
  uid: string;
  role: CustomerRole;
  freeRemaining?: number;
  paidRemaining?: number;
  unlimited?: boolean;
  reason?: string;
  actor: { uid: string; name: string };
}): Promise<AnyRoleProfile> {
  const db = requireFirestore();
  const settings = await getPlatformSettings();
  const now = new Date().toISOString();
  const profRef = db.collection('role_profiles').doc(`${params.uid}_${params.role}`);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(db.collection('users').doc(params.uid));
    if (!userSnap.exists) {
      throw new NotFoundError('User account not found');
    }
    const user = normalizeUserRecord(userSnap.data() as Record<string, unknown>);
    const profSnap = await tx.get(profRef);
    const baseProf = profSnap.exists
      ? (profSnap.data() as AnyRoleProfile)
      : buildDefaultRoleProfile(user, params.role, {
          partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
          clientFreePartnerViews: settings.subscriptions.clientFreePartnerViews,
        });

    if (params.role === 'client') {
      const current = normalizeClientProfile(baseProf as ClientRoleProfile);
      const nextFree =
        typeof params.freeRemaining === 'number'
          ? Math.max(0, Math.floor(params.freeRemaining))
          : current.freePartnerViewsRemaining;
      const nextPaid =
        typeof params.paidRemaining === 'number'
          ? Math.max(0, Math.floor(params.paidRemaining))
          : current.paidPartnerViewsRemaining;
      const nextUnlimited =
        typeof params.unlimited === 'boolean' ? params.unlimited : current.paidViewsUnlimited;

      const delta =
        nextFree -
        current.freePartnerViewsRemaining +
        (nextPaid - current.paidPartnerViewsRemaining);

      tx.set(
        profRef,
        {
          ...current,
          freePartnerViewsRemaining: nextFree,
          paidPartnerViewsRemaining: nextPaid,
          paidViewsUnlimited: nextUnlimited,
          updatedAt: now,
        },
        { merge: true }
      );

      const ledId = generateDocId('led');
      const led: EntitlementLedgerEntry = {
        id: ledId,
        uid: params.uid,
        role: 'client',
        eventType: 'admin_quota_override',
        creditPool: nextUnlimited ? 'unlimited' : 'free',
        delta,
        balanceAfter: {
          freeRemaining: nextFree,
          paidRemaining: nextPaid,
          unlimited: nextUnlimited,
        },
        referenceId: params.actor.uid,
        summary:
          params.reason ||
          `Superadmin adjusted Client Partner-view credits (Free: ${nextFree}, Paid: ${nextPaid}, Unlimited: ${nextUnlimited})`,
        createdAt: now,
      };
      tx.set(db.collection('entitlement_ledger').doc(ledId), led);
    } else {
      const current = normalizePartnerProfile(baseProf as PartnerRoleProfile);
      const nextFree =
        typeof params.freeRemaining === 'number'
          ? Math.max(0, Math.floor(params.freeRemaining))
          : current.freeClaimsRemaining;
      const nextPaid =
        typeof params.paidRemaining === 'number'
          ? Math.max(0, Math.floor(params.paidRemaining))
          : current.paidClaimsRemaining;
      const nextUnlimited =
        typeof params.unlimited === 'boolean' ? params.unlimited : current.paidClaimsUnlimited;

      const delta =
        nextFree - current.freeClaimsRemaining + (nextPaid - current.paidClaimsRemaining);

      tx.set(
        profRef,
        {
          ...current,
          freeClaimsRemaining: nextFree,
          paidClaimsRemaining: nextPaid,
          paidClaimsUnlimited: nextUnlimited,
          updatedAt: now,
        },
        { merge: true }
      );

      const ledId = generateDocId('led');
      const led: EntitlementLedgerEntry = {
        id: ledId,
        uid: params.uid,
        role: 'partner',
        eventType: 'admin_quota_override',
        creditPool: nextUnlimited ? 'unlimited' : 'free',
        delta,
        balanceAfter: {
          freeRemaining: nextFree,
          paidRemaining: nextPaid,
          unlimited: nextUnlimited,
        },
        referenceId: params.actor.uid,
        summary:
          params.reason ||
          `Superadmin adjusted Partner lead-application credits (Free: ${nextFree}, Paid: ${nextPaid}, Unlimited: ${nextUnlimited})`,
        createdAt: now,
      };
      tx.set(db.collection('entitlement_ledger').doc(ledId), led);
    }
  });

  await recordAuditLog({
    actorUid: params.actor.uid,
    actorName: params.actor.name,
    actorRole: 'superadmin',
    module: 'users',
    action: 'quota.admin_override',
    targetType: 'role_profile',
    targetId: `${params.uid}_${params.role}`,
    summary: `Adjusted ${params.role} quota for ${params.uid}`,
    metadata: {
      freeRemaining: params.freeRemaining,
      paidRemaining: params.paidRemaining,
      unlimited: params.unlimited,
      reason: params.reason,
    },
  });

  const snap = await profRef.get();
  const raw = snap.data() as AnyRoleProfile;
  return raw.role === 'client' ? normalizeClientProfile(raw) : normalizePartnerProfile(raw);
}
