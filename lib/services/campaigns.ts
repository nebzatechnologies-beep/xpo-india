import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import {
  evaluateSegmentContacts,
  isPhoneSuppressed,
  listCrmContacts,
} from '@/lib/services/crm';
import { NotFoundError, ValidationError } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import { ensureTemplatesInitialized } from '@/lib/whatsapp/meta-client';
import { dispatchOutboundWhatsApp } from '@/lib/whatsapp/notification-service';
import type {
  ContactSegment,
  CrmContact,
  CrmDatabaseType,
  WhatsAppCampaign,
} from '@/lib/types/domain';

const MARKETING_COST_PER_MSG_INR = 0.88;

function resolveContactVariable(contact: CrmContact, key: string): string {
  switch (key) {
    case 'contactName':
    case 'user_name':
    case 'partner_name':
    case 'client_name':
      return contact.contactName || 'Business Contact';
    case 'companyName':
    case 'company_name':
      return contact.companyName || contact.contactName || 'Your Business';
    case 'city':
      return contact.city || contact.country || 'India';
    case 'categoryName':
    case 'category_name':
      return (
        contact.categoryName ||
        contact.servicesOffered?.[0] ||
        contact.sectorName ||
        'Business Services'
      );
    default:
      return key;
  }
}

export interface RoleInvitePreview {
  databaseType: CrmDatabaseType;
  totalMatchingScope: number;
  consentedEligibleCount: number;
  missingConsentCount: number;
  suppressedCount: number;
  alreadyRegisteredCount: number;
  alreadyInvitedCount: number;
  estimatedCostInr: number;
  sampleRecipients: Array<{
    phoneE164: string;
    contactName: string;
    companyName: string;
    city: string;
    categoryName: string;
  }>;
}

export async function previewRoleDatabaseInvitations(params: {
  databaseType: CrmDatabaseType;
  city?: string;
  categoryId?: string;
  onlyUninvited?: boolean;
}): Promise<RoleInvitePreview> {
  const allInDb = await listCrmContacts({
    databaseType: params.databaseType,
    city: params.city || undefined,
    categoryId: params.categoryId || undefined,
    limit: 1000,
  });

  let consentedEligibleCount = 0;
  let missingConsentCount = 0;
  let suppressedCount = 0;
  let alreadyRegisteredCount = 0;
  let alreadyInvitedCount = 0;
  const sampleRecipients: RoleInvitePreview['sampleRecipients'] = [];

  for (const c of allInDb) {
    const effectiveStatus =
      params.databaseType === 'client'
        ? c.clientInvitationStatus || c.invitationStatus
        : params.databaseType === 'partner'
          ? c.partnerInvitationStatus || c.invitationStatus
          : c.invitationStatus;

    if (c.linkedUid || effectiveStatus === 'registered') {
      alreadyRegisteredCount++;
      continue;
    }
    if (params.onlyUninvited && effectiveStatus && effectiveStatus !== 'not_invited') {
      alreadyInvitedCount++;
      continue;
    }
    const sup = await isPhoneSuppressed(c.phoneE164);
    if (sup) {
      suppressedCount++;
      continue;
    }
    if (c.consentStatus !== 'opted_in') {
      missingConsentCount++;
      continue;
    }
    consentedEligibleCount++;
    if (sampleRecipients.length < 10) {
      sampleRecipients.push({
        phoneE164: c.phoneE164,
        contactName: c.contactName,
        companyName: c.companyName,
        city: c.city,
        categoryName: c.categoryName || c.servicesOffered?.[0] || '',
      });
    }
  }

  return {
    databaseType: params.databaseType,
    totalMatchingScope: allInDb.length,
    consentedEligibleCount,
    missingConsentCount,
    suppressedCount,
    alreadyRegisteredCount,
    alreadyInvitedCount,
    estimatedCostInr: Number((consentedEligibleCount * MARKETING_COST_PER_MSG_INR).toFixed(2)),
    sampleRecipients,
  };
}

/**
 * Superadmin Step 4: Separate Bulk WhatsApp Invitations for Client Database vs Partner Database.
 * Strictly contacts ONLY recipients with required `opted_in` consent and excludes `suppression_list`.
 */
