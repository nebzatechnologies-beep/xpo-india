import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  approveAndLaunchCampaign,
  createCampaignDraft,
  launchRoleDatabaseInvitations,
  listWhatsAppCampaigns,
  previewRoleDatabaseInvitations,
} from '@/lib/services/campaigns';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { CrmDatabaseType } from '@/lib/types/domain';

const createCampaignSchema = z.object({
  name: z.string().min(2),
  segmentId: z.string().min(1),
  templateId: z.string().min(1),
  templateVariablesMap: z.record(z.string()).optional(),
  scheduledAt: z.string().optional().nullable(),
});

const roleInviteSchema = z.object({
  action: z.literal('launch_role_invitations'),
  databaseType: z.enum(['client', 'partner']),
  name: z.string().optional(),
  templateId: z.string().optional(),
  city: z.string().optional(),
  categoryId: z.string().optional(),
  onlyUninvited: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const sp = request.nextUrl.searchParams;
    const previewRole = sp.get('previewRoleInvite') as CrmDatabaseType | null;

    if (previewRole === 'client' || previewRole === 'partner') {
      const preview = await previewRoleDatabaseInvitations({
        databaseType: previewRole,
        city: sp.get('city') || undefined,
        categoryId: sp.get('categoryId') || undefined,
        onlyUninvited: sp.get('onlyUninvited') !== 'false',
      });
      return jsonOk({ preview });
    }

    const dbType = sp.get('databaseType') as CrmDatabaseType | null;
    const campaigns = await listWhatsAppCampaigns(
      dbType === 'client' || dbType === 'partner' ? dbType : undefined
    );
    return jsonOk({ campaigns });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const raw = await request.json();

    if (raw?.action === 'launch_role_invitations') {
      const parsed = roleInviteSchema.parse(raw);
      const campaign = await launchRoleDatabaseInvitations(parsed, {
        uid: session.uid,
        name: session.user.displayName,
      });
      return jsonOk({ campaign }, 201);
    }

    if (raw?.action === 'launch' && raw?.campaignId) {
      const launched = await approveAndLaunchCampaign(String(raw.campaignId), {
        uid: session.uid,
        name: session.user.displayName,
      });
      return jsonOk({ campaign: launched });
    }

    const body = createCampaignSchema.parse(raw);
    const campaign = await createCampaignDraft(body, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ campaign }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
