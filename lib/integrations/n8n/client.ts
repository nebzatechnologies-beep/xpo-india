import { N8nConfig, N8nDeliveryLog, N8nEventEnvelope } from './types';
import { getN8nConfig, pushN8nLog, updateN8nConfig } from './store';
import { generateHmacSignature } from './signing';

/**
 * Send an event envelope to the configured Hostinger n8n webhook URL
 */
export async function sendN8nEvent(
  envelope: N8nEventEnvelope,
  overrideConfig?: N8nConfig
): Promise<{ success: boolean; statusCode?: number; latencyMs: number; error?: string }> {
  const config = overrideConfig || getN8nConfig();

  if (!config.webhookUrl) {
    return { success: false, latencyMs: 0, error: 'n8n Webhook URL is not configured' };
  }

  const startTime = Date.now();
  const rawBody = JSON.stringify(envelope);
  const signature = generateHmacSignature(rawBody, config.signingSecret);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'XPO-India-Platform/1.0',
    'X-XPO-Signature': `sha256=${signature}`,
    'X-XPO-Timestamp': envelope.occurredAt,
    'X-XPO-Event': envelope.event,
    'X-XPO-Delivery-Id': envelope.id,
    'X-XPO-Environment': envelope.environment,
  };

  // Attach auth credentials based on selected authType
  if (config.authType === 'header' && config.authHeaderName && config.authHeaderValue) {
    headers[config.authHeaderName] = config.authHeaderValue;
  } else if (config.authType === 'bearer' && config.bearerToken) {
    headers['Authorization'] = `Bearer ${config.bearerToken.replace(/^Bearer\s+/i, '')}`;
  } else if (config.authType === 'basic' && (config.basicUsername || config.basicPassword)) {
    const creds = `${config.basicUsername || ''}:${config.basicPassword || ''}`;
    headers['Authorization'] = `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  let attempt = 0;
  const maxAttempts = (config.maxRetries || 2) + 1;
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: rawBody,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      lastStatusCode = response.status;

      if (response.ok || response.status === 200 || response.status === 201 || response.status === 202) {
        const log: N8nDeliveryLog = {
          id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          eventId: envelope.id,
          event: envelope.event,
          status: 'success',
          statusCode: response.status,
          attempts: attempt,
          latencyMs,
          occurredAt: new Date().toISOString(),
          payloadSummary: `Event: ${envelope.event} | ID: ${envelope.id}`,
        };
        pushN8nLog(log);
        updateN8nConfig({ status: 'connected', lastEventAt: new Date().toISOString() });
        return { success: true, statusCode: response.status, latencyMs };
      } else {
        const text = await response.text().catch(() => '');
        lastError = `HTTP ${response.status}: ${text.substring(0, 150) || response.statusText}`;
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = `Request timed out after ${config.timeoutMs || 8000}ms`;
      } else {
        lastError = err.message || 'Network error connecting to n8n';
      }
    }

    // Exponential backoff before retry if not last attempt
    if (attempt < maxAttempts) {
      await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
    }
  }

  const latencyMs = Date.now() - startTime;
  const log: N8nDeliveryLog = {
    id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    eventId: envelope.id,
    event: envelope.event,
    status: 'failed',
    statusCode: lastStatusCode,
    attempts: attempt,
    latencyMs,
    error: lastError,
    occurredAt: new Date().toISOString(),
    payloadSummary: `Event: ${envelope.event} | Error: ${lastError}`,
  };
  pushN8nLog(log);

  return {
    success: false,
    statusCode: lastStatusCode,
    latencyMs,
    error: lastError,
  };
}

/**
 * Perform active connection test to Hostinger n8n Webhook URL
 */
export async function testN8nConnection(overrideConfig?: N8nConfig): Promise<{
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  message: string;
}> {
  const config = overrideConfig || getN8nConfig();

  if (!config.webhookUrl) {
    const res = { success: false, latencyMs: 0, message: 'Webhook URL is missing' };
    updateN8nConfig({
      status: 'disconnected',
      lastTestedAt: new Date().toISOString(),
      lastTestResult: res,
    });
    return res;
  }

  const testEnvelope: N8nEventEnvelope = {
    id: `test_${Date.now()}`,
    event: 'integration.test',
    version: '1.0',
    occurredAt: new Date().toISOString(),
    source: 'xpo-india',
    environment: process.env.NODE_ENV || 'development',
    data: {
      message: 'Ping test from XPO India Superadmin to Hostinger n8n Automation',
      timestamp: new Date().toISOString(),
      platform: 'XPO India Platform',
      apiVersion: '1.0',
    },
  };

  const result = await sendN8nEvent(testEnvelope, config);
  const testResult = {
    success: result.success,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    message: result.success
      ? `Successfully connected to Hostinger n8n (${result.latencyMs}ms latency)`
      : result.error || 'Connection failed',
  };

  updateN8nConfig({
    status: result.success ? 'connected' : 'disconnected',
    lastTestedAt: new Date().toISOString(),
    lastTestResult: testResult,
  });

  return testResult;
}
