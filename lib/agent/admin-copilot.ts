import { requireFirestore } from '@/lib/firebase/admin';
import { runStructuredAgentCompletion } from '@/lib/agent/llm-client';
import {
  launchRoleDatabaseInvitations,
  previewRoleDatabaseInvitations,
} from '@/lib/services/campaigns';
import { inferCrmDatabaseType } from '@/lib/services/crm';
import { ensureTemplatesInitialized } from '@/lib/whatsapp/meta-client';
import type {
  AiProviderType,
  CrmContact,
  CrmDatabaseType,
  MutualConnection,
  PaymentEventRecord,
  ServiceRequirement,
  UserSubscription,
  WhatsAppLeadOffer,
  XpoUser,
} from '@/lib/types/domain';

export type AdminCopilotCard =
  | {
      type: 'operations_snapshot';
      metrics: {
        clientDbTotal: number;
        clientDbOptedInUninvited: number;
        partnerDbTotal: number;
        partnerDbOptedInUninvited: number;
        registeredClients: number;
        registeredPartners: number;
        activeRequirements: number;
        offersClaimed: number;
        candidateUnlocks: number;
        acceptedConnections: number;
        activeClientPlans: number;
        activePartnerPlans: number;
        revenueInr: number;
        revenueUsd: number;
      };
    }
  | {
      type: 'invitation_preview';
      databaseType: CrmDatabaseType;
      templateId: string;
      templateName: string;
      city: string | null;
      eligibleCount: number;
      suppressedOrUnconsentedCount: number;
      estimatedCostInr: number;
    }
  | {
      type: 'invitation_dispatched';
      campaignId: string;
      campaignName: string;
      databaseType: CrmDatabaseType;
      sentCount: number;
      failedCount: number;
      suppressedSkippedCount: number;
    };

export interface AdminCopilotResponse {
  reply: string;
  providerUsed: AiProviderType;
  cards: AdminCopilotCard[];
  suggestedPrompts: string[];
}

