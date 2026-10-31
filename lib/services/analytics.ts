import { requireFirestore } from '@/lib/firebase/admin';
import { inferCrmDatabaseType } from '@/lib/services/crm';
import type {
  ClientRoleProfile,
  CrmContact,
  LeadClaim,
  MutualConnection,
  PartnerRoleProfile,
  PaymentEventRecord,
  ServiceRequirement,
  SupportTicket,
  UserSubscription,
  WhatsAppCampaign,
  WhatsAppLeadOffer,
  WhatsAppMessageRecord,
  XpoUser,
} from '@/lib/types/domain';

export interface ExecutiveKpiDashboardData {
  overviewCounts: {
    totalUsers: number;
    clientsCount: number;
    partnersCount: number;
    crmContactsCount: number;
    clientDatabaseCount: number;
    clientOptedInCount: number;
    partnerDatabaseCount: number;
    partnerOptedInCount: number;
    clientInvitationsSent: number;
    partnerInvitationsSent: number;
    invitationRepliesCount: number;
    totalRequirements: number;
    activeRequirements: number;
    offersDispatchedCount: number;
    offersClaimedCount: number;
    offersExpiredCount: number;
    partnerProfilesUnlockedCount: number;
    acceptedConnectionsCount: number;
    activeSubscriptions: number;
    activeClientPlans: number;
    activePartnerPlans: number;
    revenueInrTotal: number;
    revenueUsdTotal: number;
    whatsappCostInrTotal: number;
  };
  commercialHealthKpis: {
    avgRequirementToMatchSeconds: number;
    firstRoundPartnerResponseRatePercent: number;
    avgTimeToThreeInterestedMinutes: number;
    offerExpiryRatePercent: number;
    mutualConnectionAcceptanceRatePercent: number;
    freeToPaidPartnerConversionPercent: number;
    freeToPaidClientConversionPercent: number;
    monthlySubscriptionRetentionPercent: number;
    whatsappDeliverySuccessPercent: number;
    optOutSuppressionRatePercent: number;
    verifiedProfilePercent: number;
    abuseSpamIncidentRatePercent: number;
  };
  recentRequirements: ServiceRequirement[];
  recentPayments: PaymentEventRecord[];
}

