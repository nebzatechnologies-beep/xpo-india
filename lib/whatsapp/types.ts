// ============================================================================
// XPO — WhatsApp Automation & Conversation Engine Types (Modules 2, 3, 4, 5)
// ============================================================================

export type WhatsAppProviderMode = 'simulated' | 'meta';

export type WhatsAppJourneyRole = 'partner' | 'client' | 'employer' | 'job_seeker';

export type ConversationStateName =
  | 'IDLE'
  | 'AWAITING_JOURNEY_CHOICE'
  | 'ONBOARDING_STEP'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'PAUSED'
  | 'OPTED_OUT'
  | 'HUMAN_SUPPORT';

export interface InteractiveOption {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppMessageRecord {
  id: string;
  conversationId: string;
  sender: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  createdAt: string;
  /**
   * 'simulated' is used when running without live Meta credentials so simulated
   * messages are NEVER misrepresented as real delivered Meta messages.
   */
  status: 'simulated' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  providerMode: WhatsAppProviderMode;
  interactiveOptions?: InteractiveOption[];
  metaMessageId?: string;
  errorReason?: string;
}

export interface WhatsAppConversationSession {
  id: string;
  phone: string; // E.164 normalized
  contactName: string;
  company: string;
  crmContactId: string | null;
  linkedUserId: string | null;
  /**
   * Possession of an imported phone number is NEVER proof of identity.
   * Only true after explicit OTP / authenticated XPO account linking.
   */
  isVerifiedAccount: boolean;
  role: WhatsAppJourneyRole | null;
  campaignSource: string;
  currentState: ConversationStateName;
  currentStepIndex: number;
  completedQuestions: string[];
  savedResponses: Record<string, string>;
  incompleteRegistration: boolean;
  pendingDraft: Record<string, any> | null;
  activeLeadOffers: string[];
  notificationPreferences: {
    paused: boolean;
    optedOut: boolean;
    marketingOptIn: boolean;
    transactionalOptIn: boolean;
  };
  subscriptionEntitlement: 'free' | 'active' | 'expired';
  processedWebhookIds: string[];
  lastActivityAt: string;
}

export interface OnboardingQuestionStep {
  key: string;
  label: string;
  prompt: string;
  optional?: boolean;
  options?: InteractiveOption[];
}
