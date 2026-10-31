import { requireFirestore } from '@/lib/firebase/admin';
import { normalizePhoneE164 } from '@/lib/crm/phone';
import { recordAuditLog } from '@/lib/services/audit';
import { NotFoundError, ValidationError } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  ConsentStatus,
  ContactSegment,
  CrmContact,
  CrmContactState,
  CrmContactType,
  CrmDatabaseType,
  CrmInvitationStatus,
  CustomerRole,
  WhatsAppConsentRecord,
} from '@/lib/types/domain';

export function inferCrmDatabaseType(contact: Partial<CrmContact>): CrmDatabaseType {
  if (contact.databaseType === 'client' || contact.databaseType === 'partner') {
    return contact.databaseType;
  }
  if (contact.roles?.includes('partner') && !contact.roles?.includes('client')) {
    return 'partner';
  }
  if (contact.roles?.includes('client')) {
    return 'client';
  }
  if (
    (contact.servicesOffered && contact.servicesOffered.length > 0) ||
    contact.categoryId ||
    contact.categoryName
  ) {
    return 'partner';
  }
  return 'client';
}

export function normalizeCrmContactRecord(raw: CrmContact): CrmContact {
  const databaseType = inferCrmDatabaseType(raw);
  const existingTypes = raw.databaseTypes || [];
  const databaseTypes: CrmDatabaseType[] = Array.from(
    new Set(
      [databaseType, ...existingTypes].filter(
        (t): t is CrmDatabaseType => t === 'client' || t === 'partner'
      )
    )
  );
  const validRoles = (raw.roles || []).filter(
    (r): r is CustomerRole => r === 'client' || r === 'partner'
  );
  const roles: CustomerRole[] = validRoles.length > 0 ? validRoles : databaseTypes;
  const invitationStatus: CrmInvitationStatus =
    raw.invitationStatus ||
    (raw.linkedUid
      ? 'registered'
      : (raw.campaignsSentCount || 0) > 0
        ? 'invited'
        : 'not_invited');

  return {
    ...raw,
    databaseType,
    databaseTypes,
    roles,
    invitationStatus,
    clientInvitationStatus:
      raw.clientInvitationStatus || (databaseTypes.includes('client') ? invitationStatus : undefined),
    partnerInvitationStatus:
      raw.partnerInvitationStatus || (databaseTypes.includes('partner') ? invitationStatus : undefined),
  };
}

export async function isPhoneSuppressed(phoneE164: string): Promise<boolean> {
  const db = requireFirestore();
  const [supSnap, crmSnap] = await Promise.all([
    db.collection('suppression_list').doc(phoneE164).get(),
    db.collection('crm_contacts').doc(phoneE164).get(),
  ]);
  if (supSnap.exists && supSnap.data()?.active !== false) {
    return true;
  }
  if (crmSnap.exists) {
    const crm = crmSnap.data() as CrmContact;
    if (
      crm.consentStatus === 'opted_out' ||
      crm.crmState === 'opted_out_contact' ||
      crm.crmState === 'suspended_contact'
    ) {
      return true;
    }
  }
  return false;
}

