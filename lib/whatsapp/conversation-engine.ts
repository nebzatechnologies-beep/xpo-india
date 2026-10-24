// ============================================================================
// XPO — Automated Stateful WhatsApp Conversation Engine (Modules 3, 4, 5)
// ============================================================================

import { getMockStore } from '@/lib/data/mock-db';
import { normalizePhoneE164 } from './phone';
import { dispatchWhatsAppMessage, getWhatsAppConfig } from './provider';
import {
  InteractiveOption,
  OnboardingQuestionStep,
  WhatsAppConversationSession,
  WhatsAppJourneyRole,
  WhatsAppMessageRecord,
} from './types';

export const JOURNEY_MENU_OPTIONS: InteractiveOption[] = [
  { id: 'journey_partner', title: 'Find Clients', description: 'Freelancers, manufacturers, suppliers & agencies' },
  { id: 'journey_client', title: 'Find Service Providers', description: 'Post a B2B requirement or sourcing need' },
  { id: 'journey_employer', title: 'Hire Employees', description: 'Post job vacancies & hire verified talent' },
  { id: 'journey_job_seeker', title: 'Find a Job', description: 'Discover job openings matching your skills' },
];

export const ROLE_ONBOARDING_STEPS: Record<WhatsAppJourneyRole, OnboardingQuestionStep[]> = {
  // Module 5A: Client — Find Service Providers
  client: [
    { key: 'contactName', label: 'Contact Name', prompt: '1/9 • Please share your *Full Name*:' },
    { key: 'businessName', label: 'Business Name', prompt: '2/9 • What is your *Business / Company Name*?' },
    { key: 'city', label: 'City & Service Location', prompt: '3/9 • Which *City & Service Location* is this requirement for?' },
    { key: 'industry', label: 'Industry', prompt: '4/9 • What *Industry / Sector* does your business operate in? (e.g., Manufacturing, Technology, Design, Construction)' },
    { key: 'categorySubcategory', label: 'Category & Subcategory', prompt: '5/9 • Specify the *Requirement Category & Subcategory* (e.g., Metal Fabrication → CNC Machining, or Software → Web Development):' },
    { key: 'requirementTitle', label: 'Requirement Title', prompt: '6/9 • Give a clear *Title* for your requirement:' },
    { key: 'description', label: 'Description & Specifications', prompt: '7/9 • Please describe your *Specifications, Quantity, or Scope of Work*:' },
    { key: 'budget', label: 'Optional Budget', prompt: '8/9 • What is your estimated *Budget*? (or reply *SKIP* if flexible)', optional: true },
    { key: 'timeline', label: 'Required Timeline', prompt: '9/9 • What is your *Required Timeline / Delivery Urgency*? (e.g., Immediate, Within 15 days, 30 days)' },
  ],

  // Module 5B: Partner — Find Clients
  partner: [
    { key: 'contactName', label: 'Name', prompt: '1/10 • Please share your *Full Name*:' },
    { key: 'businessName', label: 'Business Name', prompt: '2/10 • What is your *Business / Agency / Company Name*? (or reply *INDIVIDUAL* if solo)', optional: true },
    {
      key: 'partnerType',
      label: 'Partner Type',
      prompt: '3/10 • Select your *Partner Type* (Freelancer, Manufacturer, Supplier, Consultant, or Agency):',
    },
    { key: 'city', label: 'City & Service Locations', prompt: '4/10 • Which *City & Service Locations* do you serve?' },
    { key: 'sector', label: 'Sector', prompt: '5/10 • Which primary *Sector* do you operate in? (e.g., Manufacturing, Technology, Design, Logistics)' },
    { key: 'categorySubcategory', label: 'Category & Subcategory', prompt: '6/10 • What is your *Category & Subcategory* specialization?' },
    { key: 'skills', label: 'Skills & Capabilities', prompt: '7/10 • List your core *Skills, Capabilities, or Machinery* (comma-separated):' },
    { key: 'website', label: 'Website or Portfolio', prompt: '8/10 • Share your *Website or Portfolio link* (or reply *SKIP*):', optional: true },
    { key: 'opportunityTypes', label: 'Preferred Opportunity Types', prompt: '9/10 • What *Preferred Opportunity Types* are you seeking? (e.g., Turnkey Contracts, Retainers, Bulk Orders)' },
    { key: 'availability', label: 'Availability', prompt: '10/10 • What is your current *Availability* to take on new Client leads? (e.g., Immediate, Next Week)' },
  ],

  // Module 5C: Employer — Hire Employees
  employer: [
    { key: 'contactName', label: 'Employer Contact Name', prompt: '1/10 • Please share your *Full Name (Hiring Contact)*:' },
    { key: 'companyName', label: 'Company Name', prompt: '2/10 • What is your *Company Name*?' },
    { key: 'industry', label: 'Industry', prompt: '3/10 • Which *Industry* is your company in?' },
    { key: 'location', label: 'Hiring Location', prompt: '4/10 • What is the *Hiring City / Work Location*?' },
    { key: 'jobTitle', label: 'Job Title', prompt: '5/10 • What is the *Job Title / Role* you are hiring for?' },
    { key: 'skills', label: 'Required Skills', prompt: '6/10 • List the *Required Skills* for this role:' },
    { key: 'experience', label: 'Experience Required', prompt: '7/10 • What *Experience Range* is required? (e.g., 2–5 years, Fresher)' },
    { key: 'salaryRange', label: 'Salary Range', prompt: '8/10 • What is the *Annual / Monthly Salary Range* offered?' },
    { key: 'vacancies', label: 'Number of Vacancies', prompt: '9/10 • How many *Vacancies / Positions* are open?' },
    { key: 'employmentType', label: 'Employment Type', prompt: '10/10 • What is the *Employment Type*? (Full-Time, Contract, Remote, or On-Site)' },
  ],

  // Module 5D: Job Seeker — Find Jobs
  job_seeker: [
    { key: 'contactName', label: 'Name', prompt: '1/9 • Please share your *Full Name*:' },
    { key: 'city', label: 'City', prompt: '2/9 • Which *City* are you currently based in?' },
    { key: 'qualifications', label: 'Qualifications', prompt: '3/9 • What is your highest *Qualification / Degree*?' },
    { key: 'skills', label: 'Skills', prompt: '4/9 • List your top *Technical or Professional Skills*:' },
    { key: 'experience', label: 'Experience', prompt: '5/9 • How many years of *Work Experience* do you have?' },
    { key: 'preferredRole', label: 'Preferred Job Role', prompt: '6/9 • What is your *Preferred Job Role / Designation*?' },
    { key: 'expectedSalary', label: 'Expected Salary', prompt: '7/9 • What is your *Expected Salary (CTC)*?' },
    { key: 'availability', label: 'Availability / Notice Period', prompt: '8/9 • What is your *Availability / Notice Period*? (e.g., Immediate, 15 Days, 30 Days)' },
    { key: 'cvResume', label: 'CV / Resume', prompt: '9/9 • Paste a link to your *CV / Resume / LinkedIn* (or reply *SKIP* to upload later):', optional: true },
  ],
};

