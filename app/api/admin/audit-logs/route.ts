import { type NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { listAuditLogs, type AuditLogEntry } from '@/lib/services/audit';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const mod = request.nextUrl.searchParams.get('module') as AuditLogEntry['module'] | null;
    const logs = await listAuditLogs({
      module: mod || undefined,
      limit: 200,
    });
    return jsonOk({ logs });
  } catch (err) {
    return handleApiError(err);
  }
}
