import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import {
  ensureTemplatesInitialized,
  syncTemplatesFromMetaCloudApi,
} from '@/lib/whatsapp/meta-client';
import type { WhatsAppTemplateRecord } from '@/lib/types/domain';

const createTplSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  category: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']),
  language: z.string().default('en'),
  purpose: z.enum([
    'registration',
    'client_invitation',
    'partner_invitation',
    'opportunity_alert',
    'connection_request',
    'subscription_reminder',
    'account_update',
    'support_notification',
    'campaign_broadcast',
  ]),
  headerText: z.string().optional(),
  bodyText: z.string().min(5),
  footerText: z.string().optional(),
  variables: z.array(z.string()).default([]),
  metaStatus: z.enum(['APPROVED', 'PENDING', 'REJECTED']).default('PENDING'),
});

export async function GET() {
  try {
    await requireSuperadmin();
    const templates = await ensureTemplatesInitialized();
    return jsonOk({ templates });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const raw = await request.json();

    if (raw?.action === 'sync_meta') {
      const result = await syncTemplatesFromMetaCloudApi();
      return jsonOk(result);
    }

    const body = createTplSchema.parse(raw);
    const db = requireFirestore();
    const id = body.id || generateDocId('tpl');
    const record: WhatsAppTemplateRecord = {
      id,
      name: body.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: body.category,
      language: body.language,
      purpose: body.purpose,
      headerText: body.headerText,
      bodyText: body.bodyText,
      footerText: body.footerText,
      variables: body.variables,
      buttons: [],
      metaStatus: body.metaStatus,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('whatsapp_templates').doc(id).set(record, { merge: true });
    await recordAuditLog({
      actorUid: session.uid,
      actorName: session.user.displayName,
      actorRole: 'superadmin',
      module: 'whatsapp',
      action: 'template.saved',
      targetType: 'whatsapp_template',
      targetId: id,
      summary: `Saved WhatsApp template "${record.name}" (${record.metaStatus})`,
    });

    return jsonOk({ template: record }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
