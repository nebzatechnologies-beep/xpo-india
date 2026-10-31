import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  createContactSegment,
  evaluateSegmentContacts,
  listContactSegments,
} from '@/lib/services/crm';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const segmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  filters: z.object({
    databaseType: z.enum(['client', 'partner']).optional(),
    roles: z.array(z.enum(['client', 'partner'])).optional(),
    sectorId: z.string().optional(),
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    verificationStatus: z
      .enum(['unverified', 'verification_pending', 'verified', 'rejected', 'expired'])
      .optional(),
    crmState: z
      .enum([
        'imported_prospect',
        'registered_customer',
        'verification_pending',
        'verified_customer',
        'eligible_matching_recipient',
        'opted_out_contact',
        'suspended_contact',
      ])
      .optional(),
    consentStatus: z.enum(['none', 'consent_pending', 'opted_in', 'opted_out']).optional(),
    invitationStatus: z
      .enum(['not_invited', 'invited', 'delivered', 'responded', 'registered'])
      .optional(),
    engagedWithinDays: z.number().optional(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const previewFiltersRaw = request.nextUrl.searchParams.get('previewFilters');
    if (previewFiltersRaw) {
      const filters = JSON.parse(previewFiltersRaw);
      const matched = await evaluateSegmentContacts(filters);
      return jsonOk({ estimatedCount: matched.length, sample: matched.slice(0, 15) });
    }
    const segments = await listContactSegments();
    return jsonOk({ segments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = segmentSchema.parse(await request.json());
    const segment = await createContactSegment(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ segment }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
