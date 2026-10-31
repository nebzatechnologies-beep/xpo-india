import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET() {
  try {
    const tree = await getFullTaxonomyTree({ includeInactive: false });
    return jsonOk(tree);
  } catch (err) {
    return handleApiError(err);
  }
}
