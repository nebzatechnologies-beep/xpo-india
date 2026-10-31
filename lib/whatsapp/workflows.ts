import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import type { WhatsAppWorkflowConfig } from '@/lib/types/domain';

export const DEFAULT_WHATSAPP_WORKFLOWS: Record<string, WhatsAppWorkflowConfig> = {
  welcome: {
    id: 'welcome',
    title: 'Entry & Role Registration Workflow',
    welcomeMessage:
      'Welcome to *XPO* — India’s Verified Client & Partner Marketplace.\n\nConnect directly with verified Partners or receive matched Client leads in 5 minutes with zero platform commission.\n\nHow would you like to use XPO?',
    fallbackMessage:
      'Choose an option below, describe what you need in plain language, type *MENU* for workspace actions, or type *SUPPORT* for live assistance.',
    steps: [],
    updatedAt: new Date(0).toISOString(),
  },
  client: {
    id: 'client',
    title: 'Client Guided Requirement Flow',
    welcomeMessage:
      'Great! Posting a requirement on XPO is *100% free*. You can describe what you need in one message anytime, or follow these quick prompts:',
    fallbackMessage:
      'Please reply with the requested requirement detail, or type *MENU* to return to your Client workspace.',
    steps: [
      {
        key: 'client_name',
        promptText:
          '1/6 — What is your *Full Name* and *Business Name*? (e.g., Arjun Mehta - Horizon Retail Pvt Ltd)',
        fieldToSave: 'clientIdentity',
        inputType: 'text',
        required: true,
      },
      {
        key: 'client_city',
        promptText:
          '2/6 — Which *City / Location* is this requirement for? (e.g., Bengaluru, Mumbai, Pan India)',
        fieldToSave: 'workLocation',
        inputType: 'text',
        required: true,
      },
      {
        key: 'req_category',
        promptText: '3/6 — Select the *Service / Product Category* for your requirement:',
        fieldToSave: 'categoryId',
        inputType: 'taxonomy_category',
        required: true,
      },
      {
        key: 'req_title',
        promptText:
          '4/6 — Enter a short *Requirement Title* (e.g., Need 5,000 Custom Mono Cartons / Next.js SaaS Portal):',
        fieldToSave: 'title',
        inputType: 'text',
        required: true,
      },
      {
        key: 'req_specs',
        promptText: '5/6 — Share key *Specifications, Scope, or Quantity*:',
        fieldToSave: 'specifications',
        inputType: 'text',
        required: true,
      },
      {
        key: 'req_timeline',
        promptText: '6/6 — Expected *Timeline*?',
        fieldToSave: 'timeline',
        inputType: 'buttons',
        options: [
          { id: 'tl_immediate', title: 'Immediate (< 7d)' },
          { id: 'tl_month', title: 'Within 30 Days' },
          { id: 'tl_flexible', title: '1-3 Months' },
        ],
        required: true,
      },
    ],
    updatedAt: new Date(0).toISOString(),
  },
  partner: {
    id: 'partner',
    title: 'Partner Profile & Capability Setup',
    welcomeMessage:
      'Welcome to the *XPO Partner Network*! Set up your services, categories, and locations to receive 5-minute Client lead alerts on WhatsApp.',
    fallbackMessage: 'Please reply with the requested Partner detail, or type *MENU*.',
    steps: [
      {
        key: 'partner_business',
        promptText:
          '1/5 — What is your *Name & Business Name*? (e.g., Kavita Rao - Vertex Precision Works)',
        fieldToSave: 'businessName',
        inputType: 'text',
        required: true,
      },
      {
        key: 'partner_type',
        promptText: '2/5 — Select your *Partner Classification*:',
        fieldToSave: 'partnerClassification',
        inputType: 'list',
        options: [
          { id: 'pt_Freelancer', title: 'Freelancer' },
          { id: 'pt_Software Agency', title: 'Software Agency' },
          { id: 'pt_Manufacturer', title: 'Manufacturer' },
          { id: 'pt_Supplier', title: 'Supplier' },
          { id: 'pt_Contractor', title: 'Contractor' },
          { id: 'pt_Consultant', title: 'Consultant' },
          { id: 'pt_Design Studio', title: 'Design Studio' },
        ],
        required: true,
      },
      {
        key: 'partner_category',
        promptText: '3/5 — Choose your primary *Service / Supply Category*:',
        fieldToSave: 'categoryId',
        inputType: 'taxonomy_category',
        required: true,
      },
      {
        key: 'partner_skills',
        promptText:
          '4/5 — List your *Services & Expertise* separated by commas (e.g., CNC Turning, Sheet Metal, ISO 9001):',
        fieldToSave: 'skillsRaw',
        inputType: 'text',
        required: true,
      },
      {
        key: 'partner_regions',
        promptText:
          '5/5 — Which *Cities / Locations* do you serve? (e.g., Pune, Mumbai, Pan India):',
        fieldToSave: 'regionsRaw',
        inputType: 'text',
        required: true,
      },
    ],
    updatedAt: new Date(0).toISOString(),
  },
};

const VALID_WORKFLOW_IDS = new Set(['welcome', 'client', 'partner']);

export async function getWhatsAppWorkflows(): Promise<Record<string, WhatsAppWorkflowConfig>> {
  const db = requireFirestore();
  const snap = await db.collection('whatsapp_workflows').get();
  if (snap.empty) {
    const now = new Date().toISOString();
    const batch = db.batch();
    const seeded: Record<string, WhatsAppWorkflowConfig> = {};
    for (const [id, wf] of Object.entries(DEFAULT_WHATSAPP_WORKFLOWS)) {
      const item = { ...wf, updatedAt: now };
      seeded[id] = item;
      batch.set(db.collection('whatsapp_workflows').doc(id), item);
    }
    await batch.commit();
    return seeded;
  }

  const map: Record<string, WhatsAppWorkflowConfig> = { ...DEFAULT_WHATSAPP_WORKFLOWS };
  for (const doc of snap.docs) {
    if (VALID_WORKFLOW_IDS.has(doc.id)) {
      map[doc.id] = doc.data() as WhatsAppWorkflowConfig;
    }
  }
  return map;
}

export async function saveWhatsAppWorkflow(
  workflow: WhatsAppWorkflowConfig,
  actor: { uid: string; name: string }
): Promise<WhatsAppWorkflowConfig> {
  const db = requireFirestore();
  const updated: WhatsAppWorkflowConfig = {
    ...workflow,
    updatedByUid: actor.uid,
    updatedAt: new Date().toISOString(),
  };
  await db.collection('whatsapp_workflows').doc(workflow.id).set(updated);

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'whatsapp',
    action: 'workflow.saved',
    targetType: 'whatsapp_workflow',
    targetId: workflow.id,
    summary: `Updated WhatsApp Conversation Builder workflow "${workflow.title}"`,
  });

  return updated;
}