export async function recordWhatsAppConsent(params: {
  phoneE164: string;
  uid?: string | null;
  newStatus: ConsentStatus;
  channel: WhatsAppConsentRecord['channel'];
  evidenceNote: string;
  actorId?: string | null;
}): Promise<WhatsAppConsentRecord> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const crmRef = db.collection('crm_contacts').doc(params.phoneE164);
  const crmSnap = await crmRef.get();
  const previousStatus: ConsentStatus = crmSnap.exists
    ? ((crmSnap.data() as CrmContact).consentStatus || 'none')
    : 'none';

  const id = generateDocId('cns');
  const record: WhatsAppConsentRecord = {
    id,
    phoneE164: params.phoneE164,
    uid: params.uid || null,
    previousStatus,
    newStatus: params.newStatus,
    channel: params.channel,
    evidenceNote: params.evidenceNote,
    actorId: params.actorId || null,
    createdAt: now,
  };

  const batch = db.batch();
  batch.set(db.collection('whatsapp_consent_records').doc(id), record);

  if (params.newStatus === 'opted_out') {
    batch.set(
      db.collection('suppression_list').doc(params.phoneE164),
      {
        phoneE164: params.phoneE164,
        active: true,
        reason: params.evidenceNote,
        channel: params.channel,
        updatedAt: now,
      },
      { merge: true }
    );
  } else if (params.newStatus === 'opted_in') {
    batch.set(
      db.collection('suppression_list').doc(params.phoneE164),
      {
        phoneE164: params.phoneE164,
        active: false,
        resumedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  if (crmSnap.exists) {
    const existing = crmSnap.data() as CrmContact;
    const nextCrmState: CrmContactState =
      params.newStatus === 'opted_out'
        ? 'opted_out_contact'
        : existing.crmState === 'opted_out_contact'
          ? existing.linkedUid
            ? 'registered_customer'
            : 'imported_prospect'
          : existing.crmState;

    batch.set(
      crmRef,
      {
        consentStatus: params.newStatus,
        consentSource: params.channel,
        consentRecordedAt: now,
        crmState: nextCrmState,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  await batch.commit();
  return record;
}

/**
 * Non-destructive upsert into `crm_contacts/{phoneE164}`:
 * - Supports Client Database (`databaseType: 'client'`) & Partner Database (`databaseType: 'partner'`)
 * - Preserves `opted_out` consent status & suppression flags
 * - Preserves `linkedUid` & verified KYC status
 * - Merges businessInfo, servicesOffered, skills, roles, and contactTypes cleanly
 */
export async function upsertCrmContactNonDestructive(input: {
  databaseType?: CrmDatabaseType;
  phoneRaw: string;
  whatsappRaw?: string;
  confirmedCountry?: string;
  contactName: string;
  companyName?: string;
  businessInfo?: string;
  servicesOffered?: string[];
  email?: string | null;
  website?: string | null;
  city?: string;
  state?: string;
  country?: string;
  sectorId?: string | null;
  sectorName?: string;
  categoryId?: string | null;
  categoryName?: string;
  subcategoryId?: string | null;
  subcategoryName?: string;
  skillTagIds?: string[];
  skills?: string[];
  contactTypes?: CrmContactType[];
  roles?: CustomerRole[];
  consentStatus?: ConsentStatus;
  consentEvidenceNote?: string;
  invitationStatus?: CrmInvitationStatus;
  source?: string;
  notes?: string;
  conflictMode?: 'merge_preserve' | 'skip_existing';
}): Promise<{ action: 'created' | 'updated' | 'skipped'; contact: CrmContact }> {
  const norm = normalizePhoneE164(
    input.whatsappRaw || input.phoneRaw,
    input.confirmedCountry || input.country
  );
  if (!norm.isValid || !norm.phoneE164) {
    throw new ValidationError(
      `Invalid mobile/WhatsApp number (${norm.errorReason || 'invalid_format'})`
    );
  }

  const db = requireFirestore();
  const phoneE164 = norm.phoneE164;
  const now = new Date().toISOString();
  const ref = db.collection('crm_contacts').doc(phoneE164);
  const snap = await ref.get();

  const sanitizedInputRoles = (input.roles || []).filter(
    (r): r is CustomerRole => r === 'client' || r === 'partner'
  );
  const resolvedDatabaseType: CrmDatabaseType =
    input.databaseType ||
    (sanitizedInputRoles.includes('partner') && !sanitizedInputRoles.includes('client')
      ? 'partner'
      : sanitizedInputRoles.includes('client')
        ? 'client'
        : input.servicesOffered?.length || input.categoryName
          ? 'partner'
          : 'client');
  const effectiveRoles: CustomerRole[] =
    sanitizedInputRoles.length > 0 ? sanitizedInputRoles : [resolvedDatabaseType];

  if (snap.exists) {
    const existing = normalizeCrmContactRecord(snap.data() as CrmContact);
    if (input.conflictMode === 'skip_existing') {
      return { action: 'skipped', contact: existing };
    }

    // Never overwrite an opted_out contact's consent!
    const canUpgradeConsent =
      existing.consentStatus !== 'opted_out' &&
      input.consentStatus === 'opted_in' &&
      existing.consentStatus !== 'opted_in';

    const existingDbTypes = existing.databaseTypes || [existing.databaseType];
    const incomingDbType = input.databaseType || resolvedDatabaseType;
    const mergedDbTypes: CrmDatabaseType[] = Array.from(
      new Set([...existingDbTypes, incomingDbType])
    );

    const merged: CrmContact = {
      ...existing,
      databaseType: incomingDbType,
      databaseTypes: mergedDbTypes,
      clientInvitationStatus:
        incomingDbType === 'client'
          ? existing.clientInvitationStatus || input.invitationStatus || 'not_invited'
          : existing.clientInvitationStatus,
      partnerInvitationStatus:
        incomingDbType === 'partner'
          ? existing.partnerInvitationStatus || input.invitationStatus || 'not_invited'
          : existing.partnerInvitationStatus,
      contactName: existing.linkedUid
        ? existing.contactName
        : input.contactName?.trim() || existing.contactName,
      companyName: input.companyName?.trim() || existing.companyName,
      businessInfo: input.businessInfo?.trim() || existing.businessInfo || '',
      servicesOffered: Array.from(
        new Set([...(existing.servicesOffered || []), ...(input.servicesOffered || [])])
      ),
      email: existing.email || input.email?.trim() || null,
      website: existing.website || input.website?.trim() || null,
      city: input.city?.trim() || existing.city,
      state: input.state?.trim() || existing.state,
      country: input.country?.trim() || existing.country,
      sectorId: input.sectorId || existing.sectorId || null,
      sectorName: input.sectorName || existing.sectorName,
      categoryId: input.categoryId || existing.categoryId || null,
      categoryName: input.categoryName || existing.categoryName,
      subcategoryId: input.subcategoryId || existing.subcategoryId || null,
      subcategoryName: input.subcategoryName || existing.subcategoryName,
      skillTagIds: Array.from(
        new Set([...(existing.skillTagIds || []), ...(input.skillTagIds || [])])
      ),
      skills: Array.from(new Set([...(existing.skills || []), ...(input.skills || [])])),
      contactTypes: Array.from(
        new Set([...(existing.contactTypes || []), ...(input.contactTypes || [])])
      ),
      roles: Array.from(new Set([...existing.roles, ...effectiveRoles])),
      notes: input.notes
        ? existing.notes
          ? `${existing.notes} | ${input.notes}`
          : input.notes
        : existing.notes,
      consentStatus: canUpgradeConsent ? 'opted_in' : existing.consentStatus,
      consentSource: canUpgradeConsent ? 'excel_import_verified' : existing.consentSource,
      consentRecordedAt: canUpgradeConsent ? now : existing.consentRecordedAt || null,
      invitationStatus: existing.linkedUid
        ? 'registered'
        : existing.invitationStatus || input.invitationStatus || 'not_invited',
      crmState: existing.crmState,
      verificationStatus: existing.verificationStatus,
      linkedUid: existing.linkedUid,
      updatedAt: now,
    };

    await ref.set(merged);

    if (canUpgradeConsent) {
      const cnsId = generateDocId('cns');
      const consentRecord: WhatsAppConsentRecord = {
        id: cnsId,
        phoneE164,
        uid: existing.linkedUid || null,
        previousStatus: existing.consentStatus,
        newStatus: 'opted_in',
        channel: 'excel_import_verified',
        evidenceNote:
          input.consentEvidenceNote ||
          `Verified opt-in imported via ${input.source || 'Superadmin CRM'}`,
        createdAt: now,
      };
      await db.collection('whatsapp_consent_records').doc(cnsId).set(consentRecord);
    }

    return { action: 'updated', contact: merged };
  }

  // Check if a registered user already owns this phone in `phone_index`
  const idxSnap = await db.collection('phone_index').doc(phoneE164).get();
  const linkedUid = idxSnap.exists ? (idxSnap.data()?.uid as string | null) || null : null;

  const initialConsent: ConsentStatus = input.consentStatus || 'none';
  const initialCrmState: CrmContactState =
    initialConsent === 'opted_out'
      ? 'opted_out_contact'
      : linkedUid
        ? 'registered_customer'
        : 'imported_prospect';

  const created: CrmContact = {
    id: phoneE164,
    databaseType: resolvedDatabaseType,
    databaseTypes: [resolvedDatabaseType],
    phoneE164,
    whatsappE164: phoneE164,
    originalPhoneRaw: String(input.phoneRaw),
    countryCode: norm.countryCallingCode || '',
    countryIso2: norm.countryIso2 || 'IN',
    contactName: input.contactName.trim() || 'Business Contact',
    companyName: input.companyName?.trim() || '',
    businessInfo: input.businessInfo?.trim() || '',
    servicesOffered: input.servicesOffered || [],
    email: input.email?.trim() || null,
    website: input.website?.trim() || null,
    city: input.city?.trim() || '',
    state: input.state?.trim() || '',
    country:
      input.country?.trim() || (norm.countryIso2 === 'IN' ? 'India' : norm.countryIso2 || ''),
    sectorId: input.sectorId || null,
    sectorName: input.sectorName || '',
    categoryId: input.categoryId || null,
    categoryName: input.categoryName || '',
    subcategoryId: input.subcategoryId || null,
    subcategoryName: input.subcategoryName || '',
    skillTagIds: input.skillTagIds || [],
    skills: input.skills || [],
    contactTypes: input.contactTypes || [],
    roles: effectiveRoles,
    source: input.source || 'Superadmin CRM',
    notes: input.notes || '',
    crmState: initialCrmState,
    consentStatus: initialConsent,
    consentSource: initialConsent !== 'none' ? 'excel_import_verified' : undefined,
    consentRecordedAt: initialConsent !== 'none' ? now : null,
    invitationStatus: linkedUid ? 'registered' : input.invitationStatus || 'not_invited',
    clientInvitationStatus:
      resolvedDatabaseType === 'client'
        ? linkedUid
          ? 'registered'
          : input.invitationStatus || 'not_invited'
        : undefined,
    partnerInvitationStatus:
      resolvedDatabaseType === 'partner'
        ? linkedUid
          ? 'registered'
          : input.invitationStatus || 'not_invited'
        : undefined,
    lastInvitedAt: null,
    registeredAt: linkedUid ? now : null,
    verificationStatus: 'unverified',
    linkedUid,
    campaignsSentCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(ref, created);
  batch.set(
    db.collection('phone_index').doc(phoneE164),
    {
      phoneE164,
      uid: linkedUid,
      crmContactId: phoneE164,
      updatedAt: now,
    },
    { merge: true }
  );

  if (initialConsent === 'opted_in' || initialConsent === 'opted_out') {
    const cnsId = generateDocId('cns');
    const consentRecord: WhatsAppConsentRecord = {
      id: cnsId,
      phoneE164,
      uid: linkedUid,
      previousStatus: 'none',
      newStatus: initialConsent,
      channel: 'excel_import_verified',
      evidenceNote:
        input.consentEvidenceNote ||
        `Consent (${initialConsent}) recorded during ${input.source || 'Superadmin CRM'} import`,
      createdAt: now,
    };
    batch.set(db.collection('whatsapp_consent_records').doc(cnsId), consentRecord);

    if (initialConsent === 'opted_out') {
      batch.set(
        db.collection('suppression_list').doc(phoneE164),
        {
          phoneE164,
          active: true,
          reason: 'Imported with opted_out status',
          channel: 'excel_import_verified',
          updatedAt: now,
        },
        { merge: true }
      );
    }
  }

  await batch.commit();
  return { action: 'created', contact: created };
}

export async function listCrmContacts(filters?: {
  databaseType?: CrmDatabaseType;
  invitationStatus?: CrmInvitationStatus;
  search?: string;
  crmState?: CrmContactState;
  consentStatus?: ConsentStatus;
  role?: CustomerRole;
  sectorId?: string;
  categoryId?: string;
  city?: string;
  limit?: number;
}): Promise<CrmContact[]> {
  const db = requireFirestore();
  const limit = Math.min(Math.max(filters?.limit || 300, 1), 1000);
  const snap = await db
    .collection('crm_contacts')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  let items = snap.docs.map((d) => normalizeCrmContactRecord(d.data() as CrmContact));

  if (filters?.databaseType) {
    items = items.filter(
      (c) =>
        c.databaseTypes?.includes(filters.databaseType!) ||
        c.databaseType === filters.databaseType
    );
  }
  if (filters?.invitationStatus) {
    items = items.filter((c) => c.invitationStatus === filters.invitationStatus);
  }
  if (filters?.crmState) {
    items = items.filter((c) => c.crmState === filters.crmState);
  }
  if (filters?.consentStatus) {
    items = items.filter((c) => c.consentStatus === filters.consentStatus);
  }
  if (filters?.role) {
    items = items.filter((c) => c.roles?.includes(filters.role!));
  }
  if (filters?.sectorId) {
    items = items.filter((c) => c.sectorId === filters.sectorId);
  }
  if (filters?.categoryId) {
    items = items.filter((c) => c.categoryId === filters.categoryId);
  }
  if (filters?.city) {
    const qCity = filters.city.toLowerCase();
    items = items.filter((c) => c.city.toLowerCase().includes(qCity));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.contactName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.businessInfo && c.businessInfo.toLowerCase().includes(q)) ||
        (c.servicesOffered && c.servicesOffered.some((s) => s.toLowerCase().includes(q))) ||
        c.phoneE164.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.city.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
    );
  }

  return items;
}

export async function updateCrmContactById(
  phoneE164: string,
  patch: Partial<
    Pick<
      CrmContact,
      | 'databaseType'
      | 'contactName'
      | 'companyName'
      | 'businessInfo'
      | 'servicesOffered'
      | 'email'
      | 'website'
      | 'city'
      | 'state'
      | 'country'
      | 'sectorId'
      | 'sectorName'
      | 'categoryId'
      | 'categoryName'
      | 'subcategoryId'
      | 'subcategoryName'
      | 'skills'
      | 'roles'
      | 'crmState'
      | 'invitationStatus'
      | 'notes'
    >
  >,
  actor: { uid: string; name: string }
): Promise<CrmContact> {
  const db = requireFirestore();
  const ref = db.collection('crm_contacts').doc(phoneE164);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('CRM contact not found');

  const existing = normalizeCrmContactRecord(snap.data() as CrmContact);
  const updated: CrmContact = normalizeCrmContactRecord({
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  await ref.set(updated);

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'crm',
    action: 'crm_contact.updated',
    targetType: 'crm_contact',
    targetId: phoneE164,
    summary: `Updated ${updated.databaseType.toUpperCase()} contact ${updated.contactName} (${phoneE164})`,
  });

  return updated;
}

/**
 * Evaluates a Contact Segment against `crm_contacts`.
 */
export async function evaluateSegmentContacts(
  segmentFilters: ContactSegment['filters']
): Promise<CrmContact[]> {
  const db = requireFirestore();
  const snap = await db.collection('crm_contacts').get();
  const nowMs = Date.now();

  return snap.docs
    .map((d) => normalizeCrmContactRecord(d.data() as CrmContact))
    .filter((c) => {
      if (segmentFilters.databaseType && c.databaseType !== segmentFilters.databaseType) {
        return false;
      }
      if (segmentFilters.roles?.length) {
        const hasMatch = segmentFilters.roles.some((r) => c.roles?.includes(r));
        if (!hasMatch) return false;
      }
      if (segmentFilters.sectorId && c.sectorId !== segmentFilters.sectorId) return false;
      if (segmentFilters.categoryId && c.categoryId !== segmentFilters.categoryId) return false;
      if (segmentFilters.subcategoryId && c.subcategoryId !== segmentFilters.subcategoryId)
        return false;
      if (
        segmentFilters.city &&
        c.city.toLowerCase() !== segmentFilters.city.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        segmentFilters.country &&
        c.country.toLowerCase() !== segmentFilters.country.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        segmentFilters.verificationStatus &&
        c.verificationStatus !== segmentFilters.verificationStatus
      ) {
        return false;
      }
      if (segmentFilters.crmState && c.crmState !== segmentFilters.crmState) {
        return false;
      }
      if (segmentFilters.consentStatus && c.consentStatus !== segmentFilters.consentStatus) {
        return false;
      }
      if (
        segmentFilters.invitationStatus &&
        c.invitationStatus !== segmentFilters.invitationStatus
      ) {
        return false;
      }
      if (segmentFilters.engagedWithinDays && segmentFilters.engagedWithinDays > 0) {
        if (!c.lastEngagedAt) return false;
        const diffDays = (nowMs - new Date(c.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > segmentFilters.engagedWithinDays) return false;
      }
      return true;
    });
}

export async function createContactSegment(
  input: {
    name: string;
    description?: string;
    filters: ContactSegment['filters'];
  },
  actor: { uid: string; name: string }
): Promise<ContactSegment> {
  const db = requireFirestore();
  const matching = await evaluateSegmentContacts(input.filters);
  const id = generateDocId('seg');
  const now = new Date().toISOString();

  const segment: ContactSegment = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || '',
    filters: input.filters,
    estimatedCount: matching.length,
    createdBy: actor.uid,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('contact_segments').doc(id).set(segment);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'crm',
    action: 'segment.created',
    targetType: 'contact_segment',
    targetId: id,
    summary: `Created CRM segment "${segment.name}" (${matching.length} contacts)`,
  });

  return segment;
}

export async function listContactSegments(): Promise<ContactSegment[]> {
  const db = requireFirestore();
  const snap = await db.collection('contact_segments').orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => d.data() as ContactSegment);
}
