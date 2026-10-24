export type N8nAuthType = 'none' | 'header' | 'basic' | 'bearer';

export type N8nEventType =
  | 'lead.created'
  | 'lead.status_changed'
  | 'interest.created'
  | 'connection.requested'
  | 'connection.accepted'
  | 'connection.declined'
  | 'payment.captured'
  | 'subscription.activated'
  | 'integration.test';

export interface N8nConfig {
  enabled: boolean;
  webhookUrl: string;
  authType: N8nAuthType;
  authHeaderName?: string;
  authHeaderValue?: string;
  basicUsername?: string;
  basicPassword?: string;
  bearerToken?: string;
  signingSecret: string;
  inboundApiKey: string;
  subscribedEvents: N8nEventType[];
  timeoutMs: number;
  maxRetries: number;
  status: 'connected' | 'disconnected' | 'untested';
  lastTestedAt?: string;
  lastTestResult?: {
    success: boolean;
    statusCode?: number;
    latencyMs?: number;
    message?: string;
  };
  lastEventAt?: string;
  updatedAt: string;
}

export interface N8nEventEnvelope<T = any> {
  id: string;
  event: N8nEventType;
  version: '1.0';
  occurredAt: string;
  source: 'xpo-india';
  environment: string;
  data: T;
}

export interface N8nDeliveryLog {
  id: string;
  eventId: string;
  event: N8nEventType;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  attempts: number;
  latencyMs?: number;
  error?: string;
  occurredAt: string;
  payloadSummary?: string;
}

export interface PartnerAudienceMember {
  userId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  subscriptionPlan?: string;
  matchingSectors: string[];
  matchingCategories: string[];
  communicationOptIn: boolean;
}

export interface DailySummaryData {
  date: string;
  totalNewLeads: number;
  totalInterests: number;
  totalConnectionsRequested: number;
  totalConnectionsAccepted: number;
  totalPaymentsCaptured: number;
  totalRevenueINR: number;
  activePartners: number;
  activeClients: number;
  unansweredLeadsCount: number;
}
