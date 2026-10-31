"use strict";
/**
 * XPO — Firebase Cloud Functions Gen 2 (`asia-south1`)
 * Durable Schedulers & Task Queue Workers:
 * 1. `reconcileOffers` (every 1 minute): Sweeps overdue 5-minute WhatsApp Lead Offers
 *    and dispatches `scheduled_tasks` due in Firestore by calling signed SSR worker endpoints.
 * 2. `reconcileSubscriptions` (every 60 minutes): Sweeps expired billing periods and resets
 *    past-due/expired Partner & Employer paid allowances cleanly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileSubscriptions = exports.reconcileOffers = exports.dispatchScheduledWorkerTask = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const tasks_1 = require("firebase-functions/v2/tasks");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
async function invokeAppWorker(targetPath, payload) {
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
exports.dispatchScheduledWorkerTask = (0, tasks_1.onTaskDispatched)({
    region: 'asia-south1',
    retryConfig: { maxAttempts: 4, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 25 },
}, async (req) => {
    const { targetPath, payload } = req.data;
    await invokeAppWorker(targetPath, payload);
});
exports.reconcileOffers = (0, scheduler_1.onSchedule)({
    region: 'asia-south1',
    schedule: 'every 1 minutes',
    timeoutSeconds: 60,
}, async () => {
    const nowIso = new Date().toISOString();
    // 1. Trigger due `scheduled_tasks`
    const dueTasks = await db
        .collection('scheduled_tasks')
        .where('status', '==', 'scheduled')
        .where('executeAt', '<=', nowIso)
        .limit(40)
        .get();
    for (const doc of dueTasks.docs) {
        const task = doc.data();
        try {
            await invokeAppWorker(task.targetPath, {
                ...task.payload,
                scheduledTaskId: task.id,
            });
        }
        catch (err) {
            console.error(`[reconcileOffers] Task ${task.id} failed:`, err);
        }
    }
    // 2. Sweep any remaining overdue 5-minute lead offers
    await invokeAppWorker('/api/internal/tasks/expire-lead-offer', {
        reconcileAll: true,
    });
});
exports.reconcileSubscriptions = (0, scheduler_1.onSchedule)({
    region: 'asia-south1',
    schedule: 'every 60 minutes',
    timeoutSeconds: 120,
}, async () => {
    const nowIso = new Date().toISOString();
    const expiredSubs = await db
        .collection('subscriptions')
        .where('status', 'in', ['active', 'cancelled', 'past_due'])
        .where('currentPeriodEnd', '<=', nowIso)
        .limit(100)
        .get();
    for (const doc of expiredSubs.docs) {
        const sub = doc.data();
        const batch = db.batch();
        batch.set(doc.ref, { status: 'expired', updatedAt: nowIso }, { merge: true });
        const profRef = db.collection('role_profiles').doc(`${sub.uid}_${sub.role}`);
        if (sub.role === 'partner') {
            batch.set(profRef, { paidClaimsRemaining: 0, activeSubscriptionId: null, updatedAt: nowIso }, { merge: true });
        }
        else {
            batch.set(profRef, { paidJobPostingsRemaining: 0, activeSubscriptionId: null, updatedAt: nowIso }, { merge: true });
        }
        await batch.commit();
    }
});
//# sourceMappingURL=index.js.map