const ROLE_LABELS: Record<WhatsAppJourneyRole, string> = {
  partner: 'Find Clients (Partner)',
  client: 'Find Service Providers (Client)',
  employer: 'Hire Employees (Employer)',
  job_seeker: 'Find Jobs (Job Seeker)',
};

function getSessionStore(): WhatsAppConversationSession[] {
  const store = getMockStore() as any;
  if (!store.whatsappSessions) {
    store.whatsappSessions = [];
  }
  return store.whatsappSessions;
}

export function detectJourneyFromCampaignOrText(
  text: string,
  campaignSource?: string
): WhatsAppJourneyRole | null {
  const combined = `${campaignSource || ''} ${text || ''}`.toLowerCase().trim();

  if (
    text.trim() === '1' ||
    combined.includes('journey_partner') ||
    combined.includes('find client') ||
    combined.includes('find_clients') ||
    combined.includes('get leads')
  ) {
    return 'partner';
  }
  if (
    text.trim() === '2' ||
    combined.includes('journey_client') ||
    combined.includes('find service provider') ||
    combined.includes('find_providers') ||
    combined.includes('post requirement')
  ) {
    return 'client';
  }
  if (
    text.trim() === '3' ||
    combined.includes('journey_employer') ||
    combined.includes('hire employee') ||
    combined.includes('hire_employees') ||
    combined.includes('post job')
  ) {
    return 'employer';
  }
  if (
    text.trim() === '4' ||
    combined.includes('journey_job_seeker') ||
    combined.includes('find a job') ||
    combined.includes('find job') ||
    combined.includes('find_jobs')
  ) {
    return 'job_seeker';
  }
  return null;
}

