import { N8nEventEnvelope, N8nEventType } from './types';
import { getN8nConfig } from './store';
import { sendN8nEvent } from './client';

/**
 * Emit an event to Hostinger n8n if integration is enabled & event is subscribed.
 * Completely safe and non-blocking: errors are caught and logged internally.
 */
export async function emitN8nEvent(event: N8nEventType, data: any): Promise<void> {
  try {
    const config = getN8nConfig();

    if (!config.enabled) {
      return;
    }

    if (config.subscribedEvents && !config.subscribedEvents.includes(event)) {
      return;
    }

    if (!config.webhookUrl) {
      return;
    }

    const envelope: N8nEventEnvelope = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      event,
      version: '1.0',
      occurredAt: new Date().toISOString(),
      source: 'xpo-india',
      environment: process.env.NODE_ENV || 'development',
      data,
    };

    // Execute send (non-blocking call)
    await sendN8nEvent(envelope);
  } catch (err: any) {
    // Non-blocking catch to guarantee XPO core flows never fail
    console.error(`[XPO n8n Emit Error] Failed to emit event ${event}:`, err?.message || err);
  }
}

/**
 * Dispatch event asynchronously without blocking caller response.
 * Uses Next.js after() if imported in route context or fires unawaited promise.
 */
export function triggerN8nEventBackground(event: N8nEventType, data: any): void {
  // Fire and forget
  setTimeout(() => {
    emitN8nEvent(event, data).catch(() => {});
  }, 0);
}
