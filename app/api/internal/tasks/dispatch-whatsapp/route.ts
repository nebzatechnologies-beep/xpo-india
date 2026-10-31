import { NextResponse, type NextRequest } from 'next/server';
import {
  markScheduledTaskCompleted,
  verifyInternalWorkerSecret,
} from '@/lib/tasks/cloud-tasks';
import { handleApiError } from '@/lib/utils/api-handler';
import {
  dispatchOutboundWhatsApp,
  type OutboundWhatsAppPayload,
} from '@/lib/whatsapp/notification-service';

export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalWorkerSecret(request.headers.get('authorization'))) {
      return NextResponse.json({ ok: false, error: 'Unauthorized worker call' }, { status: 401 });
    }
    const body = (await request.json()) as OutboundWhatsAppPayload & {
      scheduledTaskId?: string;
    };
    const record = await dispatchOutboundWhatsApp(body);
    await markScheduledTaskCompleted(body.scheduledTaskId);
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    return handleApiError(err);
  }
}
