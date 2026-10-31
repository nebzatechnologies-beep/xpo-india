import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runAdminCopilotTurn } from '@/lib/agent/admin-copilot';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const bodySchema = z.object({
  message: z.string().max(4000).optional(),
  confirmAction: z
    .object({
      type: z.literal('launch_invitations'),
      databaseType: z.enum(['client', 'partner']),
      templateId: z.string(),
      city: z.string().nullable().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const rawBody = await req.json();
    const parsed = bodySchema.parse(rawBody);

    const result = await runAdminCopilotTurn({
      adminUid: session.uid,
      adminName: session.user.displayName || 'Superadmin',
      message: parsed.message,
      confirmAction: parsed.confirmAction,
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