export async function launchRoleDatabaseInvitations(
  params: {
    databaseType: CrmDatabaseType;
    name?: string;
    templateId?: string;
    city?: string;
    categoryId?: string;
    onlyUninvited?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<WhatsAppCampaign> {
  const db = requireFirestore();
  const templates = await ensureTemplatesInitialized();
  const defaultTemplateId =
    params.databaseType === 'client' ? 'tpl_client_invite' : 'tpl_partner_invite';
  const chosenTemplateId = params.templateId || defaultTemplateId;

  const template = templates.find(
    (t) => t.id === chosenTemplateId || t.name === chosenTemplateId
  );
  if (!template) throw new NotFoundError('WhatsApp invitation template not found');
  if (template.metaStatus !== 'APPROVED') {
    throw new ValidationError('Only Meta APPROVED templates can be used for bulk invitations.');
  }

  const allInDb = await listCrmContacts({
    databaseType: params.databaseType,
    city: params.city || undefined,
    categoryId: params.categoryId || undefined,
    limit: 1000,
  });

  const eligibleContacts: CrmContact[] = [];
  let suppressedSkippedCount = 0;

  for (const c of allInDb) {
    const effectiveStatus =
      params.databaseType === 'client'
        ? c.clientInvitationStatus || c.invitationStatus
        : params.databaseType === 'partner'
          ? c.partnerInvitationStatus || c.invitationStatus
          : c.invitationStatus;

    if (c.linkedUid || effectiveStatus === 'registered') continue;
    if (params.onlyUninvited && effectiveStatus && effectiveStatus !== 'not_invited') {
      continue;
    }
    const sup = await isPhoneSuppressed(c.phoneE164);
    if (sup || c.consentStatus !== 'opted_in') {
      suppressedSkippedCount++;
      continue;
    }
    eligibleContacts.push(c);
  }

  if (eligibleContacts.length === 0) {
    throw new ValidationError(
      `No eligible ${params.databaseType === 'client' ? 'Client' : 'Partner'} contacts with verified 'opted_in' consent match your filters.`
    );
  }

  const nowIso = new Date().toISOString();
  const segId = `seg_auto_${params.databaseType}_invite`;
  const segName =
    params.databaseType === 'client'
      ? 'Client Database (Opted-In Prospects)'
      : 'Partner Database (Opted-In Prospects)';

  await db
    .collection('contact_segments')
    .doc(segId)
    .set(
      {
        id: segId,
        name: segName,
        description: `Auto-managed invitation segment for ${params.databaseType} database`,
        filters: {
          databaseType: params.databaseType,
          consentStatus: 'opted_in',
          ...(params.city ? { city: params.city } : {}),
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        },
        estimatedCount: eligibleContacts.length,
        createdBy: actor.uid,
        createdAt: nowIso,
        updatedAt: nowIso,
      } satisfies ContactSegment,
      { merge: true }
    );

  const campaignId = generateDocId('cmp');
  const campaignName =
    params.name?.trim() ||
    `${params.databaseType === 'client' ? 'Client' : 'Partner'} WhatsApp Invitation (${new Date().toLocaleDateString('en-IN')})`;

  const initialCampaign: WhatsAppCampaign = {
    id: campaignId,
    name: campaignName,
    databaseType: params.databaseType,
    segmentId: segId,
    segmentName: segName,
    templateId: template.id,
    templateName: template.name,
    templateVariablesMap: {},
    eligibleRecipientCount: eligibleContacts.length,
    suppressedSkippedCount,
    estimatedCostInr: Number((eligibleContacts.length * MARKETING_COST_PER_MSG_INR).toFixed(2)),
    status: 'running',
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    repliedCount: 0,
    convertedCount: 0,
    createdByUid: actor.uid,
    scheduledAt: null,
    createdAt: nowIso,
  };

  await db.collection('whatsapp_campaigns').doc(campaignId).set(initialCampaign);

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of eligibleContacts) {
    const vars = (template.variables || []).map((vKey) => resolveContactVariable(contact, vKey));
    try {
      await dispatchOutboundWhatsApp({
        sessionId: contact.phoneE164,
        phoneE164: contact.phoneE164,
        isSimulated: false,
        messageType: 'template',
        body: template.bodyText,
        templateName: template.name,
        templateLanguage: template.language || 'en',
        templateVariables: vars,
      });
      sentCount++;
      const contactUpdate: Record<string, unknown> = {
        invitationStatus: 'invited',
        lastInvitedAt: nowIso,
        campaignsSentCount: (contact.campaignsSentCount || 0) + 1,
        updatedAt: nowIso,
      };
      if (initialCampaign.databaseType === 'client') {
        contactUpdate.clientInvitationStatus = 'invited';
        contactUpdate.lastClientInvitedAt = nowIso;
      } else if (initialCampaign.databaseType === 'partner') {
        contactUpdate.partnerInvitationStatus = 'invited';
        contactUpdate.lastPartnerInvitedAt = nowIso;
      }
      await db
        .collection('crm_contacts')
        .doc(contact.phoneE164)
        .set(contactUpdate, { merge: true });
    } catch {
      failedCount++;
    }
  }

  const completedAt = new Date().toISOString();
  await db
    .collection('whatsapp_campaigns')
    .doc(campaignId)
    .set(
      {
        status: 'completed',
        sentCount,
        failedCount,
        completedAt,
      },
      { merge: true }
    );

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'campaigns',
    action: `${params.databaseType}_invitations.launched`,
    targetType: 'whatsapp_campaign',
    targetId: campaignId,
    summary: `Dispatched ${params.databaseType.toUpperCase()} WhatsApp invitations "${campaignName}" (${sentCount} sent, ${failedCount} failed, ${suppressedSkippedCount} skipped unconsented/suppressed)`,
  });

  return (await db.collection('whatsapp_campaigns').doc(campaignId).get()).data() as WhatsAppCampaign;
}

