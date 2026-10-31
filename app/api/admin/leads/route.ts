import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { dispatchNextOfferRound } from '@/lib/marketplace/lead-distribution';
import {
  getServiceRequirementDetails,
  moderateServiceRequirement,
} from '@/lib/marketplace/requirements';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type {
  LeadClaim,
  MutualConnection,
  ServiceRequirement,
  WhatsAppLeadOffer,
} from '@/lib/types/domain';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const reqId = request.nextUrl.searchParams.get('reqId');

    if (reqId) {
      const details = await getServiceRequirementDetails(reqId);
      return jsonOk(details);
    }

    const [reqsSnap, offersSnap, claimsSnap, connsSnap] = await Promise.all([
      db.collection('requirements').orderBy('createdAt', 'desc').limit(150).get(),
      db.collection('whatsapp_lead_offers').orderBy('createdAt', 'desc').limit(150).get(),
      db.collection('lead_claims').orderBy('claimedAt', 'desc').limit(150).get(),
      db
        .collection('connections')
        .where('marketplaceType', '==', 'service')
        .limit(100)
        .get(),
    ]);

    return jsonOk({
      requirements: reqsSnap.docs
        .map((d) => d.data() as ServiceRequirement)
        .filter((r) => !r.isSimulated),
      offers: offersSnap.docs
        .map((d) => d.data() as WhatsAppLeadOffer)
        .filter((o) => !o.isSimulated),
      claims: claimsSnap.docs
        .map((d) => d.data() as LeadClaim)
        .filter((c) => !c.isSimulated),
      connections: connsSnap.docs
        .map((d) => d.data() as MutualConnection)
        .filter((c) => !c.isSimulated),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const adminLeadActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('moderate'),
    reqId: z.string().min(1),
    decision: z.enum(['approved', 'rejected', 'closed']),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal('force_next_round'),
    reqId: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = adminLeadActionSchema.parse(await request.json());

    if (body.action === 'moderate') {
      const requirement = await moderateServiceRequirement({
        reqId: body.reqId,
        decision: body.decision,
        reason: body.reason,
        actor: { uid: session.uid, name: session.user.displayName },
      });
      return jsonOk({ requirement });
    }

    const dist = await dispatchNextOfferRound(body.reqId);
    return jsonOk(dist);
  } catch (err) {
    return handleApiError(err);
  }
}
