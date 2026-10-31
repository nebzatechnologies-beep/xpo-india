import { requireFirestore } from '@/lib/firebase/admin';
import { generateDocId } from '@/lib/utils/id-generator';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  module:
    | 'auth'
    | 'taxonomy'
    | 'crm'
    | 'imports'
    | 'whatsapp'
    | 'leads'
    | 'agent'
    | 'users'
    | 'verification'
    | 'connections'
    | 'subscriptions'
    | 'campaigns'
    | 'settings'
    | 'privacy';
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export async function recordAuditLog(
  input: Omit<AuditLogEntry, 'id' | 'createdAt'>
): Promise<AuditLogEntry> {
  const db = requireFirestore();
  const id = generateDocId('aud');
  const entry: AuditLogEntry = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
  };
  await db.collection('audit_logs').doc(id).set(entry);
  return entry;
}

export async function listAuditLogs(options?: {
  module?: AuditLogEntry['module'];
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const db = requireFirestore();
  const limit = Math.min(Math.max(options?.limit || 100, 1), 500);

  if (options?.module) {
    try {
      const snap = await db
        .collection('audit_logs')
        .where('module', '==', options.module)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map((d) => d.data() as AuditLogEntry);
    } catch {
      // In-memory fallback if Firestore composite index is not deployed yet
      const fallbackSnap = await db
        .collection('audit_logs')
        .orderBy('createdAt', 'desc')
        .limit(limit * 3)
        .get();
      return fallbackSnap.docs
        .map((d) => d.data() as AuditLogEntry)
        .filter((l) => l.module === options.module)
        .slice(0, limit);
    }
  }

  const snap = await db
    .collection('audit_logs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as AuditLogEntry);
}
