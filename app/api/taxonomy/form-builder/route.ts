import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { getTaxonomyFormSchema, saveTaxonomyFormSchema } from '@/lib/services/taxonomy';
import { handleApiError, jsonOk, ValidationError } from '@/lib/utils/api-handler';

const fieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  key: z.string().min(1),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'currency',
    'date',
    'dropdown',
    'checkbox',
    'file',
    'url',
  ]),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  order: z.number(),
});

const saveFormSchema = z.object({
  targetType: z.enum(['category', 'subcategory']),
  targetId: z.string().min(1),
  fields: z.array(fieldSchema),
});

export async function GET(request: NextRequest) {
  try {
    const targetId = request.nextUrl.searchParams.get('targetId');
    if (!targetId) throw new ValidationError('targetId query parameter is required');
    const schema = await getTaxonomyFormSchema(targetId);
    return jsonOk({ schema });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = saveFormSchema.parse(await request.json());
    const schema = await saveTaxonomyFormSchema(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ schema });
  } catch (err) {
    return handleApiError(err);
  }
}
