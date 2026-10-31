import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession, requireAuth } from '@/lib/auth/server-session';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getUserRoleProfiles, updateUserAndRoleProfile } from '@/lib/services/users';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET() {
  try {
    const session = await getServerSession();
    const settings = await getPlatformSettings();

    if (!session) {
      return jsonOk({
        authenticated: false,
        user: null,
        profiles: { client: null, partner: null },
        settings,
      });
    }

    const profiles = await getUserRoleProfiles(session.uid);
    return jsonOk({
      authenticated: true,
      user: session.user,
      profiles,
      settings,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchMeSchema = z.object({
  action: z.literal('update_profile').optional(),
  role: z.enum(['client', 'partner']),
  userUpdates: z
    .object({
      displayName: z.string().optional(),
      primaryCity: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phoneRaw: z.string().optional(),
      confirmedCountry: z.string().optional(),
    })
    .optional(),
  profileUpdates: z.record(z.unknown()).optional(),
  businessUpdates: z
    .object({
      companyName: z.string().optional(),
      registrationNumber: z.string().optional(),
      industrySectorId: z.string().optional(),
      industryName: z.string().optional(),
      website: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      businessInfo: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = patchMeSchema.parse(await request.json());

    const { user } = await updateUserAndRoleProfile({
      uid: session.uid,
      role: body.role,
      userUpdates: body.userUpdates,
      profileUpdates: body.profileUpdates,
      businessUpdates: body.businessUpdates,
    });
    const profiles = await getUserRoleProfiles(session.uid);
    return jsonOk({ user, profiles });
  } catch (err) {
    return handleApiError(err);
  }
}
