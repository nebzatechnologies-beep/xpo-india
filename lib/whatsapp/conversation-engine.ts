import { requireFirestore, requireAdminAuth } from '@/lib/firebase/admin';
import {
  type AgentRequirementDraft,
  type CrmMissingOnboardingField,
  resolveMissingCrmOnboardingFields,
  runCustomerAgentTurn,
} from '@/lib/agent/customer-agent';
import { resolveTaxonomyFromNaturalLanguage } from '@/lib/agent/taxonomy-resolver';
import { resolveInstantCheckoutUrlForUser } from '@/lib/billing/entitlements';
import { normalizePhoneE164 } from '@/lib/crm/phone';
import { unlockPartnerForClient } from '@/lib/marketplace/candidate-unlocks';
import {
  requestMutualConnection,
  respondToMutualConnection,
} from '@/lib/marketplace/connections';
import { respondToLeadOffer } from '@/lib/marketplace/lead-distribution';
import { createServiceRequirement } from '@/lib/marketplace/requirements';
import { inferCrmDatabaseType, recordWhatsAppConsent } from '@/lib/services/crm';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { createSupportOrAbuseTicket } from '@/lib/services/support';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import {
  ensureAuthenticatedUser,
  getUserByPhone,
  getUserRoleProfiles,
  updateUserAndRoleProfile,
} from '@/lib/services/users';
import { getMaskedTrustProfile } from '@/lib/services/verification';
import { QuotaExceededError } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import { dispatchOutboundWhatsApp } from './notification-service';
import { getWhatsAppWorkflows } from './workflows';
import type {
  CrmContact,
  CustomerRole,
  LeadClaim,
  PartnerClassification,
  ServiceRequirement,
  WhatsAppInteractiveOption,
  WhatsAppLeadOffer,
  WhatsAppMessageRecord,
  WhatsAppSession,
  WorkflowStepDefinition,
} from '@/lib/types/domain';

export interface InboundWhatsAppEvent {
  waMessageId: string;
  fromPhoneRaw: string;
  profileName?: string;
  textBody?: string;
  buttonReplyId?: string;
  buttonReplyTitle?: string;
  mediaStoragePath?: string | null;
  referralSourceId?: string | null;
  referralHeadline?: string | null;
  isSimulated?: boolean;
  simulatedSessionId?: string;
}

const OPT_OUT_KEYWORDS = new Set(['stop', 'unsubscribe', 'optout', 'opt out']);
const OPT_IN_KEYWORDS = new Set(['start', 'resume', 'unpause', 'subscribe']);
const MENU_KEYWORDS = new Set(['menu', 'home', 'options']);
const GREETING_KEYWORDS = new Set(['hi', 'hello', 'hey']);
const SUPPORT_KEYWORDS = new Set(['support', 'help', 'human', 'coordinator']);

const MISSING_FIELD_PROMPTS: Record<CrmMissingOnboardingField, string> = {
  name: 'Please reply with your *Full Name*:',
  businessName: 'What is your *Business / Company Name*?',
  city: 'Which *City / Location* are you based in? (e.g., Bengaluru, Mumbai, Pune)',
  businessInfo:
    'Briefly share your *Business Type / Industry* (e.g., D2C Retail Brand, Auto OEM, Commercial Real Estate):',
  servicesOffered:
    'List the *Services, Products, or Categories* you offer separated by commas (e.g., CNC Machining, Sheet Metal, Web Development):',
};

async function getOrCreateWhatsAppUserUid(
  phoneE164: string,
  displayName: string,
  role: CustomerRole,
  isSimulated: boolean
): Promise<string> {
  const existing = await getUserByPhone(phoneE164);
  if (existing) return existing.uid;

  let uid = isSimulated ? `sim_usr_${phoneE164.replace(/\D/g, '')}` : '';

  if (!isSimulated) {
    try {
      const adminAuth = requireAdminAuth();
      try {
        const fbUser = await adminAuth.getUserByPhoneNumber(phoneE164);
        uid = fbUser.uid;
      } catch {
        const createdFb = await adminAuth.createUser({
          phoneNumber: phoneE164,
          displayName,
        });
        uid = createdFb.uid;
      }
    } catch {
      uid = `wa_usr_${phoneE164.replace(/\D/g, '')}`;
    }
  }

  const ensured = await ensureAuthenticatedUser({
    uid,
    phoneRaw: phoneE164,
    displayName,
    initialRole: role,
    isPhoneVerified: true,
  });

  return ensured.user.uid;
}