export async function createCampaignDraft(
  input: {
    name: string;
    segmentId: string;
    templateId: string;
    templateVariablesMap?: Record<string, string>;
    scheduledAt?: string | null;
  },
  actor: { uid: string; name: string }
): Promise<WhatsAppCampaign> {
  const db = requireFirestore();
  const segSnap = await db.collection('contact_segments').doc(input.segmentId).get();
  if (!segSnap.exists) throw new NotFoundError('Target CRM segment not found');
  const segment = segSnap.data() as ContactSegment;

  const templates = await ensureTemplatesInitialized();
  const template = templates.find((t) => t.id === input.templateId || t.name === input.templateId);
  if (!template) throw new NotFoundError('WhatsApp template not found');
  if (template.metaStatus !== 'APPROVED') {
    throw new ValidationError('Only Meta APPROVED templates can be used in broadcast campaigns.');
  }

  const matchedContacts = await evaluateSegmentContacts(segment.filters);
  let eligibleRecipientCount = 0;
  let suppressedSkippedCount = 0;

  for (const c of matchedContacts) {
    const sup = await isPhoneSuppressed(c.phoneE164);
    if (sup || c.consentStatus !== 'opted_in') suppressedSkippedCount++;
    else eligibleRecipientCount++;
  }

  const id = generateDocId('cmp');
  const nowIso = new Date().toISOString();
  const campaign: WhatsAppCampaign = {
    id,
    name: input.name.trim(),
    databaseType: segment.filters.databaseType || null,
    segmentId: segment.id,
    segmentName: segment.name,
    templateId: template.id,
    templateName: template.name,
    templateVariablesMap: input.templateVariablesMap || {},
    eligibleRecipientCount,
    suppressedSkippedCount,
    estimatedCostInr: Number((eligibleRecipientCount * MARKETING_COST_PER_MSG_INR).toFixed(2)),
    status: 'draft',
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    repliedCount: 0,
    convertedCount: 0,
    createdByUid: actor.uid,
    scheduledAt: input.scheduledAt || null,
    createdAt: nowIso,
  };

  await db.collection('whatsapp_campaigns').doc(id).set(campaign);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'campaigns',
    action: 'campaign.draft_created',
    targetType: 'whatsapp_campaign',
    targetId: id,
    summary: `Created WhatsApp campaign draft "${campaign.name}" (${eligibleRecipientCount} consented eligible, ${suppressedSkippedCount} skipped)`,
  });

  return campaign;
}

