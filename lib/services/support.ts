import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { recordWhatsAppConsent } from '@/lib/services/crm';
import { getUserByUid } from '@/lib/services/users';
import { NotFoundError } from '@/lib/utils/api-handler';
import { generateTicketId } from '@/lib/utils/id-generator';
import type { SupportTicket, SupportTicketType } from '@/lib/types/domain';

export async function createSupportOrAbuseTicket(input: {
  reporterUid?: string | null;
  reporterPhoneE164?: string | null;
  targetType?: SupportTicket['targetType'];
  targetId?: string | null;
  type: SupportTicketType;
  subject: string;
  description: string;
}): Promise<SupportTicket> {
  const db = requireFirestore();
  const id = generateTicketId();
  const nowIso = new Date().toISOString();

  const ticket: SupportTicket = {
    id,
    reporterUid: input.reporterUid || null,
    reporterPhoneE164: input.reporterPhoneE164 || null,
    targetType: input.targetType,
    targetId: input.targetId || null,
    type: input.type,
    subject: input.subject.trim(),
    description: input.description.trim(),
    status: 'open',
    createdAt: nowIso,
  };

  await db.collection('support_tickets').doc(id).set(ticket);

  await recordAuditLog({
    actorUid: input.reporterUid || 'anonymous',
    actorName: input.reporterPhoneE164 || 'XPO User',
    actorRole: 'client',
    module: input.type.startsWith('dpdp_') ? 'privacy' : 'verification',
    action: 'ticket.created',
    targetType: 'support_ticket',
    targetId: id,
    summary: `Logged ${input.type} ticket: ${input.subject.slice(0, 80)}`,
  });

  return ticket;
}

/**
 * Resolves a Support / Abuse / DPDP Privacy ticket.
 * When `type === 'dpdp_account_deletion'` and `approveDeletion === true`, anonymizes PII
 * in `users`, `role_profiles`, and suppresses `crm_contacts` while preserving statutory tax ledgers!
 */
export async function resolveSupportTicket(params: {
  ticketId: string;
  status: 'in_review' | 'resolved' | 'dismissed';
  resolutionDecision: string;
  suspendTargetUser?: boolean;
  approveDpdpDeletion?: boolean;
  actor: { uid: string; name: string };
}): Promise<SupportTicket> {
  const db = requireFirestore();
  const ref = db.collection('support_tickets').doc(params.ticketId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Support ticket not found');

  const ticket = snap.data() as SupportTicket;
  const nowIso = new Date().toISOString();

  await ref.set(
    {
      status: params.status,
      resolutionDecision: params.resolutionDecision,
      resolvedByUid: params.actor.uid,
      resolvedAt: params.status === 'resolved' || params.status === 'dismissed' ? nowIso : null,
    },
    { merge: true }
  );

  if (params.suspendTargetUser && ticket.targetType === 'user' && ticket.targetId) {
    const targetUser = await getUserByUid(ticket.targetId);
    await db
      .collection('users')
      .doc(ticket.targetId)
      .set({ status: 'suspended', updatedAt: nowIso }, { merge: true });
    if (targetUser?.phoneE164) {
      await db
        .collection('crm_contacts')
        .doc(targetUser.phoneE164)
        .set({ crmState: 'suspended_contact', updatedAt: nowIso }, { merge: true });
    }
  }

  if (
    params.approveDpdpDeletion &&
    ticket.type === 'dpdp_account_deletion' &&
    ticket.reporterUid
  ) {
    const user = await getUserByUid(ticket.reporterUid);
    if (user) {
      if (user.phoneE164) {
        await recordWhatsAppConsent({
          phoneE164: user.phoneE164,
          uid: user.uid,
          newStatus: 'opted_out',
          channel: 'superadmin_manual',
          evidenceNote: `DPDP Account Deletion Request (${ticket.id})`,
          actorId: params.actor.uid,
        });

        // Delete deterministic phone index and scrub CRM contact
        await Promise.all([
          db.collection('phone_index').doc(user.phoneE164).delete().catch(() => {}),
          db
            .collection('crm_contacts')
            .doc(user.phoneE164)
            .set(
              {
                name: '[Deleted User]',
                businessName: '[Deleted User]',
                crmState: 'opted_out',
                whatsappConsentStatus: 'opted_out',
                updatedAt: nowIso,
              },
              { merge: true }
            )
            .catch(() => {}),
        ]);
      }
      await db
        .collection('users')
        .doc(user.uid)
        .set(
          {
            displayName: 'Deleted XPO User',
            email: null,
            status: 'deleted',
            updatedAt: nowIso,
          },
          { merge: true }
        );
      const profs = await db.collection('role_profiles').where('uid', '==', user.uid).get();
      const batch = db.batch();
      for (const p of profs.docs) {
        batch.set(
          p.ref,
          {
            isActive: false,
            businessName: '[Deleted User]',
            primaryCity: '',
            city: '',
            portfolioUrl: null,
            phoneRaw: null,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
  }

  await recordAuditLog({
    actorUid: params.actor.uid,
    actorName: params.actor.name,
    actorRole: 'superadmin',
    module: ticket.type.startsWith('dpdp_') ? 'privacy' : 'verification',
    action: `ticket.${params.status}`,
    targetType: 'support_ticket',
    targetId: ticket.id,
    summary: `Updated ticket ${ticket.id} (${ticket.type}) -> ${params.status}`,
  });

  return (await ref.get()).data() as SupportTicket;
}