async function activateCrmOnboardingAccount(params: {
  session: WhatsAppSession;
  phoneE164: string;
  role: CustomerRole;
  collected: {
    name: string;
    businessName: string;
    city: string;
    businessInfo?: string;
    servicesOffered?: string[];
    categoryId?: string;
    subcategoryId?: string;
  };
  isSimulated: boolean;
}): Promise<string> {
  const uid = await getOrCreateWhatsAppUserUid(
    params.phoneE164,
    params.collected.name || 'XPO Member',
    params.role,
    params.isSimulated
  );

  const city = params.collected.city || 'India';
  const businessName = params.collected.businessName || params.collected.name || 'XPO Business';

  if (params.role === 'client') {
    await updateUserAndRoleProfile({
      uid,
      role: 'client',
      userUpdates: { displayName: params.collected.name || businessName, primaryCity: city },
      profileUpdates: {
        contactName: params.collected.name || businessName,
        businessName,
        businessInfo: params.collected.businessInfo || '',
        city,
        location: city,
      },
      businessUpdates: {
        companyName: businessName,
        city,
        businessInfo: params.collected.businessInfo || '',
      },
    });
  } else {
    const rawServices = params.collected.servicesOffered || [];
    const taxMatch = await resolveTaxonomyFromNaturalLanguage(
      `${rawServices.join(', ')} ${params.collected.businessInfo || ''}`
    );
    const chosenCatId = params.collected.categoryId || taxMatch.category.id;
    const chosenSubId = params.collected.subcategoryId || taxMatch.subcategory?.id;

    await updateUserAndRoleProfile({
      uid,
      role: 'partner',
      userUpdates: { displayName: params.collected.name || businessName, primaryCity: city },
      profileUpdates: {
        name: params.collected.name || businessName,
        businessName,
        partnerClassification: 'Agency' satisfies PartnerClassification,
        city,
        operatingRegions: [city],
        sectorIds: [taxMatch.sector.id],
        categoryIds: chosenCatId ? [chosenCatId] : [],
        subcategoryIds: chosenSubId ? [chosenSubId] : [],
        skillTagIds: taxMatch.skillTagIds,
        skillNames: rawServices.length > 0 ? rawServices : taxMatch.matchedSkillNames,
        servicesOffered: rawServices.length > 0 ? rawServices : [taxMatch.category.name],
        capabilities: rawServices.join(', ') || taxMatch.category.name,
        availability: 'available',
        notificationsPaused: false,
      },
      businessUpdates: {
        companyName: businessName,
        city,
      },
    });
  }

  const profs = await getUserRoleProfiles(uid);
  const settings = await getPlatformSettings();

  if (params.role === 'client') {
    const freeViews =
      profs.client?.freePartnerViewsRemaining ?? settings.subscriptions.clientFreePartnerViews;
    await dispatchOutboundWhatsApp({
      sessionId: params.session.id,
      phoneE164: params.phoneE164,
      isSimulated: params.isSimulated,
      messageType: 'interactive_buttons',
      headerText: 'Client Profile Activated',
      body:
        `Welcome to XPO, *${params.collected.name || businessName}* (*${businessName}*, ${city})!\n\n` +
        `• Posting requirements is *100% Free*\n` +
        `• Starter Free Partner Views: *${freeViews}*\n\n` +
        `Simply describe the product, service, or Partner you need right here in one message, or tap below:`,
      interactiveOptions: [
        { id: 'menu_client:new_req', title: 'Guided Form' },
        { id: 'menu_client:status', title: 'My Requirements' },
      ],
    });
  } else {
    const freeClaims =
      profs.partner?.freeClaimsRemaining ?? settings.subscriptions.partnerFreeClaims;
    await dispatchOutboundWhatsApp({
      sessionId: params.session.id,
      phoneE164: params.phoneE164,
      isSimulated: params.isSimulated,
      messageType: 'interactive_buttons',
      headerText: 'Partner Profile Activated',
      body:
        `Welcome to the XPO Partner Network, *${businessName}* (${city})!\n\n` +
        `• Services: *${(profs.partner?.servicesOffered || []).join(', ') || 'Configured'}*\n` +
        `• Starter Free Lead Applications: *${freeClaims}*\n\n` +
        `XPO will now send matching Client requirements here with a *5-minute priority response window*.`,
      interactiveOptions: [
        { id: 'menu_partner:quota', title: 'My Credits' },
        { id: 'menu_partner:edit', title: 'Edit Services' },
      ],
    });
  }

  return uid;
}

async function sendRoleSelectionMenu(
  session: WhatsAppSession,
  welcomeHeader?: string
): Promise<void> {
  const workflows = await getWhatsAppWorkflows();
  const settings = await getPlatformSettings();
  const options: WhatsAppInteractiveOption[] = [];

  if (settings.roles.clientEnabled) {
    options.push({
      id: 'select_role:client',
      title: 'Register as Client',
      description: 'Post requirements free & connect with verified Partners',
    });
  }
  if (settings.roles.partnerEnabled) {
    options.push({
      id: 'select_role:partner',
      title: 'Register as Partner',
      description: 'Receive matching Client leads with 5-minute response alerts',
    });
  }

  await dispatchOutboundWhatsApp({
    sessionId: session.id,
    phoneE164: session.phoneE164,
    isSimulated: session.isSimulated,
    messageType: 'interactive_list',
    headerText: welcomeHeader || 'Welcome to XPO',
    body: workflows.welcome.welcomeMessage,
    listButtonLabel: 'Choose Your Role',
    interactiveOptions: options,
  });
}

async function sendReturningUserMenu(
  session: WhatsAppSession,
  uid: string
): Promise<void> {
  const [profiles, settings] = await Promise.all([
    getUserRoleProfiles(uid),
    getPlatformSettings(),
  ]);
  const db = requireFirestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const rawRole = userSnap.data()?.role || userSnap.data()?.activeRole;
  const activeRole: CustomerRole = rawRole === 'partner' ? 'partner' : 'client';

  const cp = profiles.client;
  const pp = profiles.partner;

  const clientCreditsLabel =
    cp?.paidViewsUnlimited && cp?.activeSubscriptionId
      ? 'Unlimited Plan Active'
      : `Free views: ${cp?.freePartnerViewsRemaining ?? settings.subscriptions.clientFreePartnerViews} | Plan: ${cp?.paidPartnerViewsRemaining ?? 0}`;

  const partnerCreditsLabel =
    pp?.paidClaimsUnlimited && pp?.activeSubscriptionId
      ? 'Unlimited Plan Active'
      : `Free claims: ${pp?.freeClaimsRemaining ?? settings.subscriptions.partnerFreeClaims} | Plan: ${pp?.paidClaimsRemaining ?? 0}`;

  const roleMenuMap: Record<CustomerRole, WhatsAppInteractiveOption[]> = {
    client: [
      {
        id: 'menu_client:new_req',
        title: 'Post Requirement',
        description: '100% Free — Guided prompts (or just type what you need)',
      },
      {
        id: 'menu_client:partners',
        title: 'Interested Partners',
        description: `Review & unlock responded Partners (${clientCreditsLabel})`,
      },
      {
        id: 'menu_client:status',
        title: 'Requirement Status',
        description: 'Check live 5-minute matching status',
      },
      {
        id: 'menu_common:support',
        title: 'Talk to Support',
        description: 'Connect with an XPO coordinator',
      },
    ],
    partner: [
      {
        id: 'menu_partner:quota',
        title: 'Credits & Plan',
        description: partnerCreditsLabel,
      },
      {
        id: 'menu_partner:edit',
        title: 'Update Services',
        description: 'Update services, categories, expertise & locations',
      },
      {
        id: 'menu_partner:pause',
        title: 'Pause Lead Alerts',
        description: 'Temporarily pause 5-minute WhatsApp offers',
      },
      {
        id: 'menu_common:support',
        title: 'Talk to Support',
        description: 'Connect with an XPO coordinator',
      },
    ],
  };

  await dispatchOutboundWhatsApp({
    sessionId: session.id,
    phoneE164: session.phoneE164,
    isSimulated: session.isSimulated,
    messageType: 'interactive_list',
    headerText: `XPO ${activeRole === 'client' ? 'Client' : 'Partner'} Workspace`,
    body:
      activeRole === 'client'
        ? `Welcome back! Describe any requirement in plain English to match Partners automatically, or pick an action below:`
        : `Welcome back! Update your services in plain English anytime, or pick an action below:`,
    listButtonLabel: 'Workspace Menu',
    interactiveOptions: roleMenuMap[activeRole],
  });
}

