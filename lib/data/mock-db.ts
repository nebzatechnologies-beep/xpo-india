// In-memory & persisted mock database for standalone local reliability across all V4 modules

export interface MockLeadType {
  code: string;
  name: string;
  description: string;
  mappedSectorsCount: number;
  activeLeads: number;
  status: 'active' | 'inactive';
}

export interface MockSector {
  code: string;
  name: string;
  description: string;
  categoriesCount: number;
  activeLeads: number;
  status: 'active' | 'inactive';
}

export interface MockCategory {
  _id: string;
  code: string;
  name: string;
  slug: string;
  parentSectorCode: string;
  icon: string;
  description: string;
  subcategoryCount: number;
  activeLeads: number;
  status: 'active' | 'inactive';
  isActive: boolean;
}

export interface MockSubcategory {
  code: string;
  name: string;
  parentCategoryCode: string;
  sectorCode: string;
  mappedTags: string[];
  activeLeads: number;
  status: 'active' | 'inactive';
}

export interface MockTag {
  name: string;
  subcategoryCode: string;
  categoryCode: string;
  usageCount: number;
  status: 'active' | 'inactive';
}

export interface MockFormField {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'dropdown' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'image' | 'url' | 'boolean';
  placeholder?: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validationRules?: string;
  visibilityConditions?: string;
  order: number;
  status: 'active' | 'inactive';
}

export interface MockFormSchema {
  id: string;
  classificationCode: string; // e.g. "manufacturing-industrial" or subcategory code
  classificationName: string;
  leadTypeCode: string;
  version: number;
  fields: MockFormField[];
  updatedAt: string;
}

export interface MockCrmContact {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  country: string;
  city?: string;
  industry: string;
  sectorCode: string;
  source: 'manual' | 'csv_import' | 'xlsx_import' | 'lead' | 'whatsapp';
  status: 'not_contacted' | 'contacted' | 'responded' | 'interested' | 'registered' | 'lead_posted' | 'subscribed' | 'opted_out';
  consentStatus: 'opted_in' | 'opted_out' | 'pending';
  lastContacted?: string;
  campaignHistoryCount: number;
  linkedUserId?: string;
  notes?: string;
  createdAt: string;
}

export interface MockWhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phone?: string }>;
  variables: string[];
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  updatedAt: string;
}

export interface MockWhatsAppCampaign {
  id: string;
  name: string;
  type: 'Company Invitation' | 'New Opportunity' | 'Subscription Reminder' | 'Proposal Notification' | 'General Announcement';
  audienceName: string;
  eligibleRecipients: number;
  scheduledDate?: string;
  sent: number;
  delivered: number;
  replies: number;
  spend: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'failed';
  templateId: string;
  templateName: string;
  createdAt: string;
}

