import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { reconcileOverdueLeadOffers } from '@/lib/marketplace/lead-distribution';
import { createServiceRequirement } from '@/lib/marketplace/requirements';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { ServiceRequirement } from '@/lib/types/domain';

const createReqSchema = z.object({
  clientRequestId: z.string().optional(),
  title: z.string().min(4, 'Requirement title must be at least 4 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  subcategoryId: z.string().optional().nullable(),
  skillTagIds: z.array(z.string()).optional(),
  specifications: z.string().min(10, 'Please describe specifications (min 10 chars)'),
  customFields: z.record(z.unknown()).optional(),
  workLocation: z.string().min(2, 'Work location is required'),
  country: z.string().optional(),
  timeline: z.string().min(2, 'Expected timeline is required'),
  estimatedBudget: z.string().optional().nullable(),
  supportingDocPaths: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const db = requireFirestore();
    await reconcileOverdueLeadOffers().catch(() => null);

    const snap = await db
      .collection('requirements')
      .where('clientUid', '==', session.uid)
      .limit(100)
      .get();

    const requirements = snap.docs
      .map((d) => d.data() as ServiceRequirement)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return jsonOk({ requirements });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['client']);
    const body = createReqSchema.parse(await request.json());
    const result = await createServiceRequirement({
      clientUid: session.uid,
      ...body,
      sourceChannel: 'web',
      isSimulated: false,
    });
    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
