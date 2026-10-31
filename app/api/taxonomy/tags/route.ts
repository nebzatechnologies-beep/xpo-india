import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  createOrUpdateTag,
  getFullTaxonomyTree,
  mergeTaxonomyEntity,
} from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sectorId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireSuperadmin();
    const tree = await getFullTaxonomyTree({ includeInactive: true });
    return jsonOk({ tags: tree.tags });
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
        { level: 'tag', sourceId: String(raw.sourceId), targetId: String(raw.targetId) },
        { uid: session.uid, name: session.user.displayName }
      );
      return jsonOk(res);
    }

    const body = tagSchema.parse(raw);
    const tag = await createOrUpdateTag(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ tag }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
