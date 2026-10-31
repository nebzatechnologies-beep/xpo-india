/**
 * XPO — WhatsApp-First B2B Client & Partner Marketplace
 * Canonical Production Domain Types (Cloud Firestore + Meta Cloud API + Gateways + Hybrid Agentic Flow)
 *
 * Strictly 3 Platform Roles:
 * - 'superadmin' (Platform Control Plane)
 * - 'client' (Posts requirements free; initial 5 free Partner views -> Client Plan)
 * - 'partner' (Receives 5-min matching leads; initial 5 free valid applications -> Partner Plan)
 */

export type CustomerRole = 'client' | 'partner';
export type SystemRole = 'superadmin' | CustomerRole;

export type VerificationStatus =
  | 'unverified'
  | 'verification_pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export type AccountStatus = 'active' | 'suspended' | 'deleted';

export type PartnerClassification =
  | 'Freelancer'
  | 'Software Agency'
  | 'Design Studio'
  | 'Consultant'
  | 'Manufacturer'
  | 'Supplier'
  | 'Contractor'
  | 'Distributor'
  | 'Agency'
  | 'Other Professional';

export type AvailabilityStatus = 'available' | 'busy' | 'paused';

/**
 * 7 Canonical CRM Contact States
 */
export type CrmContactState =
  | 'imported_prospect'
  | 'registered_customer'
  | 'verification_pending'
  | 'verified_customer'
  | 'eligible_matching_recipient'
  | 'opted_out_contact'
  | 'suspended_contact';

export type ConsentStatus = 'none' | 'consent_pending' | 'opted_in' | 'opted_out';

export type CrmDatabaseType = 'client' | 'partner';

export type CrmInvitationStatus =
  | 'not_invited'
  | 'invited'
  | 'delivered'
  | 'responded'
  | 'registered';

/**
 * Canonical WhatsApp Conversation States
 */
export type ConversationState =
  | 'NEW_CONTACT'
  | 'CONSENT_PENDING'
  | 'ROLE_IDENTIFIED'
  | 'ONBOARDING'
  | 'VERIFICATION_PENDING'
  | 'ACTIVE'
  | 'REQUIREMENT_DRAFT'
  | 'REQUIREMENT_REVIEW'
  | 'MATCHING'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_EXPIRED'
  | 'CONNECTION_PENDING'
  | 'CONNECTED'
  | 'PAYMENT_REQUIRED'
  | 'SUBSCRIBED'
  | 'PAUSED'
  | 'SUPPORT_REVIEW';

export type BillingCurrency = 'INR' | 'USD';
export type PaymentGateway = 'razorpay' | 'paypal';

// ============================================================================
// 1. Identity, Businesses & Single-Role Profiles
// ============================================================================

