import { NextResponse, type NextRequest } from 'next/server';
import { executeImportJobInFirestore } from '@/lib/services/imports';
import {
  markScheduledTaskCompleted,
  verifyInternalWorkerSecret,
} from '@/lib/tasks/cloud-tasks';
import { handleApiError } from '@/lib/utils/api-handler';

export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalWorkerSecret(request.headers.get('authorization'))) {
      return NextResponse.json({ ok: false, error: 'Unauthorized worker call' }, { status: 401 });
    }
    const body = (await request.json()) as { jobId?: string; scheduledTaskId?: string };
    if (!body.jobId) {
      return NextResponse.json({ ok: false, error: 'jobId required' }, { status: 422 });
    }
    const job = await executeImportJobInFirestore(body.jobId);
    await markScheduledTaskCompleted(body.scheduledTaskId);
    return NextResponse.json({ ok: true, job });
  } catch (err) {
    return handleApiError(err);
  }
}
