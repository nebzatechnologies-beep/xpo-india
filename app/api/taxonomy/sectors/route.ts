import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  createOrUpdateSector,
  getFullTaxonomyTree,
  mergeTaxonomyEntity,
} from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const sectorSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

const mergeSchema = z.object({
  action: z.literal('merge'),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

export async function GET() {
  try {
    await requireSuperadmin();
    const tree = await getFullTaxonomyTree({ includeInactive: true });
    return jsonOk({ sectors: tree.sectors });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const raw = await request.json();

    if (raw?.action === 'merge') {
      const parsed = mergeSchema.parse(raw);
      const res = await mergeTaxonomyEntity(
        { level: 'sector', sourceId: parsed.sourceId, targetId: parsed.targetId },
        { uid: session.uid, name: session.user.displayName }
      );
      return jsonOk(res);
    }

    const body = sectorSchema.parse(raw);
    const sector = await createOrUpdateSector(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ sector }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
