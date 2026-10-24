import { N8nConfig, N8nDeliveryLog, N8nEventType } from './types';
import { generateRandomKey } from './signing';

const DEFAULT_EVENTS: N8nEventType[] = [
  'lead.created',
  'lead.status_changed',
  'interest.created',
  'connection.requested',
  'connection.accepted',
  'connection.declined',
  'payment.captured',
  'subscription.activated',
];

// Memory store container on global object for persistent state during hot reloads
const globalForN8n = global as unknown as {
  __XPO_N8N_CONFIG?: N8nConfig;
  __XPO_N8N_LOGS?: N8nDeliveryLog[];
};

function getInitialConfig(): N8nConfig {
  const envSigningSecret = process.env.XPO_N8N_SIGNING_SECRET || generateRandomKey(32);
  const envInboundApiKey = process.env.XPO_N8N_INBOUND_API_KEY || `xpo_n8n_live_${generateRandomKey(24)}`;
  const envWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
  const envEnabled = process.env.N8N_INTEGRATION_ENABLED === 'true';

  return {
    enabled: envEnabled,
    webhookUrl: envWebhookUrl,
    authType: (process.env.N8N_AUTH_TYPE as any) || 'header',
    authHeaderName: process.env.N8N_AUTH_HEADER_NAME || 'X-N8N-API-KEY',
    authHeaderValue: process.env.N8N_AUTH_HEADER_VALUE || '',
    basicUsername: process.env.N8N_BASIC_USERNAME || '',
    basicPassword: process.env.N8N_BASIC_PASSWORD || '',
    bearerToken: process.env.N8N_BEARER_TOKEN || '',
    signingSecret: envSigningSecret,
    inboundApiKey: envInboundApiKey,
    subscribedEvents: DEFAULT_EVENTS,
    timeoutMs: 8000,
    maxRetries: 2,
    status: envWebhookUrl ? 'untested' : 'disconnected',
    updatedAt: new Date().toISOString(),
  };
}

export function getN8nConfig(): N8nConfig {
  if (!globalForN8n.__XPO_N8N_CONFIG) {
    globalForN8n.__XPO_N8N_CONFIG = getInitialConfig();
  }
  return globalForN8n.__XPO_N8N_CONFIG;
}

export function updateN8nConfig(partial: Partial<N8nConfig>): N8nConfig {
  const current = getN8nConfig();
  
  // If credentials contain MASKED strings like "••••••••", keep existing secret
  const cleanPartial = { ...partial };
  if (cleanPartial.authHeaderValue?.includes('••••')) delete cleanPartial.authHeaderValue;
  if (cleanPartial.basicPassword?.includes('••••')) delete cleanPartial.basicPassword;
  if (cleanPartial.bearerToken?.includes('••••')) delete cleanPartial.bearerToken;
  if (cleanPartial.signingSecret?.includes('••••')) delete cleanPartial.signingSecret;
  if (cleanPartial.inboundApiKey?.includes('••••')) delete cleanPartial.inboundApiKey;

  const updated: N8nConfig = {
    ...current,
    ...cleanPartial,
    updatedAt: new Date().toISOString(),
  };

  globalForN8n.__XPO_N8N_CONFIG = updated;
  return updated;
}

export function getMaskedN8nConfig(): Record<string, any> {
  const config = getN8nConfig();
  
  const mask = (str?: string) => {
    if (!str || str.length === 0) return '';
    if (str.length <= 8) return '••••••••';
    return `${str.substring(0, 4)}••••••••${str.substring(str.length - 4)}`;
  };

  return {
    ...config,
    authHeaderValueMasked: mask(config.authHeaderValue),
    basicPasswordMasked: mask(config.basicPassword),
    bearerTokenMasked: mask(config.bearerToken),
    signingSecretMasked: mask(config.signingSecret),
    inboundApiKeyMasked: mask(config.inboundApiKey),
    // Remove raw secrets for UI presentation
    authHeaderValue: undefined,
    basicPassword: undefined,
    bearerToken: undefined,
  };
}

export function getN8nLogs(): N8nDeliveryLog[] {
  if (!globalForN8n.__XPO_N8N_LOGS) {
    globalForN8n.__XPO_N8N_LOGS = [];
  }
  return globalForN8n.__XPO_N8N_LOGS;
}

export function pushN8nLog(log: N8nDeliveryLog): void {
  const logs = getN8nLogs();
  logs.unshift(log);
  // Cap ring buffer at 200 logs
  if (logs.length > 200) {
    logs.length = 200;
  }
}

export function clearN8nLogs(): void {
  globalForN8n.__XPO_N8N_LOGS = [];
}