export interface XpoUser {
  uid: string;
  phoneE164: string;
  email?: string | null;
  displayName: string;
  primaryCity: string;
  state?: string;
  country: string;
  countryIso2: string; // e.g. 'IN', 'US', 'AE'
  billingCurrency: BillingCurrency;
  /**
   * Canonical single role per customer account ('client' | 'partner').
   * enabledRoles & activeRole remain strictly synchronized to [role] and role.
   */
  role: CustomerRole;
  enabledRoles: CustomerRole[];
  activeRole: CustomerRole;
  isSuperadmin: boolean;
  isPhoneVerified: boolean;
  verificationStatus: VerificationStatus;
  status: AccountStatus;
  linkedBusinessId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneIndexEntry {
  phoneE164: string;
  uid?: string | null;
  crmContactId?: string | null;
  linkedAt?: string | null;
  updatedAt: string;
}

export interface XpoBusiness {
  id: string;
  ownerUid: string;
  companyName: string;
  registrationNumber?: string; // GSTIN / CIN / EIN / Trade License
  industrySectorId?: string;
  industryName?: string;
  website?: string;
  city: string;
  state?: string;
  country: string;
  businessInfo?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseRoleProfile {
  id: string; // `${uid}_${role}`
  uid: string;
  role: CustomerRole;
  businessId?: string | null;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRoleProfile extends BaseRoleProfile {
  role: 'client';
  contactName: string;
  businessName: string;
  businessInfo?: string;
  city: string;
  location: string;
  industrySectorId?: string;
  industryName: string;
  website?: string;
  requirementsPostedCount: number;
  activeRequirementsCount: number;
  // Client Partner-View Entitlements (Post Free -> Initial 5 Free Views -> Client Plan)
  freePartnerViewsRemaining: number;
  paidPartnerViewsRemaining: number;
  paidViewsUnlimited: boolean;
  totalPartnersViewed: number;
  activeSubscriptionId?: string | null;
}

export interface PartnerRoleProfile extends BaseRoleProfile {
  role: 'partner';
  name: string;
  businessName?: string;
  partnerClassification: PartnerClassification;
  city: string;
  operatingRegions: string[];
  operatingRadiusKm?: number;
  sectorIds: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  skillTagIds: string[];
  skillNames: string[];
  servicesOffered: string[];
  capabilities: string;
  portfolioUrl?: string;
  availability: AvailabilityStatus;
  notificationsPaused: boolean;
  // Partner Lead-Claim Entitlements & Fairness Counters (Initial 5 Free Apps -> Partner Plan)
  freeClaimsRemaining: number;
  paidClaimsRemaining: number;
  paidClaimsUnlimited: boolean;
  totalValidClaims: number;
  activeSubscriptionId?: string | null;
  lastOfferSentAt?: string | null;
  recentExposureCount24h: number;
  exposureResetAt?: string | null;
}

export type AnyRoleProfile = ClientRoleProfile | PartnerRoleProfile;

// ============================================================================
// 2. Canonical 4-Tier Taxonomy (Sector -> Category -> Subcategory -> Tags/Skills)
// ============================================================================

export interface TaxonomySector {
  id: string;
  code: string;
  name: string;
  normalizedKey: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomyCategory {
  id: string;
  code: string;
  sectorId: string;
  name: string;
  normalizedKey: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomySubcategory {
  id: string;
  code: string;
  sectorId: string;
  categoryId: string;
  name: string;
  normalizedKey: string;
  description?: string;
  tagIds: string[];
  sortOrder: number;
  isActive: boolean;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomyTag {
  id: string;
  name: string;
  normalizedKey: string;
  sectorId?: string;
  categoryId?: string;
  subcategoryIds: string[];
  usageCount: number;
  isActive: boolean;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'dropdown' | 'checkbox' | 'file' | 'url';
  placeholder?: string;
  description?: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface TaxonomyFormSchema {
  id: string; // categoryId or subcategoryId
  targetType: 'category' | 'subcategory';
  targetId: string;
  fields: CustomFormField[];
  updatedBy?: string;
  updatedAt: string;
}

// ============================================================================
// 3. Client Database & Partner Database CRM, Consent & Excel Import Engine
// ============================================================================

export type CrmContactType =
  | 'Company'
  | 'Business Owner'
  | 'Manufacturer'
  | 'Supplier'
  | 'Freelancer'
  | 'Agency'
  | 'Consultant'
  | 'Contractor'
  | 'Distributor'
  | 'Client'
  | 'Partner'
  | 'Other';

export interface CrmContact {
  id: string; // phoneE164
  databaseType: CrmDatabaseType; // 'client' | 'partner'
  databaseTypes?: CrmDatabaseType[];
  phoneE164: string;
  whatsappE164: string;
  originalPhoneRaw: string;
  countryCode: string;
  countryIso2: string;
  contactName: string;
  companyName: string;
  businessInfo?: string;
  servicesOffered?: string[];
  email?: string | null;
  website?: string | null;
  city: string;
  state?: string;
  country: string;
  sectorId?: string | null;
  sectorName: string;
  categoryId?: string | null;
  categoryName: string;
  subcategoryId?: string | null;
  subcategoryName: string;
  skillTagIds: string[];
  skills: string[];
  contactTypes: CrmContactType[];
  roles: CustomerRole[];
  source: string;
  notes?: string;
  crmState: CrmContactState;
  consentStatus: ConsentStatus;
  consentSource?: string;
  consentRecordedAt?: string | null;
  invitationStatus?: CrmInvitationStatus;
  clientInvitationStatus?: CrmInvitationStatus;
  partnerInvitationStatus?: CrmInvitationStatus;
  lastClientInvitedAt?: string | null;
  lastPartnerInvitedAt?: string | null;
  lastInvitedAt?: string | null;
  registeredAt?: string | null;
  verificationStatus: VerificationStatus;
  linkedUid?: string | null;
  lastEngagedAt?: string | null;
  campaignsSentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConsentRecord {
  id: string;
  phoneE164: string;
  uid?: string | null;
  previousStatus: ConsentStatus;
  newStatus: ConsentStatus;
  channel: 'whatsapp_inbound' | 'web_onboarding' | 'excel_import_verified' | 'superadmin_manual' | 'stop_keyword';
  evidenceNote: string;
  actorId?: string | null;
  createdAt: string;
}

export interface ContactSegment {
  id: string;
  name: string;
  description?: string;
  filters: {
    databaseType?: CrmDatabaseType;
    roles?: CustomerRole[];
    sectorId?: string;
    categoryId?: string;
    subcategoryId?: string;
    city?: string;
    country?: string;
    verificationStatus?: VerificationStatus;
    crmState?: CrmContactState;
    consentStatus?: ConsentStatus;
    invitationStatus?: CrmInvitationStatus;
    engagedWithinDays?: number;
  };
  estimatedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ImportJobType = 'taxonomy' | 'crm_contacts' | 'client_database' | 'partner_database';
export type ImportJobStatus =
  | 'uploaded'
  | 'preview_ready'
  | 'confirmed_queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ImportJob {
  id: string;
  type: ImportJobType;
  databaseType?: CrmDatabaseType | null;
  fileName: string;
  storagePath?: string | null;
  selectedSheet: string;
  columnMap: Record<string, string>;
  conflictMode: 'merge_preserve' | 'skip_existing';
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  toCreateCount: number;
  toUpdateCount: number;
  toSkipCount: number;
  rejectedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorReportCsv?: string | null;
  uploadedByUid: string;
  uploadedByName: string;
  createdAt: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
}

export interface ImportRowError {
  rowNumber: number;
  rawIdentifier: string;
  reason: string;
  rawRow: Record<string, unknown>;
}

// ============================================================================
// 4. Service Marketplace, 5-Min Lead Distribution & Candidate Unlock Ledger
// ============================================================================

export type ModerationStatus = 'pending_review' | 'approved' | 'rejected';

export type RequirementDistributionStatus =
  | 'awaiting_approval'
  | 'queued'
  | 'distributing'
  | 'target_reached'
  | 'pool_exhausted'
  | 'closed';

export interface ServiceRequirement {
  id: string;
  xpoCode: string; // e.g. XPO-REQ-10421
  clientUid: string;
  clientBusinessName: string; // Masked if needed; no phone/email stored here
  clientCity: string;
  clientVerificationStatus: VerificationStatus;
  title: string;
  sectorId: string;
  sectorName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string | null;
  subcategoryName?: string;
  skillTagIds: string[];
  specifications: string;
  customFields?: Record<string, unknown>;
  workLocation: string;
  country: string;
  timeline: string;
  estimatedBudget?: string | null;
  budgetMode: 'specified' | 'to_be_discussed';
  supportingDocPaths: string[];
  moderationStatus: ModerationStatus;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  distributionStatus: RequirementDistributionStatus;
  currentRound: number;
  offersSentCount: number;
  interestedCount: number;
  targetInterestedCount: number;
  sourceChannel: 'whatsapp' | 'web';
  isSimulated: boolean;
  createdAt: string;
  approvedAt?: string | null;
  closedAt?: string | null;
  updatedAt: string;
}

export interface MatchCandidateItem {
  candidateUid: string;
  phoneE164: string;
  displayName: string;
  businessName?: string;
  relevanceScore: number;
  fairnessPenalty: number;
  finalScore: number;
  matchReasons: string[];
  offerStatus: 'queued' | 'offered' | 'claimed' | 'declined' | 'expired' | 'delivery_failed' | 'notified';
  offeredRound?: number;
  offerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LeadOfferStatus =
  | 'dispatched'
  | 'delivered'
  | 'claimed'
  | 'declined'
  | 'expired'
  | 'delivery_failed'
  | 'superseded';

export interface WhatsAppLeadOffer {
  id: string;
  reqId: string;
  xpoCode: string;
  partnerUid: string;
  partnerPhoneE164: string;
  partnerName: string;
  round: number;
  status: LeadOfferStatus;
  waMessageId?: string | null;
  dispatchedAt: string;
  deliveredAt?: string | null;
  clockStartedAt: string;
  expiresAt: string;
  respondedAt?: string | null;
  deliveryCheckTaskName?: string | null;
  expiryTaskName?: string | null;
  failureReason?: string | null;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LeadClaimStatus =
  | 'claimed'
  | 'connection_requested'
  | 'connected'
  | 'client_declined';

export interface LeadClaim {
  id: string;
  reqId: string;
  xpoCode: string;
  offerId: string;
  partnerUid: string;
  partnerBusinessName: string;
  partnerCity: string;
  partnerVerificationStatus: VerificationStatus;
  partnerPortfolioUrl?: string;
  capabilityNote?: string;
  clientUid: string;
  entitlementUsed: 'free' | 'paid';
  unlockedByClient: boolean;
  unlockedAt?: string | null;
  clientEntitlementUsed?: 'free' | 'paid' | null;
  status: LeadClaimStatus;
  connectionId?: string | null;
  isSimulated: boolean;
  claimedAt: string;
  updatedAt: string;
}

/**
 * Zero-Trust Server-Redacted DTO returned to Clients when unlockedByClient === false
 */
export interface ClientLeadClaimView {
  id: string;
  reqId: string;
  xpoCode: string;
  offerId: string;
  partnerUid: string; // '' when locked
  partnerBusinessName: string; // 'Verified XPO Partner' when locked
  partnerCity: string;
  partnerVerificationStatus: VerificationStatus;
  partnerPortfolioUrl?: string;
  capabilityNote?: string;
  clientUid: string;
  status: LeadClaimStatus;
  connectionId?: string | null;
  unlockedByClient: boolean;
  unlockedAt?: string | null;
  clientEntitlementUsed?: 'free' | 'paid' | null;
  isSimulated: boolean;
  claimedAt: string;
  updatedAt: string;
}

/**
 * Idempotent Client Candidate Unlock Ledger (`client_candidate_unlocks/{clientUid}_{claimId}`)
 */
export interface ClientCandidateUnlock {
  id: string; // `${clientUid}_${claimId}`
  clientUid: string;
  claimId: string;
  reqId: string;
  xpoCode: string;
  partnerUid: string;
  entitlementUsed: 'free' | 'paid';
  sourceChannel: 'whatsapp' | 'web';
  unlockedAt: string;
}

/**
 * Immutable Audit Ledger of all Partner & Client Credit Grants / Deductions (`entitlement_ledger/{id}`)
 */
export interface EntitlementLedgerEntry {
  id: string;
  uid: string;
  role: CustomerRole;
  eventType:
    | 'initial_free_grant'
    | 'partner_lead_claim'
    | 'client_partner_unlock'
    | 'subscription_activated'
    | 'subscription_renewed'
    | 'subscription_expired'
    | 'admin_quota_override';
  creditPool: 'free' | 'paid' | 'unlimited';
  delta: number;
  balanceAfter: {
    freeRemaining: number;
    paidRemaining: number;
    unlimited: boolean;
  };
  referenceId?: string | null;
  summary: string;
  createdAt: string;
}

// ============================================================================
// 5. Trust, Verification, Mutual Connections & Moderation
// ============================================================================

export interface MutualConnection {
  id: string;
  marketplaceType: 'service';
  sourceId: string; // reqId
  sourceCode: string;
  sourceTitle: string;
  claimOrApplicationId: string; // claimId
  initiatorUid: string; // Client UID
  initiatorRole: 'client';
  recipientUid: string; // Partner UID
  recipientRole: 'partner';
  status: 'pending' | 'accepted' | 'declined';
  // Released strictly when status === 'accepted'
  releasedInitiatorContact?: {
    name: string;
    companyName: string;
    phoneE164: string;
    email?: string | null;
    city: string;
  } | null;
  releasedRecipientContact?: {
    name: string;
    companyName?: string;
    phoneE164: string;
    email?: string | null;
    city: string;
    portfolioOrResume?: string | null;
  } | null;
  isSimulated: boolean;
  requestedAt: string;
  respondedAt?: string | null;
}

export interface VerificationRequest {
  id: string;
  uid: string;
  role: CustomerRole;
  businessId?: string | null;
  applicantName: string;
  companyName?: string;
  documentType:
    | 'gst_certificate'
    | 'business_registration'
    | 'trade_license'
    | 'identity_proof'
    | 'credential_certificate'
    | 'portfolio_evidence';
  documentNumber?: string;
  storagePaths: string[];
  websiteUrl?: string;
  status: VerificationStatus;
  reviewedByUid?: string | null;
  reviewNotes?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  expiresAt?: string | null;
}

export interface TrustEvent {
  id: string;
  uid: string;
  businessId?: string | null;
  type:
    | 'phone_verified'
    | 'kyc_approved'
    | 'kyc_rejected'
    | 'requirement_approved'
    | 'lead_claimed'
    | 'partner_unlocked'
    | 'mutual_connection'
    | 'substantiated_feedback'
    | 'abuse_flag';
  summary: string;
  referenceId?: string;
  createdAt: string;
}

export type SupportTicketType =
  | 'fake_requirement'
  | 'fraudulent_profile'
  | 'spam'
  | 'inappropriate_conduct'
  | 'unauthorized_contact_sharing'
  | 'whatsapp_support'
  | 'dpdp_data_correction'
  | 'dpdp_account_deletion';

export interface SupportTicket {
  id: string;
  reporterUid?: string | null;
  reporterPhoneE164?: string | null;
  targetType?: 'requirement' | 'user' | 'connection' | 'account_privacy';
  targetId?: string | null;
  type: SupportTicketType;
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  resolutionDecision?: string | null;
  resolvedByUid?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ============================================================================
// 6. WhatsApp Automation Engine, Templates, Campaigns & Logs
// ============================================================================

export interface WhatsAppSession {
  id: string; // phoneE164 or `sim_${adminUid}_${phoneE164}`
  phoneE164: string;
  uid?: string | null;
  crmContactId?: string | null;
  state: ConversationState;
  selectedRole?: CustomerRole | null;
  workflowStepKey?: string | null;
  draftData: Record<string, unknown>;
  activeOfferId?: string | null;
  activeConnectionId?: string | null;
  campaignSource?: string | null;
  referralHeadline?: string | null;
  isAccountOwnershipVerified: boolean;
  humanTakeover: boolean;
  assignedAdminUid?: string | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  unreadAdminCount: number;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppInteractiveOption {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppMessageRecord {
  id: string;
  waMessageId: string;
  sessionId: string;
  phoneE164: string;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'interactive_buttons' | 'interactive_list' | 'template' | 'document' | 'image' | 'flow';
  body: string;
  templateName?: string | null;
  interactiveOptions?: WhatsAppInteractiveOption[];
  mediaStoragePath?: string | null;
  deliveryStatus: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'simulated_local';
  errorCode?: string | null;
  errorMessage?: string | null;
  estimatedCostInr?: number;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplateRecord {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  purpose:
    | 'registration'
    | 'client_invitation'
    | 'partner_invitation'
    | 'opportunity_alert'
    | 'connection_request'
    | 'subscription_reminder'
    | 'account_update'
    | 'support_notification'
    | 'campaign_broadcast';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  variables: string[];
  buttons: { type: 'QUICK_REPLY' | 'URL'; text: string; url?: string }[];
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  metaTemplateId?: string | null;
  updatedAt: string;
}

export interface WorkflowStepDefinition {
  key: string;
  promptText: string;
  fieldToSave: string;
  inputType: 'text' | 'buttons' | 'list' | 'taxonomy_category' | 'document_optional';
  options?: WhatsAppInteractiveOption[];
  required: boolean;
  validationPattern?: string;
  validationErrorText?: string;
}

export interface WhatsAppWorkflowConfig {
  id: string; // 'welcome' | 'client' | 'partner'
  title: string;
  welcomeMessage: string;
  fallbackMessage: string;
  steps: WorkflowStepDefinition[];
  updatedByUid?: string;
  updatedAt: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  databaseType?: CrmDatabaseType | null;
  segmentId: string;
  segmentName: string;
  templateId: string;
  templateName: string;
  templateVariablesMap: Record<string, string>;
  eligibleRecipientCount: number;
  suppressedSkippedCount: number;
  estimatedCostInr: number;
  status: 'draft' | 'approved_queued' | 'running' | 'completed' | 'cancelled';
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  repliedCount: number;
  convertedCount: number;
  createdByUid: string;
  scheduledAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

// ============================================================================
// 7. Two-Sided Subscriptions, Gateways & Configurable Platform Settings
// ============================================================================

export type SubscriptionStatus =
  | 'pending_mandate'
  | 'authenticated'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface UserSubscription {
  id: string;
  uid: string;
  role: CustomerRole; // 'client' | 'partner'
  gateway: PaymentGateway;
  currency: BillingCurrency;
  amountMonthly: number; // e.g. 299 INR or 9.99 USD
  gatewayPlanId: string;
  gatewaySubscriptionId: string;
  status: SubscriptionStatus;
  autoPayAuthorized: boolean;
  monthlyAllowance: number; // e.g. 30 Partner claims or 30 Client Partner views
  unlimitedAllowance?: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string | null;
  lastPaymentEventId?: string | null;
  taxRatePercent: number; // e.g. 18% GST for INR, 0% export USD
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEventRecord {
  id: string; // gateway event id (idempotency key)
  gateway: PaymentGateway;
  eventType: string;
  subscriptionId: string;
  uid: string;
  role: CustomerRole; // 'client' | 'partner'
  currency: BillingCurrency;
  amount: number;
  taxAmount: number;
  status: 'captured' | 'failed' | 'refunded' | 'mandate_authorized';
  invoiceNumber?: string;
  rawSummary: Record<string, unknown>;
  verifiedSignature: boolean;
  occurredAt: string;
}

/**
 * Dynamic Superadmin Platform Settings (Zero Hardcoded Quotas)
 */
export interface PlatformSettingsBundle {
  roles: {
    clientEnabled: boolean;
    partnerEnabled: boolean;
  };
  leadDistribution: {
    partnersPerRound: number; // Default: 3
    responseWindowSeconds: number; // Default: 300 (5 mins)
    interestedPartnerTarget: number; // Default: 3
    clockStartPolicy: 'on_delivered_with_60s_fallback' | 'on_dispatched';
    deliveryFallbackSeconds: number; // Default: 60
    duplicateOffersPermitted: boolean; // Default: false
    deductOnExpired: boolean; // Default: false
    deductOnDeclined: boolean; // Default: false
    deductOnClaim: number; // Default: 1
    maxNotificationRetries: number; // Default: 3
  };
  subscriptions: {
    // Partner Plan (Initial 5 Free Applications -> Partner Plan)
    partnerFreeClaims: number; // Default: 5
    partnerPaidMonthlyClaims: number; // Default: 30
    partnerPlanUnlimited: boolean; // Default: false
    partnerInrMonthlyPrice: number; // Default: 299
    partnerUsdMonthlyPrice: number; // Default: 9.99
    // Client Plan (Post Free -> Initial 5 Free Partner Views -> Client Plan)
    clientFreePartnerViews: number; // Default: 5
    clientPaidMonthlyPartnerViews: number; // Default: 30
    clientPlanUnlimited: boolean; // Default: false
    clientInrMonthlyPrice: number; // Default: 299
    clientUsdMonthlyPrice: number; // Default: 9.99
    // Shared Commercial Policies
    unusedPaidAllowanceRollover: boolean; // Default: false (monthly reset)
    clientFreeDailyRequirementLimit: number; // Default: 20 (anti-spam cap; 0 = unlimited)
    gstPercentInr: number; // Default: 18
    cancellationPolicySummary: string;
  };
  moderation: {
    autoApproveCleanRequirements: boolean; // Default: true
    requirePartnerKycForClaims: boolean; // Default: false
    launchGeographyScope: 'india_and_global' | 'india_only';
    blockedKeywords: string[];
  };
  updatedAt: string;
}

// ============================================================================
// 8. Dynamic Platform Credentials, Payment Gateways & Multi-Provider AI Agent
// ============================================================================

export interface MetaWhatsAppCredentials {
  graphVersion: string; // e.g. 'v21.0'
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'untested';
  testMessage?: string;
}

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  partnerPlanId: string;
  clientPlanId: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'untested';
  testMessage?: string;
}

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  partnerPlanId: string;
  clientPlanId: string;
  apiBaseUrl: string; // 'https://api-m.paypal.com' or 'https://api-m.sandbox.paypal.com'
  updatedAt?: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'untested';
  testMessage?: string;
}

export type AiProviderType = 'gemini' | 'openai' | 'deterministic';

export interface AiAgentCredentials {
  provider: AiProviderType;
  geminiApiKey: string;
  geminiModel: string; // e.g. 'gemini-2.5-flash'
  openaiApiKey: string;
  openaiModel: string; // e.g. 'gpt-4o-mini'
  updatedAt?: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'untested';
  testMessage?: string;
}

export interface PlatformCredentialsBundle {
  whatsapp: MetaWhatsAppCredentials;
  razorpay: RazorpayCredentials;
  paypal: PayPalCredentials;
  ai: AiAgentCredentials;
}