async function promptWorkflowStep(
  session: WhatsAppSession,
  step: WorkflowStepDefinition
): Promise<void> {
  if (step.inputType === 'taxonomy_category') {
    const tree = await getFullTaxonomyTree({ includeInactive: false });
    const catOptions: WhatsAppInteractiveOption[] = tree.categories.slice(0, 10).map((cat) => {
      const sec = tree.sectors.find((s) => s.id === cat.sectorId);
      return {
        id: `tax_cat:${cat.id}`,
        title: cat.name.slice(0, 24),
        description: sec?.name.slice(0, 70),
      };
    });

    await dispatchOutboundWhatsApp({
      sessionId: session.id,
      phoneE164: session.phoneE164,
      isSimulated: session.isSimulated,
      messageType: 'interactive_list',
      body: step.promptText,
      listButtonLabel: 'Select Category',
      interactiveOptions: catOptions,
    });
    return;
  }

  if (step.inputType === 'buttons' && step.options?.length) {
    await dispatchOutboundWhatsApp({
      sessionId: session.id,
      phoneE164: session.phoneE164,
      isSimulated: session.isSimulated,
      messageType: 'interactive_buttons',
      body: step.promptText,
      interactiveOptions: step.options,
    });
    return;
  }

  if (step.inputType === 'list' && step.options?.length) {
    await dispatchOutboundWhatsApp({
      sessionId: session.id,
      phoneE164: session.phoneE164,
      isSimulated: session.isSimulated,
      messageType: 'interactive_list',
      body: step.promptText,
      listButtonLabel: 'Select Option',
      interactiveOptions: step.options,
    });
    return;
  }

  await dispatchOutboundWhatsApp({
    sessionId: session.id,
    phoneE164: session.phoneE164,
    isSimulated: session.isSimulated,
    messageType: 'text',
    body: step.promptText,
  });
}

