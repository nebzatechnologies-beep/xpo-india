import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  createOrUpdateCategory,
  getFullTaxonomyTree,
  mergeTaxonomyEntity,
} from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const categorySchema = z.object({
  id: z.string().optional(),
  sectorId: z.string().min(1),
  code: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const sectorId = request.nextUrl.searchParams.get('sectorId');
    const tree = await getFullTaxonomyTree({ includeInactive: true });
    const categories = sectorId
      ? tree.categories.filter((c) => c.sectorId === sectorId)
      : tree.categories;
    return jsonOk({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const raw = await request.json();

    if (raw?.action === 'merge') {
      const res = await mergeTaxonomyEntity(
        { level: 'category', sourceId: String(raw.sourceId), targetId: String(raw.targetId) },
        { uid: session.uid, name: session.user.displayName }
      );
      return jsonOk(res);
    }

    const body = categorySchema.parse(raw);
    const category = await createOrUpdateCategory(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ category }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