function pct(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export async function getExecutiveDashboardAnalytics(): Promise<ExecutiveKpiDashboardData> {
  const db = requireFirestore();

  const [
    usersSnap,
    profilesSnap,
    crmSnap,
    campaignsSnap,
    reqsSnap,
    offersSnap,
    claimsSnap,
    unlocksSnap,
    connsSnap,
    subsSnap,
    paySnap,
    waMsgSnap,
    ticketsSnap,
  ] = await Promise.all([
    db.collection('users').get(),
    db.collection('role_profiles').get(),
    db.collection('crm_contacts').get(),
    db.collection('whatsapp_campaigns').get(),
    db.collection('requirements').get(),
    db.collection('whatsapp_lead_offers').get(),
    db.collection('lead_claims').get(),
    db.collection('client_candidate_unlocks').get(),
    db.collection('connections').get(),
    db.collection('subscriptions').get(),
    db.collection('payment_events').get(),
    db.collection('whatsapp_messages').limit(1000).get(),
    db.collection('support_tickets').get(),
  ]);

  // Exclude simulated test records from production commercial KPIs
  const users = usersSnap.docs
    .map((d) => d.data() as XpoUser)
    .filter((u) => !u.uid.startsWith('sim_usr_') && u.status !== 'deleted');

  const profiles = profilesSnap.docs
    .map((d) => d.data() as PartnerRoleProfile | ClientRoleProfile | { uid: string; role: string })
    .filter((p) => !p.uid.startsWith('sim_usr_'));

  const crmContacts = crmSnap.docs.map((d) => d.data() as CrmContact);
  const campaigns = campaignsSnap.docs.map((d) => d.data() as WhatsAppCampaign);
  const reqs = reqsSnap.docs
    .map((d) => d.data() as ServiceRequirement)
    .filter((r) => !r.isSimulated);
  const offers = offersSnap.docs
    .map((d) => d.data() as WhatsAppLeadOffer)
    .filter((o) => !o.isSimulated);
  const claims = claimsSnap.docs
    .map((d) => d.data() as LeadClaim)
    .filter((c) => !c.isSimulated);
  const conns = connsSnap.docs
    .map((d) => d.data() as MutualConnection)
    .filter((c) => !c.isSimulated);
  const subs = subsSnap.docs.map((d) => d.data() as UserSubscription);
  const payments = paySnap.docs.map((d) => d.data() as PaymentEventRecord);
  const waMsgs = waMsgSnap.docs
    .map((d) => d.data() as WhatsAppMessageRecord)
    .filter((m) => !m.isSimulated);
  const tickets = ticketsSnap.docs.map((d) => d.data() as SupportTicket);

  const clients = profiles.filter((p) => p.role === 'client') as ClientRoleProfile[];
  const partners = profiles.filter((p) => p.role === 'partner') as PartnerRoleProfile[];

  let clientDatabaseCount = 0;
  let clientOptedInCount = 0;
  let partnerDatabaseCount = 0;
  let partnerOptedInCount = 0;
  let invitationRepliesCount = 0;

  for (const c of crmContacts) {
    const isClient = c.databaseTypes?.includes('client') || c.databaseType === 'client';
    const isPartner = c.databaseTypes?.includes('partner') || c.databaseType === 'partner';
    if (c.invitationStatus === 'responded' || c.invitationStatus === 'registered') {
      invitationRepliesCount++;
    }
    if (isPartner) {
      partnerDatabaseCount++;
      if (c.consentStatus === 'opted_in') partnerOptedInCount++;
    }
    if (isClient) {
      clientDatabaseCount++;
      if (c.consentStatus === 'opted_in') clientOptedInCount++;
    }
  }

  let clientInvitationsSent = 0;
  let partnerInvitationsSent = 0;
  for (const cmp of campaigns) {
    if (cmp.databaseType === 'partner' || cmp.templateId === 'tpl_partner_invite') {
      partnerInvitationsSent += cmp.sentCount || 0;
    } else {
      clientInvitationsSent += cmp.sentCount || 0;
    }
  }

  // Match speed (created -> first Round 1 offer dispatched)
  const firstOfferByReq = new Map<string, number>();
  for (const o of offers) {
    const t = new Date(o.dispatchedAt).getTime();
    const cur = firstOfferByReq.get(o.reqId);
    if (!cur || t < cur) firstOfferByReq.set(o.reqId, t);
  }
  const matchDiffsSec: number[] = [];
  for (const r of reqs) {
    const firstT = firstOfferByReq.get(r.id);
    if (firstT) {
      const startT = new Date(r.approvedAt || r.createdAt).getTime();
      matchDiffsSec.push(Math.max(1, (firstT - startT) / 1000));
    }
  }
  const avgRequirementToMatchSeconds =
    matchDiffsSec.length > 0
      ? Math.round(matchDiffsSec.reduce((a, b) => a + b, 0) / matchDiffsSec.length)
      : 0;

  // First-round Partner response rate
  const round1Offers = offers.filter((o) => o.round === 1);
  const round1Responded = round1Offers.filter(
    (o) => o.status === 'claimed' || o.status === 'declined'
  ).length;
  const firstRoundPartnerResponseRatePercent = pct(round1Responded, round1Offers.length);

  // Avg time to target interested Partners (minutes)
  const claimsByReq = new Map<string, number[]>();
  for (const c of claims) {
    const arr = claimsByReq.get(c.reqId) || [];
    arr.push(new Date(c.claimedAt).getTime());
    claimsByReq.set(c.reqId, arr);
  }
  const targetMins: number[] = [];
  for (const r of reqs) {
    const cTimes = (claimsByReq.get(r.id) || []).sort((a, b) => a - b);
    if (cTimes.length >= r.targetInterestedCount) {
      const thirdT = cTimes[r.targetInterestedCount - 1]!;
      const startT = new Date(r.approvedAt || r.createdAt).getTime();
      targetMins.push(Math.max(0.5, (thirdT - startT) / 60000));
    }
  }
  const avgTimeToThreeInterestedMinutes =
    targetMins.length > 0
      ? Number((targetMins.reduce((a, b) => a + b, 0) / targetMins.length).toFixed(1))
      : 0;

  // Offer expiry & claim counts
  const offersClaimedCount = offers.filter((o) => o.status === 'claimed').length;
  const expiredOffersCount = offers.filter((o) => o.status === 'expired').length;
  const offerExpiryRatePercent = pct(expiredOffersCount, offers.length);

  // Mutual connection acceptance rate
  const decidedConns = conns.filter((c) => c.status === 'accepted' || c.status === 'declined');
  const acceptedConns = conns.filter((c) => c.status === 'accepted').length;
  const mutualConnectionAcceptanceRatePercent = pct(acceptedConns, decidedConns.length);

  // Two-Sided Free-to-Paid Conversion Rates (Partner Plan & Client Plan)
  const activePartnerSubs = subs.filter((s) => s.role === 'partner' && s.status === 'active');
  const activeClientSubs = subs.filter((s) => s.role === 'client' && s.status === 'active');
  const paidPartnerUids = new Set(activePartnerSubs.map((s) => s.uid));
  const paidClientUids = new Set(activeClientSubs.map((s) => s.uid));
  const freeToPaidPartnerConversionPercent = pct(paidPartnerUids.size, partners.length);
  const freeToPaidClientConversionPercent = pct(paidClientUids.size, clients.length);

  // Subscription retention
  const everActivatedSubs = subs.filter((s) => s.status !== 'pending_mandate');
  const retainedActiveSubs = subs.filter((s) => s.status === 'active').length;
  const monthlySubscriptionRetentionPercent = pct(retainedActiveSubs, everActivatedSubs.length);

  // WhatsApp delivery & opt-out
  const outboundMsgs = waMsgs.filter((m) => m.direction === 'outbound');
  const deliveredOrSentMsgs = outboundMsgs.filter((m) => m.deliveryStatus !== 'failed').length;
  const whatsappDeliverySuccessPercent = pct(deliveredOrSentMsgs, outboundMsgs.length);

  const optedOutCrm = crmContacts.filter(
    (c) => c.consentStatus === 'opted_out' || c.crmState === 'opted_out_contact'
  ).length;
  const optOutSuppressionRatePercent = pct(optedOutCrm, crmContacts.length);

  const verifiedUsers = users.filter((u) => u.verificationStatus === 'verified').length;
  const verifiedProfilePercent = pct(verifiedUsers, users.length);

  const abuseTickets = tickets.filter((t) =>
    [
      'fake_requirement',
      'fraudulent_profile',
      'spam',
      'unauthorized_contact_sharing',
    ].includes(t.type)
  ).length;
  const totalMarketplaceItems = Math.max(1, reqs.length);
  const abuseSpamIncidentRatePercent = pct(abuseTickets, totalMarketplaceItems);

  const capturedPayments = payments.filter((p) => p.status === 'captured');
  const revenueInrTotal = capturedPayments
    .filter((p) => p.currency === 'INR')
    .reduce((acc, p) => acc + p.amount, 0);
  const revenueUsdTotal = Number(
    capturedPayments
      .filter((p) => p.currency === 'USD')
      .reduce((acc, p) => acc + p.amount, 0)
      .toFixed(2)
  );
  const whatsappCostInrTotal = Number(
    outboundMsgs.reduce((acc, m) => acc + (m.estimatedCostInr || 0), 0).toFixed(2)
  );

  return {
    overviewCounts: {
      totalUsers: users.length,
      clientsCount: clients.length,
      partnersCount: partners.length,
      crmContactsCount: crmContacts.length,
      clientDatabaseCount,
      clientOptedInCount,
      partnerDatabaseCount,
      partnerOptedInCount,
      clientInvitationsSent,
      partnerInvitationsSent,
      invitationRepliesCount,
      totalRequirements: reqs.length,
      activeRequirements: reqs.filter(
        (r) => r.distributionStatus === 'distributing' || r.distributionStatus === 'queued'
      ).length,
      offersDispatchedCount: offers.length,
      offersClaimedCount,
      offersExpiredCount: expiredOffersCount,
      partnerProfilesUnlockedCount: unlocksSnap.size,
      acceptedConnectionsCount: acceptedConns,
      activeSubscriptions: retainedActiveSubs,
      activeClientPlans: activeClientSubs.length,
      activePartnerPlans: activePartnerSubs.length,
      revenueInrTotal,
      revenueUsdTotal,
      whatsappCostInrTotal,
    },
    commercialHealthKpis: {
      avgRequirementToMatchSeconds,
      firstRoundPartnerResponseRatePercent,
      avgTimeToThreeInterestedMinutes,
      offerExpiryRatePercent,
      mutualConnectionAcceptanceRatePercent,
      freeToPaidPartnerConversionPercent,
      freeToPaidClientConversionPercent,
      monthlySubscriptionRetentionPercent,
      whatsappDeliverySuccessPercent,
      optOutSuppressionRatePercent,
      verifiedProfilePercent,
      abuseSpamIncidentRatePercent,
    },
    recentRequirements: [...reqs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10),
    recentPayments: [...payments]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 10),
  };
}