export async function runAdminCopilotTurn(params: {
  adminUid: string;
  adminName: string;
  message?: string;
  confirmAction?: {
    type: 'launch_invitations';
    databaseType: CrmDatabaseType;
    templateId: string;
    city?: string | null;
  };
}): Promise<AdminCopilotResponse> {
  const defaultPrompts = [
    'Give me a full XPO funnel & revenue summary',
    'Preview bulk WhatsApp invitations for opted-in Partners',
    'Preview bulk WhatsApp invitations for opted-in Clients',
    'How many Partner profile unlocks and mutual connections happened?',
  ];

  // 1. Confirmed Action Execution (Dispatch Bulk Invitations)
  if (params.confirmAction?.type === 'launch_invitations') {
    const campaign = await launchRoleDatabaseInvitations(
      {
        databaseType: params.confirmAction.databaseType,
        templateId: params.confirmAction.templateId,
        city: params.confirmAction.city || undefined,
        onlyUninvited: true,
      },
      { uid: params.adminUid, name: params.adminName }
    );

    return {
      reply: `Dispatched *${campaign.sentCount}* ${params.confirmAction.databaseType === 'client' ? 'Client' : 'Partner'} WhatsApp invitations using *${campaign.templateName}* (${campaign.suppressedSkippedCount} unconsented/suppressed contacts safely skipped).`,
      providerUsed: 'deterministic',
      cards: [
        {
          type: 'invitation_dispatched',
          campaignId: campaign.id,
          campaignName: campaign.name,
          databaseType: params.confirmAction.databaseType,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          suppressedSkippedCount: campaign.suppressedSkippedCount,
        },
      ],
      suggestedPrompts: defaultPrompts,
    };
  }

  // 2. Gather Live Platform Operational Snapshot
  const db = requireFirestore();
  await ensureTemplatesInitialized();

  const [
    crmSnap,
    usersSnap,
    reqsSnap,
    offersSnap,
    unlocksSnap,
    connsSnap,
    subsSnap,
    paySnap,
  ] = await Promise.all([
    db.collection('crm_contacts').get(),
    db.collection('users').get(),
    db.collection('requirements').get(),
    db.collection('whatsapp_lead_offers').get(),
    db.collection('client_candidate_unlocks').get(),
    db.collection('connections').get(),
    db.collection('subscriptions').get(),
    db.collection('payment_events').get(),
  ]);

  let clientDbTotal = 0;
  let clientDbOptedInUninvited = 0;
  let partnerDbTotal = 0;
  let partnerDbOptedInUninvited = 0;

  for (const d of crmSnap.docs) {
    const raw = d.data() as Partial<CrmContact>;
    const dbType = inferCrmDatabaseType(raw);
    const isUninvitedOptedIn =
      raw.consentStatus === 'opted_in' &&
      !raw.linkedUid &&
      (!raw.invitationStatus || raw.invitationStatus === 'not_invited');

    if (dbType === 'partner') {
      partnerDbTotal++;
      if (isUninvitedOptedIn) partnerDbOptedInUninvited++;
    } else {
      clientDbTotal++;
      if (isUninvitedOptedIn) clientDbOptedInUninvited++;
    }
  }

  let registeredClients = 0;
  let registeredPartners = 0;
  for (const d of usersSnap.docs) {
    const u = d.data() as Partial<XpoUser>;
    if (u.isSuperadmin) continue;
    if (u.role === 'partner' || u.activeRole === 'partner') registeredPartners++;
    else registeredClients++;
  }

  let activeRequirements = 0;
  for (const d of reqsSnap.docs) {
    const r = d.data() as ServiceRequirement;
    if (r.moderationStatus === 'approved' && r.distributionStatus !== 'closed') {
      activeRequirements++;
    }
  }

  let offersClaimed = 0;
  for (const d of offersSnap.docs) {
    const o = d.data() as WhatsAppLeadOffer;
    if (o.status === 'claimed') offersClaimed++;
  }

  const candidateUnlocks = unlocksSnap.size;
  let acceptedConnections = 0;
  for (const d of connsSnap.docs) {
    const c = d.data() as MutualConnection;
    if (c.status === 'accepted') acceptedConnections++;
  }

  let activeClientPlans = 0;
  let activePartnerPlans = 0;
  for (const d of subsSnap.docs) {
    const s = d.data() as UserSubscription;
    if (s.status === 'active') {
      if (s.role === 'client') activeClientPlans++;
      else activePartnerPlans++;
    }
  }

  let revenueInr = 0;
  let revenueUsd = 0;
  for (const d of paySnap.docs) {
    const p = d.data() as PaymentEventRecord;
    if (p.status === 'captured') {
      if (p.currency === 'USD') revenueUsd += p.amount || 0;
      else revenueInr += p.amount || 0;
    }
  }

  const metrics = {
    clientDbTotal,
    clientDbOptedInUninvited,
    partnerDbTotal,
    partnerDbOptedInUninvited,
    registeredClients,
    registeredPartners,
    activeRequirements,
    offersClaimed,
    candidateUnlocks,
    acceptedConnections,
    activeClientPlans,
    activePartnerPlans,
    revenueInr: Number(revenueInr.toFixed(2)),
    revenueUsd: Number(revenueUsd.toFixed(2)),
  };

  const rawMsg = (params.message || '').trim();
  const lower = rawMsg.toLowerCase();

  interface AdminIntentJson {
    intent: 'summary' | 'preview_client_invites' | 'preview_partner_invites' | 'qa';
    cityFilter?: string | null;
    reply: string;
  }

  const { data: parsed, providerUsed } = await runStructuredAgentCompletion<AdminIntentJson>({
    systemInstruction:
      `You are the XPO Superadmin Operations Copilot. XPO has 2 CRM databases (Client Database & Partner Database), bulk WhatsApp invitations (strictly opted_in only), 5-minute Partner lead distribution, Client tap-to-unlock Partner profiles, mutual connections, and two-sided subscriptions (Client Plan & Partner Plan).\n` +
      `Live Platform Metrics: ${JSON.stringify(metrics)}\n` +
      `Return JSON: {"intent": "summary" | "preview_client_invites" | "preview_partner_invites" | "qa", "cityFilter"?: string | null, "reply": string}`,
    userPrompt: rawMsg || 'Give me a full XPO funnel & revenue summary',
    fallback: () => {
      const cityMatch = rawMsg.match(/\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
      const cityFilter = cityMatch?.[1]?.trim() || null;

      if (/\b(?:invite|invitation|invitations|campaign)\b/i.test(lower)) {
        if (/\bpartner/i.test(lower)) {
          return {
            intent: 'preview_partner_invites',
            cityFilter,
            reply:
              'Prepared a consent-verified preview for Partner Database WhatsApp invitations. Confirm below to dispatch.',
          };
        }
        return {
          intent: 'preview_client_invites',
          cityFilter,
          reply:
            'Prepared a consent-verified preview for Client Database WhatsApp invitations. Confirm below to dispatch.',
        };
      }

      return {
        intent: 'summary',
        cityFilter: null,
        reply:
          `Live XPO Summary: Client DB has ${metrics.clientDbTotal} contacts (${metrics.clientDbOptedInUninvited} opted-in uninvited) and Partner DB has ${metrics.partnerDbTotal} contacts (${metrics.partnerDbOptedInUninvited} opted-in uninvited). ` +
          `Activated accounts: ${metrics.registeredClients} Clients & ${metrics.registeredPartners} Partners. ` +
          `Marketplace activity: ${metrics.activeRequirements} active requirements, ${metrics.offersClaimed} 5-min Partner claims, ${metrics.candidateUnlocks} Partner unlocks, and ${metrics.acceptedConnections} mutual connections. ` +
          `Active Plans: ${metrics.activeClientPlans} Client + ${metrics.activePartnerPlans} Partner (₹${metrics.revenueInr.toLocaleString('en-IN')} INR / $${metrics.revenueUsd.toFixed(2)} USD).`,
      };
    },
  });

  const cards: AdminCopilotCard[] = [];

  if (
    parsed.intent === 'preview_client_invites' ||
    parsed.intent === 'preview_partner_invites'
  ) {
    const databaseType: CrmDatabaseType =
      parsed.intent === 'preview_partner_invites' ? 'partner' : 'client';
    const templateId = databaseType === 'partner' ? 'tpl_partner_invite' : 'tpl_client_invite';
    const templateName =
      databaseType === 'partner' ? 'xpo_partner_invite_v1' : 'xpo_client_invite_v1';

    const preview = await previewRoleDatabaseInvitations({
      databaseType,
      city: parsed.cityFilter || undefined,
      onlyUninvited: true,
    });

    cards.push({
      type: 'invitation_preview',
      databaseType,
      templateId,
      templateName,
      city: parsed.cityFilter || null,
      eligibleCount: preview.consentedEligibleCount,
      suppressedOrUnconsentedCount: preview.missingConsentCount + preview.suppressedCount,
      estimatedCostInr: preview.estimatedCostInr,
    });
  } else {
    cards.push({
      type: 'operations_snapshot',
      metrics,
    });
  }

  return {
    reply: parsed.reply,
    providerUsed,
    cards,
    suggestedPrompts: defaultPrompts,
  };
}
