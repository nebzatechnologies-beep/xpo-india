import crypto from 'crypto';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export type TaskTargetPath =
  | '/api/internal/tasks/check-offer-delivery'
  | '/api/internal/tasks/expire-lead-offer'
  | '/api/internal/tasks/dispatch-whatsapp'
  | '/api/internal/tasks/process-import';

export interface EnqueueTaskOptions {
  targetPath: TaskTargetPath;
  payload: Record<string, unknown>;
  delaySeconds?: number;
  taskIdHint?: string;
}

/**
 * Verifies internal worker authenticity using constant-time HMAC/Bearer check
 * against INTERNAL_WORKER_SECRET.
 */
export function verifyInternalWorkerSecret(authHeader: string | null): boolean {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (!secret || !authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function fetchGoogleAccessToken(): Promise<string | null> {
  // 1. Try Firebase Admin credential access token (works with explicit cert or ADC)
  const { app } = getFirebaseAdmin();
  if (app?.options?.credential) {
    try {
      const tokenResult = await app.options.credential.getAccessToken();
      if (tokenResult?.access_token) {
        return tokenResult.access_token;
      }
    } catch {
      // Fall through to metadata server
    }
  }

  // 2. Try GCP Cloud Run / Cloud Functions Metadata Server
  if (process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
    try {
      const res = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        { headers: { 'Metadata-Flavor': 'Google' } }
      );
      if (res.ok) {
        const json = (await res.json()) as { access_token?: string };
        return json.access_token || null;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Enqueues a durable Cloud Task via Google Cloud Tasks v2 HTTP API.
 *
 * - In GCP Production (CLOUD_TASKS_QUEUE_PATH configured): creates a scheduled HTTP POST
 *   task targeting `${NEXT_PUBLIC_APP_URL}${targetPath}` signed with `INTERNAL_WORKER_SECRET`.
 * - Also records the scheduled execution metadata in Firestore `scheduled_tasks` so the
 *   Cloud Scheduler 1-minute reconciliation job (`reconcileOffers`) acts as a belt-and-suspenders
 *   guarantee even if Cloud Tasks queue creation is delayed or run locally before Cloud Tasks setup.
 */
export async function enqueueCloudTask(options: EnqueueTaskOptions): Promise<string> {
  const { targetPath, payload, delaySeconds = 0, taskIdHint } = options;
  const executeAtMs = Date.now() + Math.max(0, delaySeconds) * 1000;
  const scheduleTimeIso = new Date(executeAtMs).toISOString();
  const safeId =
    taskIdHint?.replace(/[^a-zA-Z0-9_-]/g, '_') ||
    `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const { db } = getFirebaseAdmin();
  if (db) {
    await db
      .collection('scheduled_tasks')
      .doc(safeId)
      .set(
        {
          id: safeId,
          targetPath,
          payload,
          status: 'scheduled',
          executeAt: scheduleTimeIso,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
  }

  const queuePath = process.env.CLOUD_TASKS_QUEUE_PATH; // e.g. projects/xpo-india-ca951/locations/asia-south1/queues/xpo-default
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const workerSecret = process.env.INTERNAL_WORKER_SECRET;

  if (queuePath && appUrl && workerSecret) {
    const accessToken = await fetchGoogleAccessToken();
    if (accessToken) {
      const url = `${appUrl.replace(/\/$/, '')}${targetPath}`;
      const bodyBase64 = Buffer.from(JSON.stringify({ ...payload, scheduledTaskId: safeId })).toString(
        'base64'
      );

      const taskBody: Record<string, unknown> = {
        task: {
          name: `${queuePath}/tasks/${safeId}`,
          httpRequest: {
            httpMethod: 'POST',
            url,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${workerSecret}`,
            },
            body: bodyBase64,
          },
        },
      };

      if (delaySeconds > 0) {
        (taskBody.task as Record<string, unknown>).scheduleTime = scheduleTimeIso;
      }

      const res = await fetch(`https://cloudtasks.googleapis.com/v2/${queuePath}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskBody),
      });

      if (res.ok || res.status === 409) {
        return `${queuePath}/tasks/${safeId}`;
      }
      const errText = await res.text();
      console.error('[CloudTasks] Failed to enqueue HTTP task, relying on Firestore scheduler:', errText);
    }
  }

  return safeId;
}

export async function markScheduledTaskCompleted(taskId?: string | null): Promise<void> {
  if (!taskId) return;
  const { db } = getFirebaseAdmin();
  if (!db) return;
  const docId = taskId.includes('/tasks/') ? taskId.split('/tasks/').pop()! : taskId;
  await db
    .collection('scheduled_tasks')
    .doc(docId)
    .set(
      {
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}
