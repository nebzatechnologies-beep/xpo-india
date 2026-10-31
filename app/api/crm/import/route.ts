import { NextResponse, type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  confirmAndStartImportJob,
  generateClientTemplateWorkbookBuffer,
  generateCrmTemplateWorkbookBuffer,
  generatePartnerTemplateWorkbookBuffer,
  getCanonicalFieldsForImportType,
  inspectExcelBuffer,
  listImportJobs,
  stageImportPreviewJob,
} from '@/lib/services/imports';
import { handleApiError, jsonOk, ValidationError } from '@/lib/utils/api-handler';
import type { ImportJobType } from '@/lib/types/domain';

function parseCrmImportType(raw?: string | null): ImportJobType {
  if (raw === 'client_database' || raw === 'client') return 'client_database';
  if (raw === 'partner_database' || raw === 'partner') return 'partner_database';
  return 'crm_contacts';
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const sp = request.nextUrl.searchParams;
    const download = sp.get('download');
    const typeParam = sp.get('type');
    const resolvedType = parseCrmImportType(typeParam);

    if (download === 'template') {
      if (resolvedType === 'client_database') {
        const buf = generateClientTemplateWorkbookBuffer();
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="XPO_Client_Database_Template.xlsx"',
          },
        });
      }
      if (resolvedType === 'partner_database') {
        const buf = generatePartnerTemplateWorkbookBuffer();
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="XPO_Partner_Database_Template.xlsx"',
          },
        });
      }

      const buf = generateCrmTemplateWorkbookBuffer();
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="XPO_CRM_Contacts_Template.xlsx"',
        },
      });
    }

    const jobs = await listImportJobs(typeParam ? resolvedType : undefined);
    return jsonOk({
      jobs,
      canonicalFields: getCanonicalFieldsForImportType(resolvedType),
    });
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
      throw new ValidationError('Unsupported JSON action on CRM import');
    }

    const formData = await request.formData();
    const mode = String(formData.get('mode') || 'inspect');
    const importType = parseCrmImportType(
      String(formData.get('importType') || request.nextUrl.searchParams.get('type') || '')
    );
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ValidationError('Excel workbook file (.xlsx / .xls / .csv) is required');
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    if (mode === 'inspect') {
      const inspection = inspectExcelBuffer(buffer, importType);
      return jsonOk({
        ...inspection,
        canonicalFields: getCanonicalFieldsForImportType(importType),
      });
    }

    const selectedSheet = String(formData.get('selectedSheet') || '');
    const conflictMode =
      formData.get('conflictMode') === 'skip_existing' ? 'skip_existing' : 'merge_preserve';
    const columnMapRaw = String(formData.get('columnMap') || '{}');
    const columnMap = JSON.parse(columnMapRaw) as Record<string, string>;

    const staged = await stageImportPreviewJob({
      type: importType,
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