async function sendSubscriptionUpgradePrompt(
  session: WhatsAppSession,
  role: CustomerRole,
  uid?: string | null
): Promise<void> {
  const settings = await getPlatformSettings();
  const isIndia = session.phoneE164.startsWith('+91');

  let checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription`;
  let priceLabel =
    role === 'partner'
      ? isIndia
        ? `₹${settings.subscriptions.partnerInrMonthlyPrice}/month`
        : `$${settings.subscriptions.partnerUsdMonthlyPrice}/month`
      : isIndia
        ? `₹${settings.subscriptions.clientInrMonthlyPrice}/month`
        : `$${settings.subscriptions.clientUsdMonthlyPrice}/month`;

  let allowanceLabel =
    role === 'partner'
      ? settings.subscriptions.partnerPlanUnlimited
        ? 'unlimited lead applications/month'
        : `${settings.subscriptions.partnerPaidMonthlyClaims} valid lead applications/month`
      : settings.subscriptions.clientPlanUnlimited
        ? 'unlimited Partner profile views/month'
        : `${settings.subscriptions.clientPaidMonthlyPartnerViews} Partner profile views/month`;

  if (uid) {
    const resolved = await resolveInstantCheckoutUrlForUser({ uid, role });
    checkoutUrl = resolved.checkoutUrl;
    priceLabel = resolved.priceLabel;
    allowanceLabel = resolved.allowanceLabel;
  }

  const planTitle = role === 'partner' ? 'XPO Partner Plan' : 'XPO Client Plan';

  await dispatchOutboundWhatsApp({
    sessionId: session.id,
    phoneE164: session.phoneE164,
    isSimulated: session.isSimulated,
    messageType: 'text',
    body:
      `⚡ *Free Starter Quota Completed*\n\n` +
      `Activate the *${planTitle}* (*${priceLabel}*) to unlock *${allowanceLabel}*.\n\n` +
      `Pay securely via ${isIndia ? 'Razorpay UPI / Card' : 'PayPal'}:\n${checkoutUrl}\n\n` +
      `_(Your allowance activates automatically as soon as payment verification completes.)_`,
  });
}

export async function processInboundWhatsAppMessage(
  event: InboundWhatsAppEvent
): Promise<{ session: WhatsAppSession; inboundRecord: WhatsAppMessageRecord }> {
  const db = requireFirestore();
  const isSimulated = Boolean(event.isSimulated);
  const norm = normalizePhoneE164(
    event.fromPhoneRaw.startsWith('+') ? event.fromPhoneRaw : `+${event.fromPhoneRaw}`
  );
  const phoneE164 = norm.isValid && norm.phoneE164 ? norm.phoneE164 : event.fromPhoneRaw;
  const sessionId =
    event.simulatedSessionId || (isSimulated ? `sim_${phoneE164}` : phoneE164);

  const nowIso = new Date().toISOString();
  const sessionRef = db.collection('whatsapp_sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  let existingUser = await getUserByPhone(phoneE164);
  const crmSnap = await db.collection('crm_contacts').doc(phoneE164).get();
  const crmContact = crmSnap.exists ? (crmSnap.data() as CrmContact) : null;

  let session: WhatsAppSession;
  if (!sessionSnap.exists) {
    session = {
      id: sessionId,
      phoneE164,
      uid: existingUser?.uid || null,
      crmContactId: crmSnap.exists ? phoneE164 : null,
      state: existingUser ? 'ACTIVE' : 'NEW_CONTACT',
      selectedRole: existingUser?.role || null,
      workflowStepKey: null,
      draftData: {},
      campaignSource: event.referralSourceId || null,
      referralHeadline: event.referralHeadline || null,
      isAccountOwnershipVerified: true,
      humanTakeover: false,
      unreadAdminCount: 0,
      lastInboundAt: nowIso,
      isSimulated,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await sessionRef.set(session);
  } else {
    session = {
      ...(sessionSnap.data() as WhatsAppSession),
      uid: (sessionSnap.data() as WhatsAppSession).uid || existingUser?.uid || null,
      selectedRole:
        existingUser?.role || (sessionSnap.data() as WhatsAppSession).selectedRole || null,
      lastInboundAt: nowIso,
      updatedAt: nowIso,
    };
    await sessionRef.set(
      {
        uid: session.uid,
        selectedRole: session.selectedRole,
        lastInboundAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  // Update CRM engagement & invitation response tracking
  if (crmSnap.exists && !isSimulated) {
    const crmPatch: Record<string, unknown> = { lastEngagedAt: nowIso, updatedAt: nowIso };
    if (!crmContact?.linkedUid && crmContact?.invitationStatus === 'invited') {
      crmPatch.invitationStatus = 'responded';
    }
    await crmSnap.ref.set(crmPatch, { merge: true });
  }

  const rawText = (event.textBody || event.buttonReplyTitle || '').trim();
  const lowerText = rawText.toLowerCase();
  const actionId = event.buttonReplyId || '';

  // Persist inbound message log
  const msgDocId = generateDocId(isSimulated ? 'wamsg_sim' : 'wamsg');
  const inboundRecord: WhatsAppMessageRecord = {
    id: msgDocId,
    waMessageId: event.waMessageId,
    sessionId,
    phoneE164,
    direction: 'inbound',
    messageType: event.mediaStoragePath ? 'document' : 'text',
    body: rawText || (event.mediaStoragePath ? '[Uploaded Document]' : ''),
    mediaStoragePath: event.mediaStoragePath || null,
    deliveryStatus: 'received',
    isSimulated,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await db.collection('whatsapp_messages').doc(msgDocId).set(inboundRecord);

  // 1. Global Opt-Out (`STOP` / `UNSUBSCRIBE`) — Highest Priority Compliance Rule
  if (OPT_OUT_KEYWORDS.has(lowerText)) {
    if (!isSimulated) {
      await recordWhatsAppConsent({
        phoneE164,
        uid: session.uid,
        newStatus: 'opted_out',
        channel: 'stop_keyword',
        evidenceNote: `Inbound WhatsApp keyword: "${rawText}"`,
      });
    }
    await sessionRef.set(
      { state: 'PAUSED', humanTakeover: false, updatedAt: nowIso },
      { merge: true }
    );
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      bypassSuppressionCheck: true,
      messageType: 'text',
      body: 'You have been unsubscribed from proactive XPO WhatsApp alerts. Reply *START* anytime to re-enable notifications.',
    });
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 2. Global Opt-In / Resume (`START` / `RESUME`)
  if (OPT_IN_KEYWORDS.has(lowerText)) {
    if (!isSimulated) {
      await recordWhatsAppConsent({
        phoneE164,
        uid: session.uid,
        newStatus: 'opted_in',
        channel: 'whatsapp_inbound',
        evidenceNote: `Inbound WhatsApp opt-in keyword: "${rawText}"`,
      });
    }
    if (session.uid) {
      await db
        .collection('role_profiles')
        .doc(`${session.uid}_partner`)
        .set({ notificationsPaused: false, updatedAt: nowIso }, { merge: true });
    }
    await sessionRef.set(
      { state: session.uid ? 'ACTIVE' : 'NEW_CONTACT', updatedAt: nowIso },
      { merge: true }
    );
    if (session.uid) {
      await sendReturningUserMenu(session, session.uid);
    } else {
      await sendRoleSelectionMenu(session);
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 3. Human Support Escalation (`SUPPORT` / `HELP` or `menu_common:support`)
  if (SUPPORT_KEYWORDS.has(lowerText) || actionId === 'menu_common:support') {
    await createSupportOrAbuseTicket({
      reporterUid: session.uid,
      reporterPhoneE164: phoneE164,
      type: 'whatsapp_support',
      subject: `WhatsApp Support Escalation (${phoneE164})`,
      description: `Customer requested live coordinator assistance. Last message: "${rawText}"`,
    });
    await sessionRef.set(
      {
        state: 'SUPPORT_REVIEW',
        humanTakeover: true,
        unreadAdminCount: (session.unreadAdminCount || 0) + 1,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body: 'An XPO Operations Coordinator has been notified and will reply in this thread shortly. Reply *MENU* anytime to return to automated self-service.',
    });
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // Respect Human Takeover unless user explicitly types `MENU`
  if (session.humanTakeover && !MENU_KEYWORDS.has(lowerText)) {
    await sessionRef.set(
      { unreadAdminCount: (session.unreadAdminCount || 0) + 1, updatedAt: nowIso },
      { merge: true }
    );
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 4. Record implicit WhatsApp inbound consent on first interaction
  if (session.state === 'NEW_CONTACT' && !isSimulated) {
    await recordWhatsAppConsent({
      phoneE164,
      uid: session.uid,
      newStatus: 'opted_in',
      channel: 'whatsapp_inbound',
      evidenceNote: 'Customer initiated WhatsApp conversation with XPO',
    });
  }

  // 5. Explicit `MENU` Keyword
  if (MENU_KEYWORDS.has(lowerText)) {
    await sessionRef.set(
      { humanTakeover: false, workflowStepKey: null, updatedAt: nowIso },
      { merge: true }
    );
    if (session.uid) {
      await sessionRef.set({ state: 'ACTIVE' }, { merge: true });
      await sendReturningUserMenu(session, session.uid);
    } else {
      await sessionRef.set({ state: 'CONSENT_PENDING' }, { merge: true });
      await sendRoleSelectionMenu(session);
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // =========================================================================
  // 6. Interactive Action Handlers (5-Min Offers, Partner Unlock, Connections)
  // =========================================================================

  // 6a. Partner responds to 5-Minute Business Opportunity Offer
  if (
    actionId.startsWith('offer_claim:') ||
    actionId.startsWith('offer_decline:') ||
    actionId.startsWith('offer_details:')
  ) {
    const [prefix, offerId] = actionId.split(':');
    const offerSnap = await db.collection('whatsapp_lead_offers').doc(offerId!).get();
    if (!offerSnap.exists) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: 'That opportunity alert could not be found.',
      });
      return { session, inboundRecord };
    }
    const offer = offerSnap.data() as WhatsAppLeadOffer;

    if (prefix === 'offer_details') {
      const reqSnap = await db.collection('requirements').doc(offer.reqId).get();
      const req = reqSnap.data() as ServiceRequirement | undefined;
      if (req) {
        const secsLeft = Math.max(
          0,
          Math.floor((new Date(offer.expiresAt).getTime() - Date.now()) / 1000)
        );
        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'interactive_buttons',
          headerText: `Details — ${req.xpoCode}`,
          body:
            `*${req.title}*\n` +
            `• *Category:* ${req.categoryName}\n` +
            `• *Specifications:* ${req.specifications.slice(0, 450)}\n` +
            `• *Location:* ${req.workLocation}\n` +
            `• *Timeline:* ${req.timeline}\n` +
            `• *Budget:* ${req.estimatedBudget || 'To be discussed'}\n` +
            `• *Time Left:* ${Math.floor(secsLeft / 60)}m ${secsLeft % 60}s`,
          interactiveOptions: [
            { id: `offer_claim:${offer.id}`, title: "I'm Interested" },
            { id: `offer_decline:${offer.id}`, title: 'Not Interested' },
          ],
        });
      }
      return { session, inboundRecord };
    }

    try {
      const result = await respondToLeadOffer({
        offerId: offer.id,
        partnerUid: offer.partnerUid,
        action: prefix === 'offer_claim' ? 'claim' : 'decline',
      });

      if (result.status === 'declined') {
        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body: `Noted! We have redirected *${offer.xpoCode}* to the next eligible Partner. *Zero* credits were deducted.`,
        });
      } else {
        await sessionRef.set(
          { state: 'OFFER_ACCEPTED', activeOfferId: null, updatedAt: nowIso },
          { merge: true }
        );
        const creditFooter = result.unlimitedClaims
          ? 'Plan Status: *Unlimited Partner Plan Active*'
          : `Remaining Applications — Free: *${result.remainingFreeClaims ?? 0}* | Plan: *${result.remainingPaidClaims ?? 0}*`;

        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body:
            `🎯 *Interest Submitted!* (${offer.xpoCode})\n\n` +
            `Your profile has been shortlisted for the Client. Once the Client unlocks your profile and requests a connection, you will receive a mutual consent prompt right here.\n\n` +
            creditFooter,
        });
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        await sessionRef.set({ state: 'PAYMENT_REQUIRED', updatedAt: nowIso }, { merge: true });
        await sendSubscriptionUpgradePrompt(session, 'partner', offer.partnerUid);
      } else {
        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body: err instanceof Error ? err.message : 'Unable to process offer response.',
        });
      }
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 6b. Client Unlocks Interested Partner Profile (`unlock_claim:{claimId}`)
  if (actionId.startsWith('unlock_claim:')) {
    const claimId = actionId.split(':')[1]!;
    if (!session.uid) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: 'Please verify your Client account first to view Partner profiles.',
      });
      return { session, inboundRecord };
    }

    try {
      const unlockRes = await unlockPartnerForClient({
        clientUid: session.uid,
        claimId,
        sourceChannel: 'whatsapp',
      });

      const creditsNote = unlockRes.unlimitedViews
        ? 'Unlimited Client Plan Active'
        : `Free Views Left: ${unlockRes.remainingFreeViews} | Plan Views Left: ${unlockRes.remainingPaidViews}`;

      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'interactive_buttons',
        headerText: `Unlocked — ${unlockRes.claim.partnerBusinessName}`,
        body:
          `🔓 *Partner Profile Unlocked* (${unlockRes.claim.xpoCode})\n\n` +
          `• *Partner:* ${unlockRes.claim.partnerBusinessName}\n` +
          `• *Location:* ${unlockRes.claim.partnerCity}\n` +
          `• *Verification:* ${unlockRes.claim.partnerVerificationStatus === 'verified' ? 'KYC Verified' : 'Phone Verified'}\n` +
          `${unlockRes.claim.capabilityNote ? `• *Capabilities:* ${unlockRes.claim.capabilityNote}\n` : ''}` +
          `${unlockRes.claim.partnerPortfolioUrl ? `• *Portfolio:* ${unlockRes.claim.partnerPortfolioUrl}\n` : ''}\n` +
          `_${unlockRes.alreadyUnlocked ? 'Previously unlocked (0 credits used)' : '1 Partner view credit applied'} • ${creditsNote}_`,
        interactiveOptions: [
          { id: `conn_req_service:${unlockRes.claim.id}`, title: 'Request Connection' },
          ...(unlockRes.claim.partnerUid
            ? [{ id: `view_trust:${unlockRes.claim.partnerUid}`, title: 'Trust Summary' }]
            : []),
        ],
      });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        await sessionRef.set({ state: 'PAYMENT_REQUIRED', updatedAt: nowIso }, { merge: true });
        await sendSubscriptionUpgradePrompt(session, 'client', session.uid);
      } else {
        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body: err instanceof Error ? err.message : 'Unable to unlock Partner profile.',
        });
      }
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 6c. View Masked Trust Summary on WhatsApp (`view_trust:{uid}`)
  if (actionId.startsWith('view_trust:')) {
    const targetUid = actionId.split(':')[1]!;
    const trust = await getMaskedTrustProfile(targetUid);
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body:
        `🛡 *XPO Verified Trust Summary*\n` +
        `• *Name / Business:* ${trust.partnerSummary?.businessName || trust.displayName}\n` +
        `• *Verification:* ${trust.verificationStatus === 'verified' ? '✅ KYC Verified' : '📱 Phone Verified'}\n` +
        `• *City:* ${trust.city}, ${trust.country}\n` +
        `• *Services & Skills:* ${(trust.partnerSummary?.servicesOffered || trust.partnerSummary?.skillNames || []).join(', ') || 'Verified Partner'}\n` +
        `• *Completed Mutual Connections:* ${trust.stats.mutualConnectionsCount}\n` +
        `_(Direct contact details remain private until mutual connection acceptance.)_`,
    });
    return { session, inboundRecord };
  }

  // 6d. Mutual Connection Requests & Consent Responses
  if (actionId.startsWith('conn_req_service:')) {
    const claimId = actionId.split(':')[1]!;
    if (!session.uid) return { session, inboundRecord };

    try {
      const conn = await requestMutualConnection({
        marketplaceType: 'service',
        claimOrApplicationId: claimId,
        initiatorUid: session.uid,
      });
      await sessionRef.set(
        { state: 'CONNECTION_PENDING', activeConnectionId: conn.id, updatedAt: nowIso },
        { merge: true }
      );
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: `Mutual connection request sent for *${conn.sourceCode}*! Direct phone and email details will be shared automatically once the Partner accepts.`,
      });
    } catch (err) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: err instanceof Error ? err.message : 'Could not send connection request.',
      });
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  if (actionId.startsWith('conn_accept:') || actionId.startsWith('conn_decline:')) {
    const isAccept = actionId.startsWith('conn_accept:');
    const connId = actionId.split(':')[1]!;
    if (!session.uid) return { session, inboundRecord };

    await respondToMutualConnection({
      connectionId: connId,
      recipientUid: session.uid,
      decision: isAccept ? 'accepted' : 'declined',
    });
    if (!isAccept) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: 'Connection request declined. Your direct contact details remain private.',
      });
    }
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 6e. Agentic Requirement Draft Confirmation on WhatsApp (`agent_confirm_req` / `agent_cancel_req`)
  if (actionId === 'agent_confirm_req' && session.uid) {
    const draft = (session.draftData?.agentDraftRequirement || null) as
      | Partial<AgentRequirementDraft>
      | null;
    if (draft) {
      const agentRes = await runCustomerAgentTurn({
        uid: session.uid,
        channel: 'whatsapp',
        action: { type: 'confirm_requirement', payload: draft as Record<string, unknown> },
        isSimulated,
      });
      await sessionRef.set(
        { state: 'MATCHING', draftData: {}, workflowStepKey: null, updatedAt: nowIso },
        { merge: true }
      );
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: agentRes.reply,
      });
      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }
  }

  if (actionId === 'agent_cancel_req') {
    await sessionRef.set({ draftData: {}, workflowStepKey: null, updatedAt: nowIso }, { merge: true });
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body: 'Draft cleared. Describe a new requirement anytime or type *MENU*.',
    });
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 6f. Returning User Menu Selections
  if (actionId === 'menu_partner:quota' && session.uid) {
    const profs = await getUserRoleProfiles(session.uid);
    const p = profs.partner;
    const isUnl = Boolean(p?.paidClaimsUnlimited && p?.activeSubscriptionId);
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body:
        `📊 *Your Partner Credits*\n` +
        `• Free Starter Applications Left: *${p?.freeClaimsRemaining ?? 0}*\n` +
        `• Monthly Plan Applications: *${isUnl ? 'Unlimited Active' : p?.paidClaimsRemaining ?? 0}*\n` +
        `• Total Claimed Opportunities: *${p?.totalValidClaims ?? 0}*\n` +
        `• Alert Status: *${p?.notificationsPaused ? 'Paused' : 'Active'}*`,
    });
    if (!isUnl && (p?.freeClaimsRemaining ?? 0) === 0 && (p?.paidClaimsRemaining ?? 0) === 0) {
      await sendSubscriptionUpgradePrompt(session, 'partner', session.uid);
    }
    return { session, inboundRecord };
  }

  if (actionId === 'menu_partner:pause' && session.uid) {
    await db
      .collection('role_profiles')
      .doc(`${session.uid}_partner`)
      .set({ notificationsPaused: true, updatedAt: nowIso }, { merge: true });
    await sessionRef.set({ state: 'PAUSED', updatedAt: nowIso }, { merge: true });
    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body: 'Lead alerts paused. Reply *START* anytime to resume receiving 5-minute business opportunities.',
    });
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  if (actionId === 'menu_client:partners' && session.uid) {
    const claimsSnap = await db
      .collection('lead_claims')
      .where('clientUid', '==', session.uid)
      .limit(5)
      .get();
    if (claimsSnap.empty) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: 'No Partners have responded yet. As soon as a matched Partner expresses interest within the 5-minute window, you will receive an alert here.',
      });
    } else {
      for (const d of claimsSnap.docs) {
        const clm = d.data() as LeadClaim;
        if (clm.unlockedByClient) {
          await dispatchOutboundWhatsApp({
            sessionId,
            phoneE164,
            isSimulated,
            messageType: 'interactive_buttons',
            body: `🔓 *${clm.partnerBusinessName}* (${clm.partnerCity}) — ${clm.xpoCode}\nStatus: *${clm.status.replace(/_/g, ' ')}*`,
            interactiveOptions: [
              { id: `conn_req_service:${clm.id}`, title: 'Request Connection' },
            ],
          });
        } else {
          await dispatchOutboundWhatsApp({
            sessionId,
            phoneE164,
            isSimulated,
            messageType: 'interactive_buttons',
            body: `🔒 *Verified Partner Interested* (${clm.partnerCity}) — ${clm.xpoCode}\nUnlock profile to reveal business name, capabilities & connect.`,
            interactiveOptions: [
              { id: `unlock_claim:${clm.id}`, title: 'Unlock Profile' },
            ],
          });
        }
      }
    }
    return { session, inboundRecord };
  }

  if (actionId === 'menu_client:status' && session.uid) {
    const reqsSnap = await db
      .collection('requirements')
      .where('clientUid', '==', session.uid)
      .limit(5)
      .get();
    if (reqsSnap.empty) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: 'You have not posted any requirements yet. Simply describe what you need in a message to get started (100% free)!',
      });
    } else {
      const lines = reqsSnap.docs.map((d) => {
        const r = d.data() as ServiceRequirement;
        return `• *${r.xpoCode}* — ${r.title}: ${r.interestedCount}/${r.targetInterestedCount} Partners responded (${r.distributionStatus.replace(/_/g, ' ')})`;
      });
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: `📋 *Your Recent Requirements*\n\n${lines.join('\n')}`,
      });
    }
    return { session, inboundRecord };
  }

  // =========================================================================
  // 7. Superadmin Step 5: CRM-Aware Automatic Registration Progression
  // =========================================================================

  // 7a. Handle active CRM missing-field collection step (`crm_missing:*`)
  if (session.workflowStepKey?.startsWith('crm_missing:') && session.selectedRole) {
    const currentField = session.workflowStepKey.replace(
      'crm_missing:',
      ''
    ) as CrmMissingOnboardingField;

    if (!rawText) {
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: MISSING_FIELD_PROMPTS[currentField],
      });
      return { session, inboundRecord };
    }

    const crmDraft = ((session.draftData?.crmOnboarding as Record<string, unknown>) || {});
    const remaining = Array.isArray(crmDraft.missingFields)
      ? (crmDraft.missingFields as CrmMissingOnboardingField[]).filter((f) => f !== currentField)
      : [];

    const collected = {
      ...((crmDraft.collected as Record<string, unknown>) || {}),
      [currentField]:
        currentField === 'servicesOffered'
          ? rawText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : rawText,
    };

    if (remaining.length > 0) {
      const nextField = remaining[0]!;
      await sessionRef.set(
        {
          workflowStepKey: `crm_missing:${nextField}`,
          draftData: {
            crmOnboarding: {
              collected,
              missingFields: remaining,
            },
          },
          updatedAt: nowIso,
        },
        { merge: true }
      );
      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: MISSING_FIELD_PROMPTS[nextField],
      });
      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }

    // All missing details collected -> Activate Profile!
    const activatedUid = await activateCrmOnboardingAccount({
      session,
      phoneE164,
      role: session.selectedRole,
      collected: {
        name: String(collected.name || event.profileName || 'XPO Member'),
        businessName: String(collected.businessName || collected.name || 'XPO Business'),
        city: String(collected.city || 'India'),
        businessInfo: String(collected.businessInfo || ''),
        servicesOffered: Array.isArray(collected.servicesOffered)
          ? (collected.servicesOffered as string[])
          : [],
        categoryId: String(collected.categoryId || ''),
        subcategoryId: String(collected.subcategoryId || ''),
      },
      isSimulated,
    });

    await sessionRef.set(
      {
        uid: activatedUid,
        state: 'ACTIVE',
        workflowStepKey: null,
        draftData: {},
        updatedAt: nowIso,
      },
      { merge: true }
    );
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 7b. Trigger CRM-Aware Registration when a new user selects role OR replies to an invitation!
  const explicitRegisterRole: CustomerRole | null =
    actionId === 'select_role:client' || /\bregister as client\b/i.test(rawText)
      ? 'client'
      : actionId === 'select_role:partner' || /\bregister as partner\b/i.test(rawText)
        ? 'partner'
        : !existingUser && crmContact
          ? inferCrmDatabaseType(crmContact)
          : null;

  if (!existingUser && explicitRegisterRole) {
    const { prefilled, missingFields } = resolveMissingCrmOnboardingFields({
      role: explicitRegisterRole,
      crmContact,
      existingUser: null,
    });

    const initialCollected = {
      ...prefilled,
      name: prefilled.name || (event.profileName && !event.profileName.startsWith('+') ? event.profileName : ''),
    };
    const finalMissing = initialCollected.name
      ? missingFields.filter((f) => f !== 'name')
      : missingFields;

    if (finalMissing.length === 0) {
      const activatedUid = await activateCrmOnboardingAccount({
        session,
        phoneE164,
        role: explicitRegisterRole,
        collected: initialCollected,
        isSimulated,
      });
      await sessionRef.set(
        {
          uid: activatedUid,
          selectedRole: explicitRegisterRole,
          state: 'ACTIVE',
          workflowStepKey: null,
          draftData: {},
          updatedAt: nowIso,
        },
        { merge: true }
      );
      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }

    const firstMissing = finalMissing[0]!;
    await sessionRef.set(
      {
        state: 'ONBOARDING',
        selectedRole: explicitRegisterRole,
        workflowStepKey: `crm_missing:${firstMissing}`,
        draftData: {
          crmOnboarding: {
            collected: initialCollected,
            missingFields: finalMissing,
          },
        },
        updatedAt: nowIso,
      },
      { merge: true }
    );

    const knownSummaryParts: string[] = [];
    if (initialCollected.businessName) knownSummaryParts.push(`Business: *${initialCollected.businessName}*`);
    if (initialCollected.city) knownSummaryParts.push(`Location: *${initialCollected.city}*`);
    if (initialCollected.servicesOffered.length > 0) {
      knownSummaryParts.push(`Services: *${initialCollected.servicesOffered.join(', ')}*`);
    }

    const greetingPrefix =
      knownSummaryParts.length > 0
        ? `Welcome to XPO${initialCollected.name ? `, *${initialCollected.name}*` : ''}! We pre-filled your ${explicitRegisterRole === 'client' ? 'Client' : 'Partner'} invitation details (${knownSummaryParts.join(' • ')}).\n\nJust ${finalMissing.length} quick detail(s) to activate your profile:\n`
        : `Welcome to XPO! Let’s activate your *${explicitRegisterRole === 'client' ? 'Client' : 'Partner'}* profile in ${finalMissing.length} quick step(s):\n\n`;

    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body: `${greetingPrefix}${MISSING_FIELD_PROMPTS[firstMissing]}`,
    });

    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // =========================================================================
  // 8. Guided Conversation Builder Workflow (Explicit Menu Trigger)
  // =========================================================================
  const workflows = await getWhatsAppWorkflows();
  const guidedFlowRoleMap: Record<string, CustomerRole> = {
    'menu_client:new_req': 'client',
    'menu_partner:edit': 'partner',
  };

  if (guidedFlowRoleMap[actionId]) {
    const chosenRole = guidedFlowRoleMap[actionId]!;
    const wf = workflows[chosenRole]!;
    const firstStep = wf.steps[0]!;
    const nextState = chosenRole === 'client' ? 'REQUIREMENT_DRAFT' : 'ONBOARDING';

    session = {
      ...session,
      state: nextState,
      selectedRole: chosenRole,
      workflowStepKey: firstStep.key,
      draftData: {},
      updatedAt: nowIso,
    };
    await sessionRef.set(
      {
        state: nextState,
        selectedRole: chosenRole,
        workflowStepKey: firstStep.key,
        draftData: {},
        updatedAt: nowIso,
      },
      { merge: true }
    );

    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164,
      isSimulated,
      messageType: 'text',
      body: wf.welcomeMessage,
    });
    await promptWorkflowStep(session, firstStep);
    return { session, inboundRecord };
  }

  // Active Step-by-Step Guided Workflow Progression
  if (session.selectedRole && session.workflowStepKey) {
    const wf = workflows[session.selectedRole];
    const stepIndex = wf ? wf.steps.findIndex((s) => s.key === session.workflowStepKey) : -1;

    if (wf && stepIndex >= 0) {
      const currentStep = wf.steps[stepIndex]!;
      let capturedValue: unknown = rawText;

      if (currentStep.inputType === 'taxonomy_category') {
        if (!actionId.startsWith('tax_cat:')) {
          await promptWorkflowStep(session, currentStep);
          return { session, inboundRecord };
        }
        capturedValue = actionId.replace('tax_cat:', '');
      } else if (currentStep.inputType === 'document_optional') {
        capturedValue = event.mediaStoragePath || null;
      } else if (actionId.startsWith('pt_')) {
        capturedValue = actionId.replace('pt_', '');
      } else if (currentStep.required && !rawText) {
        await promptWorkflowStep(session, currentStep);
        return { session, inboundRecord };
      }

      const nextDraft = {
        ...(session.draftData || {}),
        [currentStep.fieldToSave]: capturedValue,
      };

      const nextStep = wf.steps[stepIndex + 1];
      if (nextStep) {
        session = {
          ...session,
          draftData: nextDraft,
          workflowStepKey: nextStep.key,
          updatedAt: nowIso,
        };
        await sessionRef.set(
          {
            draftData: nextDraft,
            workflowStepKey: nextStep.key,
            updatedAt: nowIso,
          },
          { merge: true }
        );
        await promptWorkflowStep(session, nextStep);
        return { session, inboundRecord };
      }

      // Final Step Reached -> Commit Entity in Firestore!
      const role = session.selectedRole;
      const uid =
        session.uid ||
        (await getOrCreateWhatsAppUserUid(
          phoneE164,
          String(
            nextDraft.clientIdentity ||
              nextDraft.businessName ||
              event.profileName ||
              'XPO Member'
          )
            .split('-')[0]!
            .trim(),
          role,
          isSimulated
        ));

      if (role === 'client') {
        const identityParts = String(nextDraft.clientIdentity || '').split('-');
        const contactName = identityParts[0]?.trim() || event.profileName || 'Client';
        const businessName = identityParts[1]?.trim() || contactName;
        const workLocation = String(nextDraft.workLocation || 'India');

        await updateUserAndRoleProfile({
          uid,
          role: 'client',
          userUpdates: { displayName: contactName, primaryCity: workLocation },
          profileUpdates: {
            contactName,
            businessName,
            city: workLocation,
            location: workLocation,
          },
          businessUpdates: { companyName: businessName, city: workLocation },
        });

        const created = await createServiceRequirement({
          clientUid: uid,
          title: String(nextDraft.title || 'Business Service Requirement'),
          categoryId: String(nextDraft.categoryId || ''),
          specifications: String(nextDraft.specifications || ''),
          workLocation,
          timeline: String(nextDraft.timeline || 'Within 30 Days'),
          estimatedBudget: String(nextDraft.estimatedBudget || 'TBD'),
          sourceChannel: 'whatsapp',
          isSimulated,
        });

        const finalState =
          created.requirement.moderationStatus === 'approved' ? 'MATCHING' : 'REQUIREMENT_REVIEW';

        await sessionRef.set(
          {
            uid,
            state: finalState,
            workflowStepKey: null,
            draftData: {},
            updatedAt: nowIso,
          },
          { merge: true }
        );

        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body:
            created.requirement.moderationStatus === 'approved'
              ? `✅ *Requirement Published Free!* (${created.requirement.xpoCode})\n\nWe matched *${created.matchedCount}* qualified Partners and dispatched *${created.dispatchedOffersCount}* priority 5-minute alerts. You will be notified here as Partners respond!\n\nType *MENU* anytime.`
              : `📝 *Requirement Submitted for Review* (${created.requirement.xpoCode})\n\nOur moderation team is reviewing your requirement and will start 5-minute Partner distribution upon approval.`,
        });
      } else {
        const rawBiz = String(nextDraft.businessName || event.profileName || 'Service Partner');
        const parts = rawBiz.split('-');
        const personName = parts[0]?.trim() || rawBiz;
        const bizName = parts[1]?.trim() || rawBiz;
        const skills = String(nextDraft.skillsRaw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const regions = String(nextDraft.regionsRaw || 'India')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const catId = String(nextDraft.categoryId || '');
        const tree = await getFullTaxonomyTree({ includeInactive: true });
        const cat = tree.categories.find((c) => c.id === catId);

        await updateUserAndRoleProfile({
          uid,
          role: 'partner',
          userUpdates: { displayName: personName, primaryCity: regions[0] || 'India' },
          profileUpdates: {
            name: personName,
            businessName: bizName,
            partnerClassification:
              (nextDraft.partnerClassification as PartnerClassification) || 'Freelancer',
            city: regions[0] || 'India',
            operatingRegions: regions,
            sectorIds: cat ? [cat.sectorId] : [],
            categoryIds: catId ? [catId] : [],
            skillNames: skills,
            servicesOffered: skills,
            capabilities: skills.join(', '),
            availability: 'available',
            notificationsPaused: false,
          },
          businessUpdates: { companyName: bizName, city: regions[0] || 'India' },
        });

        await sessionRef.set(
          { uid, state: 'ACTIVE', workflowStepKey: null, draftData: {}, updatedAt: nowIso },
          { merge: true }
        );

        const profs = await getUserRoleProfiles(uid);
        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'text',
          body:
            `🎉 *Partner Profile Updated!*\n\n` +
            `• *Category:* ${cat?.name || 'Configured'}\n` +
            `• *Services:* ${skills.join(', ')}\n` +
            `• *Locations:* ${regions.join(', ')}\n` +
            `• *Free Starter Applications:* ${profs.partner?.freeClaimsRemaining ?? 5}\n\n` +
            `You will receive matched 5-minute business opportunity alerts directly on WhatsApp. Type *MENU* anytime.`,
        });
      }

      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }
  }

  // =========================================================================
  // 9. Hybrid Agentic Conversational Mode for Registered Clients & Partners
  // =========================================================================
  existingUser = session.uid ? existingUser || (await getUserByPhone(phoneE164)) : null;

  if (existingUser) {
    if (GREETING_KEYWORDS.has(lowerText)) {
      await sendReturningUserMenu(session, existingUser.uid);
      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }

    if (rawText) {
      const existingDraftReq = (session.draftData?.agentDraftRequirement || null) as
        | Partial<AgentRequirementDraft>
        | null;

      const agentRes = await runCustomerAgentTurn({
        uid: existingUser.uid,
        channel: 'whatsapp',
        message: rawText,
        draftRequirement: existingDraftReq,
        isSimulated,
      });

      const draftCard = agentRes.cards.find((c) => c.type === 'requirement_draft');
      if (draftCard && draftCard.type === 'requirement_draft') {
        await sessionRef.set(
          {
            state: 'REQUIREMENT_DRAFT',
            draftData: { agentDraftRequirement: draftCard.draft },
            updatedAt: nowIso,
          },
          { merge: true }
        );

        await dispatchOutboundWhatsApp({
          sessionId,
          phoneE164,
          isSimulated,
          messageType: 'interactive_buttons',
          headerText: 'Confirm XPO Requirement',
          body:
            `✨ *Requirement Structured by XPO Agent*\n\n` +
            `• *Title:* ${draftCard.draft.title}\n` +
            `• *Category:* ${draftCard.draft.categoryName}${draftCard.draft.subcategoryName ? ` › ${draftCard.draft.subcategoryName}` : ''}\n` +
            `• *Location:* ${draftCard.draft.workLocation}\n` +
            `• *Timeline:* ${draftCard.draft.timeline}\n` +
            `• *Budget:* ${draftCard.draft.estimatedBudget || 'To be discussed'}\n\n` +
            `Posting is *100% Free*. Confirm to notify matched Partners on WhatsApp?`,
          interactiveOptions: [
            { id: 'agent_confirm_req', title: 'Confirm & Post Free' },
            { id: 'agent_cancel_req', title: 'Cancel' },
          ],
        });
        return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
      }

      if (agentRes.cards.some((c) => c.type === 'requirement_posted')) {
        await sessionRef.set(
          { state: 'MATCHING', draftData: {}, updatedAt: nowIso },
          { merge: true }
        );
      }

      await dispatchOutboundWhatsApp({
        sessionId,
        phoneE164,
        isSimulated,
        messageType: 'text',
        body: agentRes.reply,
      });
      return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
    }

    await sendReturningUserMenu(session, existingUser.uid);
    return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
  }

  // 10. Unregistered New Contact (not in CRM) -> Present Client vs Partner Role Menu
  await sessionRef.set({ state: 'CONSENT_PENDING', updatedAt: nowIso }, { merge: true });
  await sendRoleSelectionMenu(session);

  return { session: (await sessionRef.get()).data() as WhatsAppSession, inboundRecord };
}
