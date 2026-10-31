import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';
import { getMetaWhatsAppConfig } from '@/lib/whatsapp/meta-client';

const waConfigSchema = z.object({
  phoneNumberId: z.string().min(1),
  businessAccountId: z.string().min(1),
  displayPhoneNumber: z.string().optional(),
  accessToken: z.string().optional(),
  appSecret: z.string().optional(),
  verifyToken: z.string().min(4),
});

function maskSecret(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '••••••••';
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
}

export async function GET() {
  try {
    await requireSuperadmin();
    const cfg = await getMetaWhatsAppConfig();
    return jsonOk({
      config: {
        phoneNumberId: cfg.phoneNumberId,
        businessAccountId: cfg.businessAccountId,
        displayPhoneNumber: cfg.displayPhoneNumber || '',
        verifyToken: cfg.verifyToken,
        hasAccessToken: Boolean(cfg.accessToken),
        maskedAccessToken: maskSecret(cfg.accessToken),
        hasAppSecret: Boolean(cfg.appSecret),
        maskedAppSecret: maskSecret(cfg.appSecret),
        webhookCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/whatsapp`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = waConfigSchema.parse(await request.json());
    const db = requireFirestore();
    const current = await getMetaWhatsAppConfig();

    const updated = {
      phoneNumberId: body.phoneNumberId.trim(),
      businessAccountId: body.businessAccountId.trim(),
      wabaId: body.businessAccountId.trim(),
      displayPhoneNumber: body.displayPhoneNumber?.trim() || '',
      verifyToken: body.verifyToken.trim(),
      accessToken: body.accessToken?.trim() || current.accessToken,
      appSecret: body.appSecret?.trim() || current.appSecret,
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([
      db.doc('platform_settings/whatsapp_config').set(updated, { merge: true }),
      db.doc('platform_credentials/live').set(
        {
          whatsapp: {
            phoneNumberId: updated.phoneNumberId,
            wabaId: updated.wabaId,
            displayPhoneNumber: updated.displayPhoneNumber,
            verifyToken: updated.verifyToken,
            accessToken: updated.accessToken,
            appSecret: updated.appSecret,
            updatedAt: updated.updatedAt,
          },
        },
        { merge: true }
      ),
    ]);

    await recordAuditLog({
      actorUid: session.uid,
      actorName: session.user.displayName,
      actorRole: 'superadmin',
      module: 'whatsapp',
      action: 'meta_config.updated',
      targetType: 'platform_settings',
      targetId: 'whatsapp_config',
      summary: `Updated Official Meta WhatsApp Cloud API configuration (Phone ID: ${updated.phoneNumberId})`,
    });

    return jsonOk({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}
