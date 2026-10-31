import { NextResponse, type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { confirmAndStartImportJob } from '@/lib/services/imports';
import { handleApiError, jsonOk, NotFoundError } from '@/lib/utils/api-handler';
import type { ImportJob, ImportRowError } from '@/lib/types/domain';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin();
    const { id } = await context.params;
    const db = requireFirestore();
    const snap = await db.collection('import_jobs').doc(id).get();
    if (!snap.exists) throw new NotFoundError('Import job not found');

    const job = snap.data() as ImportJob;
    if (request.nextUrl.searchParams.get('download') === 'errors') {
      return new NextResponse(job.errorReportCsv || 'Row Number,Identifier,Error Reason\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="XPO_Import_${id}_Errors.csv"`,
        },
      });
    }

    const errSnap = await db
      .collection('import_jobs')
      .doc(id)
      .collection('import_errors')
      .limit(100)
      .get();
    const errors = errSnap.docs.map((d) => d.data() as ImportRowError);

    return jsonOk({ job, errors });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperadmin();
    const { id } = await context.params;
    const job = await confirmAndStartImportJob(id, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ job });
  } catch (err) {
    return handleApiError(err);
  }
}
