/**
 * XPO — Firebase Cloud Functions Gen 2 (`asia-south1`)
 * Durable Schedulers & Task Queue Workers:
 * 1. `reconcileOffers` (every 1 minute): Sweeps overdue 5-minute WhatsApp Lead Offers
 *    and dispatches `scheduled_tasks` due in Firestore by calling signed SSR worker endpoints.
 * 2. `reconcileSubscriptions` (every 60 minutes): Sweeps expired billing periods and resets
 *    past-due/expired Partner & Client paid allowances cleanly.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

async function invokeAppWorker(targetPath: string, payload: Record<string, unknown>): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const workerSecret = process.env.INTERNAL_WORKER_SECRET;
  if (!appUrl || !workerSecret) {
    console.warn('[xpo-workers] NEXT_PUBLIC_APP_URL or INTERNAL_WORKER_SECRET unset.');
    return;
  }

  const res = await fetch(`${appUrl.replace(/\/$/, '')}${targetPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerSecret}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Worker ${targetPath} HTTP ${res.status}: ${errText}`);
  }
}

export const dispatchScheduledWorkerTask = onTaskDispatched(
  {
    region: 'asia-south1',
    retryConfig: { maxAttempts: 4, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 25 },
  },
  async (req: { data: unknown }) => {
    const { targetPath, payload } = req.data as {
      targetPath: string;
      payload: Record<string, unknown>;
    };
    await invokeAppWorker(targetPath, payload);
  }
);

export const reconcileOffers = onSchedule(
  {
    region: 'asia-south1',
    schedule: 'every 1 minutes',
    timeoutSeconds: 60,
  },
  async () => {
    const nowIso = new Date().toISOString();

    // 1. Trigger due `scheduled_tasks`
    const dueTasks = await db
      .collection('scheduled_tasks')
      .where('status', '==', 'scheduled')
      .where('executeAt', '<=', nowIso)
      .limit(40)
      .get();

    for (const doc of dueTasks.docs) {
      const task = doc.data() as {
        id: string;
        targetPath: string;
        payload: Record<string, unknown>;
      };
      try {
        await invokeAppWorker(task.targetPath, {
          ...task.payload,
          scheduledTaskId: task.id,
        });
      } catch (err) {
        console.error(`[reconcileOffers] Task ${task.id} failed:`, err);
      }
    }

    // 2. Sweep any remaining overdue 5-minute lead offers
    await invokeAppWorker('/api/internal/tasks/expire-lead-offer', {
      reconcileAll: true,
    });
  }
);

export const reconcileSubscriptions = onSchedule(
  {
    region: 'asia-south1',
    schedule: 'every 60 minutes',
    timeoutSeconds: 120,
  },
  async () => {
    const nowIso = new Date().toISOString();
    const expiredSubs = await db
      .collection('subscriptions')
      .where('status', 'in', ['active', 'cancelled', 'past_due'])
      .where('currentPeriodEnd', '<=', nowIso)
      .limit(100)
      .get();

    for (const doc of expiredSubs.docs) {
      const sub = doc.data() as {
        id: string;
        uid: string;
        role: 'partner' | 'client';
      };

      const batch = db.batch();
      batch.set(doc.ref, { status: 'expired', updatedAt: nowIso }, { merge: true });

      const profRef = db.collection('role_profiles').doc(`${sub.uid}_${sub.role}`);
      if (sub.role === 'partner') {
        batch.set(
          profRef,
          {
            paidClaimsRemaining: 0,
            paidClaimsUnlimited: false,
            activeSubscriptionId: null,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      } else if (sub.role === 'client') {
        batch.set(
          profRef,
          {
            paidPartnerViewsRemaining: 0,
            paidViewsUnlimited: false,
            activeSubscriptionId: null,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
  }
);
