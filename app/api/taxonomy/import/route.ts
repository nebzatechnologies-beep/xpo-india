import { NextResponse, type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  CANONICAL_TAXONOMY_FIELDS,
  confirmAndStartImportJob,
  inspectExcelBuffer,
  listImportJobs,
  stageImportPreviewJob,
} from '@/lib/services/imports';
import { exportTaxonomyWorkbookBuffer } from '@/lib/services/taxonomy';
import { handleApiError, jsonOk, ValidationError } from '@/lib/utils/api-handler';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const download = request.nextUrl.searchParams.get('download');
    if (download === 'export' || download === 'template') {
      const buf = await exportTaxonomyWorkbookBuffer();
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="XPO_Taxonomy_${download}.xlsx"`,
        },
      });
    }
    const jobs = await listImportJobs('taxonomy');
    return jsonOk({ jobs, canonicalFields: CANONICAL_TAXONOMY_FIELDS });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.action === 'confirm' && body.jobId) {
        const job = await confirmAndStartImportJob(String(body.jobId), {
          uid: session.uid,
          name: session.user.displayName,
        });
        return jsonOk({ job });
      }
      throw new ValidationError('Unsupported JSON action on taxonomy import');
    }

    const formData = await request.formData();
    const mode = String(formData.get('mode') || 'inspect');
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ValidationError('Excel workbook file (.xlsx / .xls / .csv) is required');
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    if (mode === 'inspect') {
      const inspection = inspectExcelBuffer(buffer, 'taxonomy');
      return jsonOk({
        ...inspection,
        canonicalFields: CANONICAL_TAXONOMY_FIELDS,
      });
    }

    const selectedSheet = String(formData.get('selectedSheet') || '');
    const conflictMode =
      formData.get('conflictMode') === 'skip_existing' ? 'skip_existing' : 'merge_preserve';
    const columnMapRaw = String(formData.get('columnMap') || '{}');
    const columnMap = JSON.parse(columnMapRaw) as Record<string, string>;

    const staged = await stageImportPreviewJob({
      type: 'taxonomy',
      fileName: file.name,
      buffer,
      selectedSheet,
      columnMap,
      conflictMode,
      actor: { uid: session.uid, name: session.user.displayName },
    });

    return jsonOk(staged, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
