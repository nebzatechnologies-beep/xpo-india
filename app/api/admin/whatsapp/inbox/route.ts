import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { handleApiError, jsonOk, NotFoundError } from '@/lib/utils/api-handler';
import { dispatchOutboundWhatsApp } from '@/lib/whatsapp/notification-service';
import type { WhatsAppMessageRecord, WhatsAppSession } from '@/lib/types/domain';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (sessionId) {
      const [sessionSnap, msgSnap] = await Promise.all([
        db.collection('whatsapp_sessions').doc(sessionId).get(),
        db
          .collection('whatsapp_messages')
          .where('sessionId', '==', sessionId)
          .limit(200)
          .get(),
      ]);
      if (!sessionSnap.exists) throw new NotFoundError('Conversation session not found');

      // Reset unreadAdminCount on inspect
      await sessionSnap.ref.set({ unreadAdminCount: 0 }, { merge: true });

      const messages = msgSnap.docs
        .map((d) => d.data() as WhatsAppMessageRecord)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      return jsonOk({
        session: sessionSnap.data() as WhatsAppSession,
        messages,
      });
    }

    const sessionsSnap = await db
      .collection('whatsapp_sessions')
      .orderBy('updatedAt', 'desc')
      .limit(150)
      .get();

    const sessions = sessionsSnap.docs
      .map((d) => d.data() as WhatsAppSession)
      .filter((s) => !s.isSimulated);

    return jsonOk({ sessions });
  } catch (err) {
    return handleApiError(err);
  }
}

const inboxActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_reply'),
    sessionId: z.string().min(1),
    text: z.string().min(1),
  }),
  z.object({
    action: z.literal('toggle_takeover'),
    sessionId: z.string().min(1),
    humanTakeover: z.boolean(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireSuperadmin();
    const body = inboxActionSchema.parse(await request.json());
    const db = requireFirestore();
    const sessionRef = db.collection('whatsapp_sessions').doc(body.sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) throw new NotFoundError('Conversation session not found');
    const waSession = snap.data() as WhatsAppSession;
    const nowIso = new Date().toISOString();

    if (body.action === 'toggle_takeover') {
      await sessionRef.set(
        {
          humanTakeover: body.humanTakeover,
          state: body.humanTakeover
            ? 'SUPPORT_REVIEW'
            : waSession.uid
              ? 'ACTIVE'
              : 'NEW_CONTACT',
          assignedAdminUid: body.humanTakeover ? adminSession.uid : null,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      await recordAuditLog({
        actorUid: adminSession.uid,
        actorName: adminSession.user.displayName,
        actorRole: 'superadmin',
        module: 'whatsapp',
        action: body.humanTakeover ? 'inbox.takeover_enabled' : 'inbox.automation_resumed',
        targetType: 'whatsapp_session',
        targetId: body.sessionId,
        summary: `${body.humanTakeover ? 'Took over' : 'Resumed automation on'} WhatsApp conversation ${waSession.phoneE164}`,
      });

      return jsonOk({ session: (await sessionRef.get()).data() });
    }

    // Send live Superadmin coordinator reply
    const msg = await dispatchOutboundWhatsApp({
      sessionId: waSession.id,
      phoneE164: waSession.phoneE164,
      isSimulated: waSession.isSimulated,
      bypassSuppressionCheck: true,
      messageType: 'text',
      body: body.text,
    });

    await sessionRef.set(
      {
        humanTakeover: true,
        state: 'SUPPORT_REVIEW',
        assignedAdminUid: adminSession.uid,
        unreadAdminCount: 0,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return jsonOk({ message: msg });
  } catch (err) {
    return handleApiError(err);
  }
}
