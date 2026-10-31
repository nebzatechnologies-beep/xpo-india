import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  createOrUpdateSubcategory,
  getFullTaxonomyTree,
  mergeTaxonomyEntity,
} from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const subSchema = z.object({
  id: z.string().optional(),
  sectorId: z.string().min(1),
  categoryId: z.string().min(1),
  code: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    const tree = await getFullTaxonomyTree({ includeInactive: true });
    const subcategories = categoryId
      ? tree.subcategories.filter((s) => s.categoryId === categoryId)
      : tree.subcategories;
    return jsonOk({ subcategories });
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
        { level: 'subcategory', sourceId: String(raw.sourceId), targetId: String(raw.targetId) },
        { uid: session.uid, name: session.user.displayName }
      );
      return jsonOk(res);
    }

    const body = subSchema.parse(raw);
    const subcategory = await createOrUpdateSubcategory(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ subcategory }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