export function getOrCreateWhatsAppSession(
  rawPhone: string,
  campaignSource = 'direct'
): WhatsAppConversationSession {
  const norm = normalizePhoneE164(rawPhone);
  const phone = norm.valid ? norm.e164 : rawPhone.trim();
  const sessions = getSessionStore();
  const store = getMockStore();

  let session = sessions.find((s) => s.phone === phone);
  if (!session) {
    // Match existing CRM contact by normalized E.164 phone (Note: never treated as proof of identity!)
    const matchedCrm = store.crmContacts.find((c: any) => {
      const cNorm = normalizePhoneE164(c.whatsapp || c.phone, c.country);
      return cNorm.valid && cNorm.e164 === phone;
    });

    session = {
      id: 'wasess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      phone,
      contactName: matchedCrm?.name || 'WhatsApp User',
      company: matchedCrm?.company || 'Unregistered Prospect',
      crmContactId: matchedCrm?.id || null,
      linkedUserId: null,
      isVerifiedAccount: false, // Explicit verification required per Module 4
      role: null,
      campaignSource,
      currentState: 'IDLE',
      currentStepIndex: 0,
      completedQuestions: [],
      savedResponses: {},
      incompleteRegistration: true,
      pendingDraft: null,
      activeLeadOffers: [],
      notificationPreferences: {
        paused: false,
        optedOut: matchedCrm?.consentStatus === 'opted_out',
        marketingOptIn: matchedCrm?.consentStatus === 'opted_in',
        transactionalOptIn: true,
      },
      subscriptionEntitlement: 'free',
      processedWebhookIds: [],
      lastActivityAt: new Date().toISOString(),
    };
    sessions.unshift(session);
  } else if (campaignSource && campaignSource !== 'direct' && session.campaignSource === 'direct') {
    session.campaignSource = campaignSource;
  }

  return session;
}

function syncToInboxThread(
  session: WhatsAppConversationSession,
  sender: 'inbound' | 'outbound',
  text: string,
  status: WhatsAppMessageRecord['status'],
  interactiveOptions?: InteractiveOption[],
  metaMessageId?: string
): WhatsAppMessageRecord {
  const store = getMockStore();
  let conv = store.whatsappConversations.find(
    (c: any) => normalizePhoneE164(c.whatsapp).e164 === session.phone || c.whatsapp === session.phone
  );

  if (!conv) {
    conv = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      contactName: session.savedResponses.contactName || session.contactName || session.phone,
      company:
        session.savedResponses.businessName ||
        session.savedResponses.companyName ||
        session.company ||
        'WhatsApp Prospect',
      whatsapp: session.phone,
      industry:
        session.savedResponses.industry ||
        session.savedResponses.sector ||
        (session.role ? ROLE_LABELS[session.role] : 'WhatsApp Inbound'),
      unreadCount: sender === 'inbound' ? 1 : 0,
      lastMessage: text,
      lastMessageTime: 'Just now',
      messages: [],
    };
    store.whatsappConversations.unshift(conv);
  } else {
    if (session.savedResponses.contactName) conv.contactName = session.savedResponses.contactName;
    if (session.savedResponses.businessName || session.savedResponses.companyName) {
      conv.company = session.savedResponses.businessName || session.savedResponses.companyName;
    }
    conv.lastMessage = text;
    conv.lastMessageTime = 'Just now';
  }

  const cfg = getWhatsAppConfig();
  const msgRecord: WhatsAppMessageRecord = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    conversationId: conv.id,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
    status,
    providerMode: cfg.mode,
    interactiveOptions,
    metaMessageId,
  };

  conv.messages.push(msgRecord as any);
  return msgRecord;
}

function buildSummaryText(role: WhatsAppJourneyRole, responses: Record<string, string>): string {
  const steps = ROLE_ONBOARDING_STEPS[role];
  const lines = steps.map((s) => `• *${s.label}:* ${responses[s.key] || 'Not specified'}`);
  return (
    `*XPO ${ROLE_LABELS[role]} — Summary*\n\n` +
    lines.join('\n') +
    `\n\nReply *CONFIRM* to submit, or *EDIT* to restart/update your details.`
  );
}

