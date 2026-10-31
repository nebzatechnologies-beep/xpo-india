import { requireRole } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { reconcileOverdueLeadOffers } from '@/lib/marketplace/lead-distribution';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { ServiceRequirement, WhatsAppLeadOffer } from '@/lib/types/domain';

export async function GET() {
  try {
    const session = await requireRole(['partner']);
    const db = requireFirestore();

    // Ensure expired offers are swept cleanly before returning Partner offer list
    await reconcileOverdueLeadOffers();

    const snap = await db
      .collection('whatsapp_lead_offers')
      .where('partnerUid', '==', session.uid)
      .limit(100)
      .get();

    const rawOffers = snap.docs
      .map((d) => d.data() as WhatsAppLeadOffer)
      .filter((o) => !o.isSimulated)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Enrich offers with masked requirement details (NO direct Client phone/email!)
    const enriched = await Promise.all(
      rawOffers.map(async (offer) => {
        const reqSnap = await db.collection('requirements').doc(offer.reqId).get();
        const req = reqSnap.exists ? (reqSnap.data() as ServiceRequirement) : null;
        return {
          ...offer,
          requirementSummary: req
            ? {
                id: req.id,
                xpoCode: req.xpoCode,
                title: req.title,
                categoryName: req.categoryName,
                subcategoryName: req.subcategoryName || null,
                specifications: req.specifications,
                workLocation: req.workLocation,
                timeline: req.timeline,
                estimatedBudget: req.estimatedBudget,
                budgetMode: req.budgetMode,
                clientVerificationStatus: req.clientVerificationStatus,
              }
            : null,
        };
      })
    );

    return jsonOk({ offers: enriched });
  } catch (err) {
    return handleApiError(err);
  }
}