export interface MockWhatsAppMessage {
  id: string;
  conversationId: string;
  sender: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MockWhatsAppConversation {
  id: string;
  contactName: string;
  company: string;
  phone: string;
  country: string;
  crmStatus: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  assignedStaff: string;
  messages: MockWhatsAppMessage[];
}

export interface MockWhatsAppAutomation {
  id: string;
  name: string;
  trigger: 'Lead Approved' | 'New Proposal' | 'Response Threshold Reached' | 'Subscription Activated' | 'Subscription Expiring' | 'Payment Successful' | 'Connection Accepted';
  conditions: string;
  templateName: string;
  status: 'active' | 'inactive';
  lastExecuted?: string;
}

// 1. Initial Lead Types
export const initialLeadTypes: MockLeadType[] = [
  { code: 'LT_BUY', name: 'Procurement / Buying', description: 'Immediate purchase of physical goods, parts, commodities, or wholesale inventory.', mappedSectorsCount: 5, activeLeads: 14, status: 'active' },
  { code: 'LT_SERVICE', name: 'Contract / Service Hire', description: 'Execution of technical engineering, cloud dev, logistics, or professional consulting.', mappedSectorsCount: 4, activeLeads: 9, status: 'active' },
  { code: 'LT_MFG', name: 'Contract Manufacturing', description: 'OEM fabrication, precision machining, casting, extrusion, and assembly.', mappedSectorsCount: 3, activeLeads: 12, status: 'active' },
  { code: 'LT_SUPPLY', name: 'Bulk Wholesale Supply', description: 'Scheduled recurring raw material distribution and export supply.', mappedSectorsCount: 4, activeLeads: 7, status: 'active' },
  { code: 'LT_CONSULT', name: 'Professional Consulting', description: 'Corporate compliance, taxation, patent filing, legal representation.', mappedSectorsCount: 2, activeLeads: 4, status: 'active' },
];

// 2. Initial Sectors
export const initialSectors: MockSector[] = [
  { code: 'SEC_MFG', name: 'Manufacturing & Industrial', description: 'CNC, machining, fabrication, casting, raw metals, packaging, OEM', categoriesCount: 3, activeLeads: 18, status: 'active' },
  { code: 'SEC_TECH', name: 'IT, Software & Digital', description: 'Web/App development, AI/ML, cloud DevOps, cybersecurity, SaaS', categoriesCount: 3, activeLeads: 11, status: 'active' },
  { code: 'SEC_PROF', name: 'Professional & Legal Services', description: 'Corporate compliance, taxation, patent/trademark filing, auditing', categoriesCount: 2, activeLeads: 6, status: 'active' },
  { code: 'SEC_LOG', name: 'Logistics & Supply Chain', description: 'Freight forwarding, cold chain storage, customs brokerage, warehousing', categoriesCount: 2, activeLeads: 8, status: 'active' },
  { code: 'SEC_TRADE', name: 'Wholesale & Bulk Trade', description: 'Bulk textiles, agricultural commodities, FMCG export-import', categoriesCount: 2, activeLeads: 5, status: 'active' },
  { code: 'SEC_HLTH', name: 'Healthcare & Pharma', description: 'Active pharmaceutical ingredients (API), medical equipment, clinical supplies', categoriesCount: 2, activeLeads: 4, status: 'active' },
];

// 3. Initial Categories
export const initialCategories: MockCategory[] = [
  { _id: 'cat_mfg_01', code: 'CAT_CNC', name: 'CNC & Precision Machining', slug: 'cnc-precision-machining', parentSectorCode: 'SEC_MFG', icon: 'Factory', description: 'Milling, turning, 5-axis aerospace machining, aluminum flanges, bushings', subcategoryCount: 3, activeLeads: 8, status: 'active', isActive: true },
  { _id: 'cat_mfg_02', code: 'CAT_FAB', name: 'Sheet Metal & Fabrication', slug: 'sheet-metal-fabrication', parentSectorCode: 'SEC_MFG', icon: 'Hammer', description: 'Laser cutting, stamping, heavy structural steel fabrication', subcategoryCount: 2, activeLeads: 5, status: 'active', isActive: true },
  { _id: 'cat_it_01', code: 'CAT_CLOUD', name: 'Cloud & Infrastructure', slug: 'cloud-infrastructure', parentSectorCode: 'SEC_TECH', icon: 'Cloud', description: 'AWS multi-region, Kubernetes, DevOps, cloud migration', subcategoryCount: 2, activeLeads: 6, status: 'active', isActive: true },
  { _id: 'cat_it_02', code: 'CAT_SAAS', name: 'Full-Stack & SaaS Development', slug: 'fullstack-saas-dev', parentSectorCode: 'SEC_TECH', icon: 'Code', description: 'Next.js, React, Node.js, microservices, mobile apps', subcategoryCount: 2, activeLeads: 5, status: 'active', isActive: true },
  { _id: 'cat_log_01', code: 'CAT_COLD', name: 'Cold Chain & Reefer Logistics', slug: 'cold-chain-logistics', parentSectorCode: 'SEC_LOG', icon: 'Truck', description: 'Refrigerated transport, temperature-controlled pharma warehousing', subcategoryCount: 2, activeLeads: 4, status: 'active', isActive: true },
  { _id: 'cat_trade_01', code: 'CAT_TEX', name: 'Textiles & Organic Fabrics', slug: 'textiles-organic-fabrics', parentSectorCode: 'SEC_TRADE', icon: 'ShoppingBag', description: 'GOTS certified organic cotton, greige fabrics, garment export', subcategoryCount: 2, activeLeads: 5, status: 'active', isActive: true },
  { _id: 'cat_prof_01', code: 'CAT_IP', name: 'Intellectual Property & Patents', slug: 'ip-patents-compliance', parentSectorCode: 'SEC_PROF', icon: 'Briefcase', description: 'Cross-border trademarks, international patent filing, commercial law', subcategoryCount: 2, activeLeads: 3, status: 'active', isActive: true },
];

// 4. Initial Subcategories
export const initialSubcategories: MockSubcategory[] = [
  { code: 'SUBCAT_CNC_MILL', name: '5-Axis Milling & Turning', parentCategoryCode: 'CAT_CNC', sectorCode: 'SEC_MFG', mappedTags: ['Mazak', '5-Axis', 'Tight Tolerance', 'Aerospace'], activeLeads: 4, status: 'active' },
  { code: 'SUBCAT_CNC_ALUM', name: 'Aluminum & Exotic Alloys Flanges', parentCategoryCode: 'CAT_CNC', sectorCode: 'SEC_MFG', mappedTags: ['6061-T6', 'Anodized', 'Flanges', 'ISO 9001'], activeLeads: 4, status: 'active' },
  { code: 'SUBCAT_AWS_MIG', name: 'AWS & Microservices Architecture', parentCategoryCode: 'CAT_CLOUD', sectorCode: 'SEC_TECH', mappedTags: ['AWS', 'Kubernetes', 'Docker', 'Terraform'], activeLeads: 3, status: 'active' },
  { code: 'SUBCAT_NEXT_SAAS', name: 'Next.js & Full-Stack Platform Engineering', parentCategoryCode: 'CAT_SAAS', sectorCode: 'SEC_TECH', mappedTags: ['Next.js 15', 'TypeScript', 'Tailwind', 'MongoDB'], activeLeads: 3, status: 'active' },
  { code: 'SUBCAT_COLD_PHARM', name: 'Refrigerated Pharma Transport (-20°C to 4°C)', parentCategoryCode: 'CAT_COLD', sectorCode: 'SEC_LOG', mappedTags: ['Pharma Reefer', 'GPS Sensors', 'Cold Hubs'], activeLeads: 4, status: 'active' },
  { code: 'SUBCAT_GOTS_COTTON', name: 'GOTS Certified Greige Cotton Fabric', parentCategoryCode: 'CAT_TEX', sectorCode: 'SEC_TRADE', mappedTags: ['GOTS', 'Greige 60s', 'Export Mills'], activeLeads: 3, status: 'active' },
];

// 5. Initial Tags
export const initialTags: MockTag[] = [
  { name: 'CNC', subcategoryCode: 'SUBCAT_CNC_MILL', categoryCode: 'CAT_CNC', usageCount: 28, status: 'active' },
  { name: 'Aluminum 6061', subcategoryCode: 'SUBCAT_CNC_ALUM', categoryCode: 'CAT_CNC', usageCount: 22, status: 'active' },
  { name: 'ISO 9001:2015', subcategoryCode: 'SUBCAT_CNC_MILL', categoryCode: 'CAT_CNC', usageCount: 45, status: 'active' },
  { name: 'Next.js 15', subcategoryCode: 'SUBCAT_NEXT_SAAS', categoryCode: 'CAT_SAAS', usageCount: 19, status: 'active' },
  { name: 'Cold Storage', subcategoryCode: 'SUBCAT_COLD_PHARM', categoryCode: 'CAT_COLD', usageCount: 14, status: 'active' },
  { name: 'GOTS Organic', subcategoryCode: 'SUBCAT_GOTS_COTTON', categoryCode: 'CAT_TEX', usageCount: 16, status: 'active' },
  { name: 'International Trademark', subcategoryCode: 'CAT_IP', categoryCode: 'CAT_IP', usageCount: 11, status: 'active' },
];

// 6. Initial Dynamic Form Schemas
export const initialFormSchemas: Record<string, MockFormSchema> = {
  'SEC_MFG': {
    id: 'schema_mfg_default',
    classificationCode: 'SEC_MFG',
    classificationName: 'Manufacturing & Industrial',
    leadTypeCode: 'LT_MFG',
    version: 1,
    fields: [
      { id: 'f_qty', label: 'Production Batch Quantity', key: 'quantity', type: 'number', placeholder: 'e.g. 5,000 units', description: 'Total units required for this batch', required: true, order: 1, status: 'active' },
      { id: 'f_mat', label: 'Raw Material Grade / Alloy', key: 'material_grade', type: 'text', placeholder: 'e.g. Aluminum 6061-T6, SS 316L, Brass', description: 'Exact metallurgical specification', required: true, order: 2, status: 'active' },
      { id: 'f_moq', label: 'Acceptable Supplier MOQ', key: 'moq', type: 'number', placeholder: 'e.g. 500', description: 'Minimum acceptable batch test quantity', required: false, order: 3, status: 'active' },
      { id: 'f_cert', label: 'Required Certifications', key: 'certifications', type: 'multiselect', options: ['ISO 9001', 'AS9100 Aerospace', 'IATF 16949 Auto', 'CE Mark', 'RoHS'], required: true, order: 4, status: 'active' },
      { id: 'f_draw', label: 'CAD Drawing / Technical Blueprints', key: 'cad_files', type: 'file', description: 'Attach STEP, DWG, or PDF technical drawing', required: false, order: 5, status: 'active' },
    ],
    updatedAt: '2026-09-28T18:00:00.000Z',
  },
  'SEC_TECH': {
    id: 'schema_tech_default',
    classificationCode: 'SEC_TECH',
    classificationName: 'IT, Software & Digital',
    leadTypeCode: 'LT_SERVICE',
    version: 1,
    fields: [
      { id: 'f_scope', label: 'Scope of Deliverables', key: 'scope_deliverables', type: 'textarea', placeholder: 'Detail functional user flows, system modules, and architecture...', required: true, order: 1, status: 'active' },
      { id: 'f_stack', label: 'Mandatory Technology Stack', key: 'tech_stack', type: 'text', placeholder: 'e.g. Next.js, Node, AWS, PostgreSQL, MongoDB', required: true, order: 2, status: 'active' },
      { id: 'f_timeline', label: 'Target Completion Deadline', key: 'target_deadline', type: 'date', required: true, order: 3, status: 'active' },
      { id: 'f_env', label: 'Deployment Cloud Environment', key: 'cloud_env', type: 'dropdown', options: ['AWS Multi-Region', 'Google Cloud GCP', 'Microsoft Azure', 'Self-Hosted / Hybrid'], required: false, order: 4, status: 'active' },
    ],
    updatedAt: '2026-09-28T18:00:00.000Z',
  }
};

// 7. Initial CRM Contacts (Connected directly to WhatsApp database)
export const initialCrmContacts: MockCrmContact[] = [
  {
    id: 'crm_101',
    name: 'Ramesh Kulkarni',
    company: 'Kulkarni Precision Sintering Works',
    phone: '+91 9823011224',
    whatsapp: '+919823011224',
    email: 'ramesh@kulkarnisinter.com',
    website: 'https://kulkarnisinter.com',
    country: 'India',
    city: 'Pune',
    industry: 'Manufacturing & Industrial',
    sectorCode: 'SEC_MFG',
    source: 'xlsx_import',
    status: 'interested',
    consentStatus: 'opted_in',
    lastContacted: '2026-09-28T14:30:00.000Z',
    campaignHistoryCount: 3,
    notes: 'Interested in automotive Tier-1 supplier leads. High capacity sintering machines.',
    createdAt: '2026-09-20T09:00:00.000Z',
  },
  {
    id: 'crm_102',
    name: 'Sunil Mehta',
    company: 'Mehta Logistics & Cold Chain Corp',
    phone: '+91 9820044551',
    whatsapp: '+919820044551',
    email: 'sunil@mehtalogistics.in',
    website: 'https://mehtalogistics.in',
    country: 'India',
    city: 'Ahmedabad',
    industry: 'Logistics & Supply Chain',
    sectorCode: 'SEC_LOG',
    source: 'manual',
    status: 'contacted',
    consentStatus: 'opted_in',
    lastContacted: '2026-09-27T11:00:00.000Z',
    campaignHistoryCount: 2,
    notes: 'Operates fleet of 35 multi-temp reefer containers Western India corridor.',
    createdAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'crm_103',
    name: 'David Miller',
    company: 'Apex Sourcing Global Inc',
    phone: '+1 415 889 1234',
    whatsapp: '+14158891234',
    email: 'david@apexsourcing.com',
    website: 'https://apexsourcing.com',
    country: 'United States',
    city: 'San Francisco',
    industry: 'Wholesale & Bulk Trade',
    sectorCode: 'SEC_TRADE',
    source: 'csv_import',
    status: 'registered',
    consentStatus: 'opted_in',
    lastContacted: '2026-09-28T17:00:00.000Z',
    campaignHistoryCount: 4,
    linkedUserId: '67489a12bcde345678900002',
    notes: 'US buyer looking for Indian organic cotton greige suppliers.',
    createdAt: '2026-09-18T15:00:00.000Z',
  },
  {
    id: 'crm_104',
    name: 'Pooja Iyer',
    company: 'Iyer Legal & IP Consultants',
    phone: '+91 9811055667',
    whatsapp: '+919811055667',
    email: 'pooja@iyerlegal.com',
    country: 'India',
    city: 'Mumbai',
    industry: 'Professional & Legal Services',
    sectorCode: 'SEC_PROF',
    source: 'lead',
    status: 'subscribed',
    consentStatus: 'opted_in',
    lastContacted: '2026-09-28T16:00:00.000Z',
    campaignHistoryCount: 1,
    notes: 'Subscribed to Annual Lead Absorber pass.',
    createdAt: '2026-09-25T11:30:00.000Z',
  },
  {
    id: 'crm_105',
    name: 'Harpreet Singh',
    company: 'Punjab Agro Commodities Export',
    phone: '+91 9872033445',
    whatsapp: '+919872033445',
    email: 'h.singh@punjabagro.com',
    country: 'India',
    city: 'Ludhiana',
    industry: 'Wholesale & Bulk Trade',
    sectorCode: 'SEC_TRADE',
    source: 'xlsx_import',
    status: 'not_contacted',
    consentStatus: 'pending',
    campaignHistoryCount: 0,
    notes: 'Imported from Punjab Chamber of Commerce export directory.',
    createdAt: '2026-09-27T08:00:00.000Z',
  }
];

// 8. Initial WhatsApp Templates
export const initialWhatsAppTemplates: MockWhatsAppTemplate[] = [
  {
    id: 'tmpl_lead_match',
    name: 'xpo_lead_match_alert',
    category: 'MARKETING',
    language: 'en',
    headerType: 'TEXT',
    headerText: 'XPO INDIA — High-Intent Opportunity Alert ⚡',
    bodyText: 'Hello {{company_name}}, a verified buyer posted a requirement matching your capabilities:\\n\\n*Requirement:* {{lead_title}}\\n*Tracking ID:* {{lead_id}}\\n*Target Budget:* {{budget}}\\n*Location:* {{country}}\\n\\nDirect contact and unmasked specs are available for review now.',
    footerText: 'Zero broker commission exchange • XPO India',
    buttons: [
      { type: 'URL', text: 'View Opportunity & Submit Bid', url: 'https://xpoindia.com/opportunities/{{lead_id}}' },
      { type: 'QUICK_REPLY', text: 'Chat with Support' }
    ],
    variables: ['company_name', 'lead_title', 'lead_id', 'budget', 'country'],
    status: 'APPROVED',
    updatedAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'tmpl_creator_proposals',
    name: 'xpo_creator_proposal_threshold',
    category: 'UTILITY',
    language: 'en',
    headerType: 'TEXT',
    headerText: 'XPO India — Quotes Received for Your Lead 📋',
    bodyText: 'Hello {{company_name}},\\n\\nYour opportunity *{{lead_title}}* ({{lead_id}}) has received direct quotations from verified suppliers.\\n\\nReview side-by-side bids, turnaround times, and unmask direct WhatsApp contacts with 0% commission.',
    footerText: 'Direct commercial handshakes',
    buttons: [
      { type: 'URL', text: 'Review Supplier Quotes', url: 'https://xpoindia.com/creator/responses' }
    ],
    variables: ['company_name', 'lead_title', 'lead_id'],
    status: 'APPROVED',
    updatedAt: '2026-09-26T12:00:00.000Z',
  },
  {
    id: 'tmpl_platform_invite',
    name: 'xpo_direct_platform_invitation',
    category: 'MARKETING',
    language: 'en',
    headerType: 'TEXT',
    headerText: 'Exclusive Invitation: XPO India Trade Exchange',
    bodyText: 'Greetings {{company_name}},\\n\\nWe identified your verified leadership in {{industry}}. Over 1,200 buyers are actively posting industrial requirements on XPO India.\\n\\nConnect directly with buyers without escrow cuts or 15% middleman brokerage.',
    footerText: 'XPO India — Sector-Agnostic Lead Exchange',
    buttons: [
      { type: 'URL', text: 'Explore Live Demands', url: 'https://xpoindia.com/opportunities' }
    ],
    variables: ['company_name', 'industry'],
    status: 'APPROVED',
    updatedAt: '2026-09-27T09:00:00.000Z',
  }
];

// 9. Initial WhatsApp Bulk Campaigns
export const initialWhatsAppCampaigns: MockWhatsAppCampaign[] = [
  {
    id: 'camp_001',
    name: 'Q3 Pune & Gujarat Precision Machining Suppliers',
    type: 'New Opportunity',
    audienceName: 'Western India CNC Manufacturers (Verified)',
    eligibleRecipients: 450,
    scheduledDate: '2026-09-28 10:00 AM',
    sent: 450,
    delivered: 442,
    replies: 88,
    spend: 382.50,
    status: 'completed',
    templateId: 'tmpl_lead_match',
    templateName: 'xpo_lead_match_alert',
    createdAt: '2026-09-28T08:00:00.000Z',
  },
  {
    id: 'camp_002',
    name: 'Global Cross-Border Sourcing Invitation',
    type: 'Company Invitation',
    audienceName: 'International Procurement Managers (USA & EU)',
    eligibleRecipients: 1200,
    scheduledDate: '2026-09-30 02:00 PM',
    sent: 0,
    delivered: 0,
    replies: 0,
    spend: 0,
    status: 'scheduled',
    templateId: 'tmpl_platform_invite',
    templateName: 'xpo_direct_platform_invitation',
    createdAt: '2026-09-28T16:00:00.000Z',
  }
];

// 10. Initial WhatsApp Inbox Conversations
export const initialWhatsAppConversations: MockWhatsAppConversation[] = [
  {
    id: 'conv_101',
    contactName: 'Ramesh Kulkarni',
    company: 'Kulkarni Precision Sintering Works',
    phone: '+91 9823011224',
    country: 'India',
    crmStatus: 'Interested',
    lastMessage: 'We received your CNC aluminum flange notification. What is the delivery location in Pune?',
    lastMessageTime: '15 mins ago',
    unreadCount: 1,
    assignedStaff: 'Super Admin',
    messages: [
      { id: 'm1', conversationId: 'conv_101', sender: 'outbound', text: 'Hello Ramesh, XPO India has a verified buyer looking for 5,000 precision CNC aluminum flanges (XPO-10021).', timestamp: '10:00 AM', status: 'read' },
      { id: 'm2', conversationId: 'conv_101', sender: 'inbound', text: 'We received your CNC aluminum flange notification. What is the delivery location in Pune?', timestamp: '10:14 AM', status: 'delivered' }
    ]
  },
  {
    id: 'conv_102',
    contactName: 'Sunil Mehta',
    company: 'Mehta Logistics & Cold Chain Corp',
    phone: '+91 9820044551',
    country: 'India',
    crmStatus: 'Contacted',
    lastMessage: 'Thanks, we have submitted our cold-chain quote for the 200T pharma transport lead.',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    assignedStaff: 'Super Admin',
    messages: [
      { id: 'm3', conversationId: 'conv_102', sender: 'outbound', text: 'Hello Sunil, XPO-10023 is live for cold storage refrigerated logistics (-20C to 4C) in Gujarat.', timestamp: '09:00 AM', status: 'read' },
      { id: 'm4', conversationId: 'conv_102', sender: 'inbound', text: 'Thanks, we have submitted our cold-chain quote for the 200T pharma transport lead.', timestamp: '09:45 AM', status: 'delivered' }
    ]
  }
];

// 11. Initial WhatsApp Automations
export const initialWhatsAppAutomations: MockWhatsAppAutomation[] = [
  {
    id: 'auto_001',
    name: 'Instant Opportunity Broadcast on Lead Approval',
    trigger: 'Lead Approved',
    conditions: 'Absorber sector matches Lead sector AND Consent is Opted In',
    templateName: 'xpo_lead_match_alert',
    status: 'active',
    lastExecuted: '28 Sep 2026, 16:30',
  },
  {
    id: 'auto_002',
    name: 'Creator Notification on 5 Proposals Received',
    trigger: 'Response Threshold Reached',
    conditions: 'Proposal count >= 5 AND Creator notification enabled',
    templateName: 'xpo_creator_proposal_threshold',
    status: 'active',
    lastExecuted: '28 Sep 2026, 17:15',
  },
  {
    id: 'auto_003',
    name: 'Subscription Activation Welcome & Direct Unmask Guide',
    trigger: 'Subscription Activated',
    conditions: 'Payment status is Captured (Razorpay or PayPal)',
    templateName: 'xpo_direct_platform_invitation',
    status: 'active',
    lastExecuted: '28 Sep 2026, 16:15',
  }
];

// 12. Initial Taxonomy Versions
export const initialTaxonomyVersions = [
  {
    version: 'v4.0.0-PROD',
    importedBy: 'Super Admin (admin@xpoindia.com)',
    date: '28 Sep 2026, 14:00',
    newRecords: 24,
    updatedRecords: 6,
    status: 'Published',
    description: 'Master classification release covering 6 industrial sectors and 12 subcategories.',
  },
  {
    version: 'v3.8.2-STAGE',
    importedBy: 'Super Admin',
    date: '20 Sep 2026, 11:30',
    newRecords: 12,
    updatedRecords: 2,
    status: 'Archived',
    description: 'CNC Machining and Heavy Fabrication subcategories update.',
  }
];

// In-Memory Global State
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalState = global as any;

if (!globalState.__XPO_STORE) {
  globalState.__XPO_STORE = {
    leadTypes: [...initialLeadTypes],
    sectors: [...initialSectors],
    categories: [...initialCategories],
    subcategories: [...initialSubcategories],
    tags: [...initialTags],
    formSchemas: { ...initialFormSchemas },
    crmContacts: [...initialCrmContacts],
    whatsappTemplates: [...initialWhatsAppTemplates],
    whatsappCampaigns: [...initialWhatsAppCampaigns],
    whatsappConversations: [...initialWhatsAppConversations],
    whatsappAutomations: [...initialWhatsAppAutomations],
    taxonomyVersions: [...initialTaxonomyVersions],
    plans: [
      {
        _id: 'plan_creator_inr',
        name: 'Lead Creator Annual (India)',
        slug: 'creator-annual-inr',
        role: 'creator',
        price: 999,
        currency: 'INR',
        billingCycle: 'annual',
        features: ['Post up to 50 active leads/month', 'Instant WhatsApp broadcast', 'Direct contact reveal', 'Razorpay AutoPay'],
        razorpayPlanId: 'plan_rzp_creator_annual',
        isActive: true,
      },
      {
        _id: 'plan_creator_usd',
        name: 'Lead Creator Annual (Global)',
        slug: 'creator-annual-usd',
        role: 'creator',
        price: 49,
        currency: 'USD',
        billingCycle: 'annual',
        features: ['Global international reach', 'Post up to 100 leads/month', 'PayPal AutoPay', 'Priority listing'],
        paypalPlanId: 'P-XPO-CREATOR-GLOBAL-49',
        isActive: true,
      },
      {
        _id: 'plan_absorber_inr',
        name: 'Lead Absorber Annual (India)',
        slug: 'absorber-annual-inr',
        role: 'absorber',
        price: 999,
        currency: 'INR',
        billingCycle: 'annual',
        features: ['Access high-intent buyer demands', 'Submit 100 proposals/month', 'Direct contact reveal', 'Razorpay AutoPay'],
        razorpayPlanId: 'plan_rzp_absorber_annual',
        isActive: true,
      },
      {
        _id: 'plan_absorber_usd',
        name: 'Lead Absorber Annual (Global)',
        slug: 'absorber-annual-usd',
        role: 'absorber',
        price: 49,
        currency: 'USD',
        billingCycle: 'annual',
        features: ['International buyer demands', 'Submit 200 proposals/month', 'PayPal AutoPay', 'Verified Provider Badge'],
        paypalPlanId: 'P-XPO-ABSORBER-GLOBAL-49',
        isActive: true,
      }
    ],
    users: [
      { _id: '67489a12bcde345678900001', name: 'Super Admin', email: 'admin@xpoindia.com', role: 'superadmin', status: 'active', phone: '+91 9876543210' },
      { _id: '67489a12bcde345678900002', name: 'Rajesh Sharma (Industrial Supplies)', email: 'creator@xpoindia.com', role: 'lead_creator', status: 'active', phone: '+91 9820011223' },
      { _id: '67489a12bcde345678900003', name: 'Anil Patel (Patel Precision Tech)', email: 'absorber@xpoindia.com', role: 'lead_absorber', status: 'active', phone: '+91 9910044556' }
    ],
    leads: [
      {
        _id: 'lead_001',
        xpoId: 'XPO-10021',
        title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
        description: 'Urgent delivery of 5,000 units aircraft-grade 6061-T6 aluminum flanges with anodized finish.',
        type: 'buy',
        status: 'live',
        creator: { _id: '67489a12bcde345678900002', name: 'Rajesh Sharma', company: 'Sharma Heavy Engineering Ltd', phone: '+91 9820011223', email: 'creator@xpoindia.com' },
        category: { _id: 'cat_mfg_01', name: 'Manufacturing & Industrial', slug: 'manufacturing-industrial' },
        country: 'IN',
        city: 'Pune, Maharashtra',
        budgetMin: 350000,
        budgetMax: 500000,
        budgetCurrency: 'INR',
        tags: ['CNC', 'Aluminum', 'Flanges', 'ISO9001'],
        createdAt: '2026-09-28T10:00:00.000Z',
      }
    ],
    responses: [
      {
        _id: 'resp_001',
        lead: { _id: 'lead_001', xpoId: 'XPO-10021', title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges' },
        absorber: { _id: '67489a12bcde345678900003', name: 'Anil Patel', company: 'Patel Precision Manufacturing & Tech', phone: '+91 9910044556', email: 'absorber@xpoindia.com' },
        message: '15+ years experience in aerospace precision CNC. Operating 5-axis Mazak machines with ISO 9001.',
        quoteAmount: 425000,
        quoteCurrency: 'INR',
        deliveryTimeline: '14 calendar days',
        status: 'connected',
        isViewed: true,
        createdAt: '2026-09-28T15:00:00.000Z',
      }
    ],
    connections: [
      {
        _id: 'conn_001',
        lead: { _id: 'lead_001', xpoId: 'XPO-10021' },
        creator: { _id: '67489a12bcde345678900002', name: 'Rajesh Sharma', company: 'Sharma Heavy Engineering Ltd' },
        absorber: { _id: '67489a12bcde345678900003', name: 'Anil Patel', company: 'Patel Precision Manufacturing & Tech' },
        response: { _id: 'resp_001' },
        status: 'connected',
        contactRevealedAt: '2026-09-28T15:30:00.000Z',
      }
    ],
    payments: [
      {
        _id: 'pay_001',
        user: { name: 'Sharma Heavy Engineering Ltd', email: 'creator@xpoindia.com' },
        gateway: 'razorpay',
        type: 'subscription',
        gatewayOrderId: 'order_rzp_live_1001',
        gatewayPaymentId: 'pay_rzp_live_887711',
        amount: 999,
        currency: 'INR',
        status: 'captured',
        metadata: { isAutoPay: true },
        createdAt: '2026-09-28T16:00:00.000Z',
      },
      {
        _id: 'pay_002',
        user: { name: 'Patel Precision Manufacturing & Tech', email: 'absorber@xpoindia.com' },
        gateway: 'razorpay',
        type: 'subscription',
        gatewayOrderId: 'order_rzp_live_1002',
        gatewayPaymentId: 'pay_rzp_live_887712',
        amount: 999,
        currency: 'INR',
        status: 'captured',
        metadata: { isAutoPay: true },
        createdAt: '2026-09-28T16:15:00.000Z',
      },
      {
        _id: 'pay_003',
        user: { name: 'Global Sourcing Inc', email: 'david@apexsourcing.com' },
        gateway: 'paypal',
        type: 'subscription',
        gatewayOrderId: 'PP-ORD-EXP-2024-001',
        gatewayPaymentId: 'PP-PAY-CAPTURED-991',
        amount: 49,
        currency: 'USD',
        status: 'captured',
        metadata: { isAutoPay: true },
        createdAt: '2026-09-28T16:30:00.000Z',
      }
    ]
  };
}

export const xpoStore = globalState.__XPO_STORE;
export function getMockStore() {
  return globalState.__XPO_STORE;
}