function finalizeOnboardingSubmission(session: WhatsAppConversationSession): string {
  const store = getMockStore();
  const r = session.savedResponses;
  session.incompleteRegistration = false;
  session.currentState = 'COMPLETED';

  // Ensure CRM record exists or is enriched
  let crm = store.crmContacts.find(
    (c: any) => normalizePhoneE164(c.whatsapp || c.phone).e164 === session.phone
  );
  if (!crm) {
    crm = {
      id: 'crm_' + Date.now(),
      name: r.contactName || session.contactName,
      company: r.businessName || r.companyName || 'Individual',
      phone: session.phone,
      whatsapp: session.phone,
      email: '',
      website: r.website || '',
      country: session.phone.startsWith('+91') ? 'India' : 'International',
      city: r.city || r.location || '',
      industry: r.industry || r.sector || 'General',
      sectorCode: 'MFG',
      source: `whatsapp_${session.campaignSource}`,
      status: 'registered_user',
      consentStatus: 'opted_in',
      campaignHistoryCount: 1,
      createdAt: new Date().toISOString(),
    };
    store.crmContacts.unshift(crm as any);
    session.crmContactId = crm.id;
  }

  if (session.role === 'client') {
    const newLeadId = 'lead_wa_' + Date.now();
    store.leads.unshift({
      id: newLeadId,
      leadCode: 'XPO-WA-' + Math.floor(1000 + Math.random() * 9000),
      title: r.requirementTitle || 'WhatsApp B2B Requirement',
      description: r.description || '',
      leadType: 'Buy',
      sectorCode: 'MFG',
      sectorName: r.industry || 'General',
      categoryName: r.categorySubcategory || 'General Services',
      subcategoryName: r.categorySubcategory || 'Sourcing',
      creatorId: session.linkedUserId || session.id,
      creatorName: r.contactName || 'WhatsApp Client',
      creatorCompany: r.businessName || 'Client Business',
      location: {
        city: r.city || 'Mumbai',
        state: 'India',
        country: 'India',
      },
      budget: {
        min: 50000,
        max: 250000,
        currency: 'INR',
        display: r.budget && r.budget.toUpperCase() !== 'SKIP' ? r.budget : 'Flexible / On Quote',
      },
      urgency: r.timeline || 'Within 15 Days',
      status: 'approved',
      verificationStatus: session.isVerifiedAccount ? 'verified' : 'pending_verification',
      maxResponses: 5,
      currentResponses: 0,
      matchWindowExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      tags: [r.industry || 'B2B', r.city || 'India', 'WhatsApp'],
    } as any);
    session.pendingDraft = { leadId: newLeadId };
    return (
      `✅ *Requirement Submitted to XPO!* (Ref: ${newLeadId})\n\n` +
      `Your requirement *"${r.requirementTitle}"* is now entering our *5-Minute Intelligent Partner Matching Window*. ` +
      `You will receive credibility previews of up to 5 matched Partners shortly.\n\n` +
      `Type *MY LEADS* anytime to check responses or *MENU* for more options.`
    );
  }

  if (session.role === 'employer') {
    const jobLeadId = 'job_wa_' + Date.now();
    store.leads.unshift({
      id: jobLeadId,
      leadCode: 'XPO-JOB-' + Math.floor(1000 + Math.random() * 9000),
      title: `Hiring: ${r.jobTitle || 'Role'} (${r.vacancies || '1'} Vacancies)`,
      description: `Skills: ${r.skills || 'N/A'} | Exp: ${r.experience || 'N/A'} | Type: ${r.employmentType || 'Full-Time'}`,
      leadType: 'Job',
      sectorCode: 'HR',
      sectorName: r.industry || 'Recruitment',
      categoryName: r.jobTitle || 'Hiring',
      subcategoryName: r.employmentType || 'Full-Time',
      creatorId: session.linkedUserId || session.id,
      creatorName: r.contactName || 'Employer',
      creatorCompany: r.companyName || 'Hiring Company',
      location: {
        city: r.location || 'India',
        state: 'India',
        country: 'India',
      },
      budget: {
        min: 300000,
        max: 1200000,
        currency: 'INR',
        display: r.salaryRange || 'Competitive CTC',
      },
      urgency: 'Immediate Hiring',
      status: 'approved',
      verificationStatus: session.isVerifiedAccount ? 'verified' : 'pending_verification',
      maxResponses: 5,
      currentResponses: 0,
      matchWindowExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      tags: (r.skills || 'Hiring').split(',').map((s) => s.trim()),
    } as any);
    session.pendingDraft = { jobId: jobLeadId };
    return (
      `✅ *Vacancy Posted on XPO!* (Ref: ${jobLeadId})\n\n` +
      `Role: *${r.jobTitle}* at *${r.companyName}* (${r.location}).\n` +
      `Our matching engine is notifying verified Candidates matching *${r.skills}*.\n\n` +
      `Type *MY JOBS* anytime to view candidate applications or *SUBSCRIPTION* to unlock unlimited hiring connects.`
    );
  }

  if (session.role === 'partner') {
    return (
      `✅ *XPO Partner Profile Activated!*\n\n` +
      `Welcome aboard, *${r.contactName}* (${r.businessName || r.partnerType}).\n` +
      `You are now registered for *5-Minute Priority Lead Alerts* in *${r.sector} → ${r.categorySubcategory}* (${r.city}).\n\n` +
      `Type *MY LEADS* to see open Client requirements or *SUBSCRIPTION* to activate your Partner Plan (₹999/mo or $19.99/mo).`
    );
  }

  return (
    `✅ *XPO Job Seeker Profile Activated!*\n\n` +
    `Thank you, *${r.contactName}*. We have indexed your profile for *${r.preferredRole}* roles in *${r.city}* (Skills: ${r.skills}).\n\n` +
    `Type *MY JOBS* to view matching Employer vacancies or *PROFILE* to update your details anytime.`
  );
}

