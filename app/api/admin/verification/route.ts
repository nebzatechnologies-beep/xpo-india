import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { resolveSupportTicket } from '@/lib/services/support';
import { reviewVerificationRequest } from '@/lib/services/verification';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { SupportTicket, VerificationRequest } from '@/lib/types/domain';

export async function GET() {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const [kycSnap, ticketSnap] = await Promise.all([
      db.collection('verification_requests').orderBy('submittedAt', 'desc').limit(150).get(),
      db.collection('support_tickets').orderBy('createdAt', 'desc').limit(150).get(),
    ]);

    return jsonOk({
      verificationRequests: kycSnap.docs.map((d) => d.data() as VerificationRequest),
      supportTickets: ticketSnap.docs.map((d) => d.data() as SupportTicket),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('review_kyc'),
    requestId: z.string().min(1),
    decision: z.enum(['verified', 'rejected', 'expired']),
    reviewNotes: z.string().optional(),
  }),
  z.object({
    action: z.literal('resolve_ticket'),
    ticketId: z.string().min(1),
    status: z.enum(['in_review', 'resolved', 'dismissed']),
    resolutionDecision: z.string().min(2),
    suspendTargetUser: z.boolean().optional(),
    approveDpdpDeletion: z.boolean().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = actionSchema.parse(await request.json());

    if (body.action === 'review_kyc') {
      const updated = await reviewVerificationRequest({
        requestId: body.requestId,
        decision: body.decision,
        reviewNotes: body.reviewNotes,
        actor: { uid: session.uid, name: session.user.displayName },
      });
      return jsonOk({ request: updated });
    }

    const ticket = await resolveSupportTicket({
      ticketId: body.ticketId,
      status: body.status,
      resolutionDecision: body.resolutionDecision,
      suspendTargetUser: body.suspendTargetUser,
      approveDpdpDeletion: body.approveDpdpDeletion,
      actor: { uid: session.uid, name: session.user.displayName },
    });
    return jsonOk({ ticket });
  } catch (err) {
    return handleApiError(err);
  }
}
