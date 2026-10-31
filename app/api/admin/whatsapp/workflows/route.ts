import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import { getWhatsAppWorkflows, saveWhatsAppWorkflow } from '@/lib/whatsapp/workflows';

const stepSchema = z.object({
  key: z.string().min(1),
  promptText: z.string().min(1),
  fieldToSave: z.string().min(1),
  inputType: z.enum(['text', 'buttons', 'list', 'taxonomy_category', 'document_optional']),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .optional(),
  required: z.boolean(),
  validationPattern: z.string().optional(),
  validationErrorText: z.string().optional(),
});

const workflowSchema = z.object({
  id: z.enum(['welcome', 'client', 'partner']),
  title: z.string().min(2),
  welcomeMessage: z.string().min(5),
  fallbackMessage: z.string().min(5),
  steps: z.array(stepSchema),
});

export async function GET() {
  try {
    await requireSuperadmin();
    const map = await getWhatsAppWorkflows();
    const workflows = ['welcome', 'client', 'partner']
      .map((id) => map[id])
      .filter(Boolean);
    return jsonOk({ workflows, workflowMap: map });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = workflowSchema.parse(await request.json());
    const saved = await saveWhatsAppWorkflow(
      { ...body, updatedAt: new Date().toISOString() },
      { uid: session.uid, name: session.user.displayName }
    );
    return jsonOk({ workflow: saved });
  } catch (err) {
    return handleApiError(err);
  }
}
