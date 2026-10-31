import { type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET(request: NextRequest) {
  try {
    const includeInactiveParam = request.nextUrl.searchParams.get('includeInactive') === 'true';
    let includeInactive = false;
    if (includeInactiveParam) {
      const session = await getServerSession();
      includeInactive = Boolean(session?.user.isSuperadmin);
    }
    const tree = await getFullTaxonomyTree({ includeInactive });
    return jsonOk(tree);
  } catch (err) {
    return handleApiError(err);
  }
}
