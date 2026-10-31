import { requireSuperadmin } from '@/lib/auth/server-session';
import { getExecutiveDashboardAnalytics } from '@/lib/services/analytics';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET() {
  try {
    await requireSuperadmin();
    const analytics = await getExecutiveDashboardAnalytics();
    return jsonOk(analytics);
  } catch (err) {
    return handleApiError(err);
  }
}