export interface ProcessInboundWhatsAppInput {
  fromPhone: string;
  text: string;
  messageId?: string;
  campaignSource?: string;
  attachmentType?: string;
}

export interface ProcessInboundWhatsAppOutput {
  session: WhatsAppConversationSession;
  inboundMessage: WhatsAppMessageRecord;
  outboundMessage: WhatsAppMessageRecord | null;
  duplicateIgnored?: boolean;
}

export async function processInboundWhatsAppMessage(
  input: ProcessInboundWhatsAppInput
): Promise<ProcessInboundWhatsAppOutput> {
  const session = getOrCreateWhatsAppSession(input.fromPhone, input.campaignSource);
  session.lastActivityAt = new Date().toISOString();

  // Idempotency check (Module 2): never process duplicate webhook message IDs twice
  if (input.messageId && session.processedWebhookIds.includes(input.messageId)) {
    const lastIn = syncToInboxThread(session, 'inbound', input.text, 'delivered');
    return {
      session,
      inboundMessage: lastIn,
      outboundMessage: null,
      duplicateIgnored: true,
    };
  }
  if (input.messageId) {
    session.processedWebhookIds.push(input.messageId);
  }

  const rawText = (input.text || '').trim();
  const upper = rawText.toUpperCase();
  const inboundRecord = syncToInboxThread(session, 'inbound', rawText || `[${input.attachmentType || 'Media'}]`, 'delivered');

  let replyText = '';
  let replyOptions: InteractiveOption[] | undefined;

  // Handle unsupported attachments gracefully (Module 4)
  if (input.attachmentType && !['document', 'image', 'text'].includes(input.attachmentType)) {
    replyText =
      `⚠️ Sorry, *${input.attachmentType}* attachments are not supported in automated onboarding.\n` +
      `Please reply with text (or send a PDF/image link when asked for your portfolio/CV), or type *HELP* for human support.`;
  }
  // Handle global commands (Module 4: MENU, PROFILE, MY LEADS, MY JOBS, SUBSCRIPTION, HELP, PAUSE, START, STOP)
  else if (upper === 'STOP' || upper === 'UNSUBSCRIBE') {
    session.currentState = 'OPTED_OUT';
    session.notificationPreferences.optedOut = true;
    session.notificationPreferences.marketingOptIn = false;
    const store = getMockStore();
    const crm = store.crmContacts.find(
      (c: any) => normalizePhoneE164(c.whatsapp || c.phone).e164 === session.phone
    );
    if (crm) crm.consentStatus = 'opted_out';
    replyText =
      `🛑 You have been *opted out* of XPO WhatsApp notifications. You will no longer receive automated alerts or campaigns.\n\n` +
      `Reply *START* anytime if you wish to re-enable XPO services.`;
  } else if (upper === 'PAUSE') {
    session.currentState = 'PAUSED';
    session.notificationPreferences.paused = true;
    replyText =
      `⏸️ Your XPO WhatsApp lead and job alerts are now *paused*.\n\n` +
      `Your saved progress is preserved. Reply *START* or *MENU* whenever you are ready to resume.`;
  } else if (upper === 'START') {
    session.notificationPreferences.optedOut = false;
    session.notificationPreferences.paused = false;
    session.notificationPreferences.marketingOptIn = true;
    const store = getMockStore();
    const crm = store.crmContacts.find(
      (c: any) => normalizePhoneE164(c.whatsapp || c.phone).e164 === session.phone
    );
    if (crm) crm.consentStatus = 'opted_in';

    if (session.role && session.incompleteRegistration) {
      const steps = ROLE_ONBOARDING_STEPS[session.role];
      const step = steps[session.currentStepIndex] || steps[0];
      session.currentState = 'ONBOARDING_STEP';
      replyText =
        `▶️ *Welcome back to XPO!* Resuming your *${ROLE_LABELS[session.role]}* onboarding where you left off:\n\n` +
        step.prompt;
    } else {
      session.currentState = 'AWAITING_JOURNEY_CHOICE';
      replyText =
        `*Welcome to XPO! What would you like to do?*\n\n` +
        `1. *Find Clients* (Partners, Suppliers, Agencies)\n` +
        `2. *Find Service Providers* (Post a Client Requirement)\n` +
        `3. *Hire Employees* (Employers Posting Vacancies)\n` +
        `4. *Find a Job* (Candidates Seeking Employment)\n\n` +
        `Reply with *1, 2, 3, or 4* (or tap an option below):`;
      replyOptions = JOURNEY_MENU_OPTIONS;
    }
  } else if (upper === 'MENU' || upper === 'HI' || upper === 'HELLO') {
    // If user already has an incomplete registration and says HI/HELLO, offer to resume or start fresh
    if ((upper === 'HI' || upper === 'HELLO') && session.role && session.incompleteRegistration && session.currentStepIndex > 0) {
      const steps = ROLE_ONBOARDING_STEPS[session.role];
      const step = steps[session.currentStepIndex] || steps[0];
      session.currentState = 'ONBOARDING_STEP';
      replyText =
        `👋 *Welcome back to XPO!* You have an unfinished *${ROLE_LABELS[session.role]}* setup.\n\n` +
        `Resuming from your current step (or reply *MENU* to switch journeys):\n\n` +
        step.prompt;
    } else {
      const detected = detectJourneyFromCampaignOrText('', session.campaignSource);
      if (upper !== 'MENU' && detected && !session.role) {
        session.role = detected;
        session.currentState = 'ONBOARDING_STEP';
        session.currentStepIndex = 0;
        const firstStep = ROLE_ONBOARDING_STEPS[detected][0];
        replyText =
          `👋 *Welcome to XPO!* Starting your *${ROLE_LABELS[detected]}* journey.\n\n` +
          firstStep.prompt;
      } else {
        session.currentState = 'AWAITING_JOURNEY_CHOICE';
        replyText =
          `*Welcome to XPO! What would you like to do?*\n\n` +
          `1. *Find Clients*\n` +
          `2. *Find Service Providers*\n` +
          `3. *Hire Employees*\n` +
          `4. *Find a Job*\n\n` +
          `Reply with *1–4* or select an option below:`;
        replyOptions = JOURNEY_MENU_OPTIONS;
      }
    }
  } else if (upper === 'PROFILE') {
    const entries = Object.entries(session.savedResponses);
    const summaryLines =
      entries.length > 0
        ? entries.map(([k, v]) => `• *${k}:* ${v}`).join('\n')
        : 'No profile fields saved yet.';
    const verifyBadge = session.isVerifiedAccount
      ? '✅ Verified XPO Account'
      : '🔒 Unverified Phone Session (Complete OTP on xpoindia.com to link existing account)';
    replyText =
      `👤 *Your XPO WhatsApp Profile*\n` +
      `• *Phone:* ${session.phone}\n` +
      `• *Role:* ${session.role ? ROLE_LABELS[session.role] : 'Not selected'}\n` +
      `• *Identity Status:* ${verifyBadge}\n\n` +
      `*Saved Details:*\n${summaryLines}\n\n` +
      `Reply *EDIT* to update your profile or *MENU* to change journeys.`;
  } else if (upper === 'MY LEADS') {
    const store = getMockStore();
    const b2bLeads = store.leads.filter((l: any) => l.leadType !== 'Job').slice(0, 3);
    const listText = b2bLeads
      .map(
        (l: any, i: number) =>
          `${i + 1}. *${l.title}* (${l.location?.city || 'India'}) — Budget: ${l.budget?.display || 'On Quote'} [${l.currentResponses || 0}/5 responses]`
      )
      .join('\n');
    replyText =
      `📊 *XPO Active B2B Leads & Opportunities*\n\n` +
      (listText || 'No active leads found.') +
      `\n\nReply *MENU* to post a new requirement or visit https://xpoindia.com to respond within the 5-minute window.`;
  } else if (upper === 'MY JOBS') {
    const store = getMockStore();
    const jobLeads = store.leads.filter((l: any) => l.leadType === 'Job').slice(0, 3);
    const listText =
      jobLeads.length > 0
        ? jobLeads
            .map(
              (l: any, i: number) =>
                `${i + 1}. *${l.title}* at ${l.creatorCompany} (${l.location?.city || 'India'}) — ${l.budget?.display || 'Competitive'}`
            )
            .join('\n')
        : `1. *Senior CNC Programming Engineer* at Bharat Forge (Pune) — ₹8–12 LPA\n2. *Full-Stack React/Firebase Developer* at XPO Partner Tech (Bengaluru) — ₹12–18 LPA`;
    replyText =
      `💼 *XPO Active Job Openings & Vacancies*\n\n` +
      listText +
      `\n\nReply *MENU* to post a vacancy or update your candidate profile.`;
  } else if (upper === 'SUBSCRIPTION') {
    replyText =
      `💳 *XPO Subscription & Entitlement*\n\n` +
      `• *Current Tier:* ${session.subscriptionEntitlement.toUpperCase()}\n` +
      `• *India Plan:* ₹999 / month (via Razorpay)\n` +
      `• *Global Plan:* $19.99 / month (via PayPal)\n` +
      `• *Benefits:* Unlimited 5-minute lead responses, full Client contact unlocking, and verified Partner badge.\n\n` +
      `Activate online at: https://xpoindia.com/pricing`;
  } else if (upper === 'HELP' || upper === 'SUPPORT' || upper === 'AGENT') {
    session.currentState = 'HUMAN_SUPPORT';
    replyText =
      `🛎️ *XPO Human Support Desk*\n\n` +
      `We have flagged your conversation for an XPO Relationship Manager.\n\n` +
      `*Available Instant Commands:*\n` +
      `• *MENU* — Switch journey (Find Clients / Providers / Hire / Jobs)\n` +
      `• *PROFILE* — View or edit your saved profile\n` +
      `• *MY LEADS* — View active B2B leads\n` +
      `• *MY JOBS* — View active job vacancies\n` +
      `• *SUBSCRIPTION* — Check plan & upgrade\n` +
      `• *PAUSE* / *START* / *STOP* — Manage notifications`;
  } else if (session.currentState === 'OPTED_OUT') {
    replyText = `You are currently opted out of XPO WhatsApp messages. Reply *START* to opt back in.`;
  } else if (upper === 'EDIT' && session.role) {
    session.currentState = 'ONBOARDING_STEP';
    session.currentStepIndex = 0;
    session.incompleteRegistration = true;
    const firstStep = ROLE_ONBOARDING_STEPS[session.role][0];
    replyText =
      `✏️ Let's update your *${ROLE_LABELS[session.role]}* details.\n\n` +
      firstStep.prompt;
  } else {
    // Stateful Journey & Onboarding Flow
    if (session.currentState === 'IDLE' || session.currentState === 'AWAITING_JOURNEY_CHOICE') {
      const chosenRole = detectJourneyFromCampaignOrText(rawText, session.campaignSource);
      if (chosenRole) {
        session.role = chosenRole;
        session.currentState = 'ONBOARDING_STEP';
        session.currentStepIndex = 0;
        session.incompleteRegistration = true;
        const firstStep = ROLE_ONBOARDING_STEPS[chosenRole][0];
        replyText =
          `🚀 Great choice! Starting *${ROLE_LABELS[chosenRole]}* on XPO.\n\n` +
          firstStep.prompt;
      } else {
        session.currentState = 'AWAITING_JOURNEY_CHOICE';
        replyText =
          `*Welcome to XPO! What would you like to do?*\n\n` +
          `1. *Find Clients*\n` +
          `2. *Find Service Providers*\n` +
          `3. *Hire Employees*\n` +
          `4. *Find a Job*\n\n` +
          `Please reply with *1, 2, 3, or 4* (or type *HELP* for assistance).`;
        replyOptions = JOURNEY_MENU_OPTIONS;
      }
    } else if (session.currentState === 'ONBOARDING_STEP' && session.role) {
      const steps = ROLE_ONBOARDING_STEPS[session.role];
      const currentStep = steps[session.currentStepIndex];

      if (!currentStep) {
        session.currentState = 'AWAITING_CONFIRMATION';
        replyText = buildSummaryText(session.role, session.savedResponses);
      } else if (rawText.length < 2 && !currentStep.optional) {
        replyText = `⚠️ Please provide a valid response for *${currentStep.label}*.\n\n${currentStep.prompt}`;
      } else {
        // Save answer progressively (Module 4)
        session.savedResponses[currentStep.key] =
          currentStep.optional && upper === 'SKIP' ? 'Skipped' : rawText;
        if (!session.completedQuestions.includes(currentStep.key)) {
          session.completedQuestions.push(currentStep.key);
        }

        if (currentStep.key === 'contactName') {
          session.contactName = rawText;
        }
        if (currentStep.key === 'businessName' || currentStep.key === 'companyName') {
          session.company = rawText;
        }

        const nextIndex = session.currentStepIndex + 1;
        if (nextIndex < steps.length) {
          session.currentStepIndex = nextIndex;
          const nextStep = steps[nextIndex];
          replyText = nextStep.prompt;
        } else {
          session.currentState = 'AWAITING_CONFIRMATION';
          replyText = buildSummaryText(session.role, session.savedResponses);
          replyOptions = [
            { id: 'confirm_yes', title: 'CONFIRM' },
            { id: 'confirm_edit', title: 'EDIT' },
          ];
        }
      }
    } else if (session.currentState === 'AWAITING_CONFIRMATION' && session.role) {
      if (upper === 'CONFIRM' || upper === 'YES' || upper === 'CONFIRM_YES') {
        replyText = finalizeOnboardingSubmission(session);
      } else if (upper === 'EDIT' || upper === 'CONFIRM_EDIT') {
        session.currentState = 'ONBOARDING_STEP';
        session.currentStepIndex = 0;
        const firstStep = ROLE_ONBOARDING_STEPS[session.role][0];
        replyText = `✏️ Restarting your *${ROLE_LABELS[session.role]}* responses so you can edit them:\n\n${firstStep.prompt}`;
      } else {
        replyText =
          `Please reply *CONFIRM* to submit your details to XPO, or *EDIT* to make changes.\n\n` +
          buildSummaryText(session.role, session.savedResponses);
      }
    } else {
      // Completed or Human Support state
      replyText =
        `Thank you for messaging *XPO*! Your profile is active.\n\n` +
        `Reply *MENU* to start a new journey, *MY LEADS* / *MY JOBS* to view opportunities, *PROFILE* to view your details, or *HELP* for support.`;
    }
  }

  // Dispatch outbound message via configurable adapter (simulated vs live Meta Cloud API)
  const dispatchRes = await dispatchWhatsAppMessage({
    toPhoneE164: session.phone,
    text: replyText,
    interactiveOptions: replyOptions,
  });

  const outboundRecord = syncToInboxThread(
    session,
    'outbound',
    replyText,
    dispatchRes.status,
    replyOptions,
    dispatchRes.metaMessageId
  );

  return {
    session,
    inboundMessage: inboundRecord,
    outboundMessage: outboundRecord,
  };
}
