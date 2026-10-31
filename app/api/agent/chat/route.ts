import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  type AgentRequirementDraft,
  runCustomerAgentTurn,
} from '@/lib/agent/customer-agent';
import { requireAuth } from '@/lib/auth/server-session';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

const bodySchema = z.object({
  message: z.string().max(4000).optional(),
  roleOverride: z.enum(['client', 'partner']).optional(),
  draftRequirement: z
    .object({
      title: z.string().optional(),
      categoryId: z.string().optional(),
      categoryName: z.string().optional(),
      subcategoryId: z.string().nullable().optional(),
      subcategoryName: z.string().optional(),
      skillTagIds: z.array(z.string()).optional(),
      specifications: z.string().optional(),
      workLocation: z.string().optional(),
      timeline: z.string().optional(),
      estimatedBudget: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  action: z
    .object({
      type: z.enum([
        'confirm_requirement',
        'unlock_claim',
        'request_connection',
        'claim_offer',
        'decline_offer',
        'accept_connection',
        'decline_connection',
        'save_partner_profile',
      ]),
      payload: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const rawBody = await req.json();
    const parsed = bodySchema.parse(rawBody);
    const appOrigin = req.nextUrl.origin;

    const result = await runCustomerAgentTurn({
      uid: session.uid,
      roleOverride: parsed.roleOverride,
      channel: 'web',
      message: parsed.message,
      action: parsed.action,
      draftRequirement: (parsed.draftRequirement as Partial<AgentRequirementDraft>) || null,
      appOrigin,
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