export async function approveAndLaunchCampaign(
  campaignId: string,
  actor: { uid: string; name: string }
): Promise<WhatsAppCampaign> {
  const db = requireFirestore();
  const ref = db.collection('whatsapp_campaigns').doc(campaignId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Campaign not found');

  const campaign = snap.data() as WhatsAppCampaign;
  if (campaign.status === 'completed' || campaign.status === 'running') {
    return campaign;
  }

  const segSnap = await db.collection('contact_segments').doc(campaign.segmentId).get();
  if (!segSnap.exists) throw new NotFoundError('Campaign segment no longer exists');
  const segment = segSnap.data() as ContactSegment;

  const templates = await ensureTemplatesInitialized();
  const template = templates.find((t) => t.id === campaign.templateId);
  if (!template) throw new NotFoundError('Campaign template missing');

  await ref.set({ status: 'running' }, { merge: true });

  const contacts = await evaluateSegmentContacts(segment.filters);
  let sentCount = 0;
  let failedCount = 0;
  let suppressedSkippedCount = 0;
  const nowIso = new Date().toISOString();

  for (const contact of contacts) {
    const sup = await isPhoneSuppressed(contact.phoneE164);
    if (sup || contact.consentStatus !== 'opted_in') {
      suppressedSkippedCount++;
      continue;
    }

    const vars = (template.variables || []).map((vKey) => {
      const mapped = campaign.templateVariablesMap[vKey];
      return resolveContactVariable(contact, mapped || vKey);
    });

    try {
      await dispatchOutboundWhatsApp({
        sessionId: contact.phoneE164,
        phoneE164: contact.phoneE164,
        isSimulated: false,
        messageType: 'template',
        body: template.bodyText,
        templateName: template.name,
        templateLanguage: template.language || 'en',
        templateVariables: vars,
      });
      sentCount++;
      const contactUpdate: Record<string, unknown> = {
        invitationStatus: contact.linkedUid ? 'registered' : 'invited',
        lastInvitedAt: nowIso,
        campaignsSentCount: (contact.campaignsSentCount || 0) + 1,
        updatedAt: nowIso,
      };
      if (campaign.databaseType === 'client') {
        contactUpdate.clientInvitationStatus = contact.linkedUid ? 'registered' : 'invited';
        contactUpdate.lastClientInvitedAt = nowIso;
      } else if (campaign.databaseType === 'partner') {
        contactUpdate.partnerInvitationStatus = contact.linkedUid ? 'registered' : 'invited';
        contactUpdate.lastPartnerInvitedAt = nowIso;
      }
      await db
        .collection('crm_contacts')
        .doc(contact.phoneE164)
        .set(contactUpdate, { merge: true });
    } catch {
      failedCount++;
    }
  }

  const completedAt = new Date().toISOString();
  await ref.set(
    {
      status: 'completed',
      sentCount,
      failedCount,
      suppressedSkippedCount,
      completedAt,
    },
    { merge: true }
  );

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'campaigns',
    action: 'campaign.launched',
    targetType: 'whatsapp_campaign',
    targetId: campaignId,
    summary: `Executed WhatsApp broadcast "${campaign.name}" (${sentCount} sent, ${failedCount} failed, ${suppressedSkippedCount} skipped)`,
  });

  return (await ref.get()).data() as WhatsAppCampaign;
}

export async function listWhatsAppCampaigns(
  databaseType?: CrmDatabaseType
): Promise<WhatsAppCampaign[]> {
  const db = requireFirestore();
  const snap = await db
    .collection('whatsapp_campaigns')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  const items = snap.docs.map((d) => d.data() as WhatsAppCampaign);
  return databaseType ? items.filter((c) => c.databaseType === databaseType) : items;
}
