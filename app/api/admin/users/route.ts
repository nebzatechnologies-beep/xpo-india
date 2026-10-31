import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import { getFirebaseAdmin, requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { adjustCustomerQuotaByAdmin, normalizeCustomerRole } from '@/lib/services/users';
import { handleApiError, jsonOk, NotFoundError } from '@/lib/utils/api-handler';
import type { AnyRoleProfile, CustomerRole, XpoUser } from '@/lib/types/domain';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const db = requireFirestore();
    const roleFilter = request.nextUrl.searchParams.get('role') as CustomerRole | null;
    const search = request.nextUrl.searchParams.get('search')?.toLowerCase();

    const [usersSnap, profsSnap] = await Promise.all([
      db.collection('users').orderBy('createdAt', 'desc').limit(300).get(),
      db.collection('role_profiles').get(),
    ]);

    const profsByUid = new Map<string, AnyRoleProfile[]>();
    for (const d of profsSnap.docs) {
      const p = d.data() as AnyRoleProfile;
      if (p.role !== 'client' && p.role !== 'partner') continue;
      const list = profsByUid.get(p.uid) || [];
      list.push(p);
      profsByUid.set(p.uid, list);
    }

    let users = usersSnap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        const role = normalizeCustomerRole(
          (raw.role as string) || (raw.activeRole as string) || undefined
        );
        return {
          ...(raw as unknown as XpoUser),
          role,
          activeRole: role,
          enabledRoles: [role],
        };
      })
      .filter((u) => !u.uid.startsWith('sim_usr_'));

    if (roleFilter === 'client' || roleFilter === 'partner') {
      users = users.filter((u) => u.role === roleFilter);
    }
    if (search) {
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search) ||
          u.phoneE164.includes(search) ||
          (u.email && u.email.toLowerCase().includes(search)) ||
          u.primaryCity.toLowerCase().includes(search)
      );
    }

    return jsonOk({
      users: users.map((u) => ({
        ...u,
        roleProfiles: profsByUid.get(u.uid) || [],
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchUserSchema = z.object({
  uid: z.string().min(1),
  status: z.enum(['active', 'suspended']).optional(),
  isSuperadmin: z.boolean().optional(),
  // Partner quota overrides
  adjustPartnerFreeClaims: z.number().min(0).optional(),
  adjustPartnerPaidClaims: z.number().min(0).optional(),
  adjustPartnerUnlimited: z.boolean().optional(),
  // Client quota overrides
  adjustClientFreeViews: z.number().min(0).optional(),
  adjustClientPaidViews: z.number().min(0).optional(),
  adjustClientUnlimited: z.boolean().optional(),
  quotaReason: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = patchUserSchema.parse(await request.json());
    const db = requireFirestore();
    const userRef = db.collection('users').doc(body.uid);
    const snap = await userRef.get();
    if (!snap.exists) throw new NotFoundError('User not found');

    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = { updatedAt: nowIso };
    if (body.status) patch.status = body.status;
    if (body.isSuperadmin !== undefined) patch.isSuperadmin = body.isSuperadmin;
    await userRef.set(patch, { merge: true });

    if (body.isSuperadmin !== undefined) {
      const { auth } = getFirebaseAdmin();
      if (auth) {
        try {
          const existingRecord = await auth.getUser(body.uid);
          await auth.setCustomUserClaims(body.uid, {
            ...(existingRecord.customClaims || {}),
            superadmin: body.isSuperadmin,
          });
        } catch {
          // Non-fatal for demo/simulated UIDs without a Firebase Auth record
        }
      }
    }

    if (
      body.adjustPartnerFreeClaims !== undefined ||
      body.adjustPartnerPaidClaims !== undefined ||
      body.adjustPartnerUnlimited !== undefined
    ) {
      await adjustCustomerQuotaByAdmin({
        uid: body.uid,
        role: 'partner',
        freeRemaining: body.adjustPartnerFreeClaims,
        paidRemaining: body.adjustPartnerPaidClaims,
        unlimited: body.adjustPartnerUnlimited,
        reason: body.quotaReason,
        actor: { uid: session.uid, name: session.user.displayName },
      });
    }

    if (
      body.adjustClientFreeViews !== undefined ||
      body.adjustClientPaidViews !== undefined ||
      body.adjustClientUnlimited !== undefined
    ) {
      await adjustCustomerQuotaByAdmin({
        uid: body.uid,
        role: 'client',
        freeRemaining: body.adjustClientFreeViews,
        paidRemaining: body.adjustClientPaidViews,
        unlimited: body.adjustClientUnlimited,
        reason: body.quotaReason,
        actor: { uid: session.uid, name: session.user.displayName },
      });
    }

    await recordAuditLog({
      actorUid: session.uid,
      actorName: session.user.displayName,
      actorRole: 'superadmin',
      module: 'users',
      action: 'user.admin_updated',
      targetType: 'user',
      targetId: body.uid,
      summary: `Superadmin updated user ${body.uid}`,
      metadata: body as Record<string, unknown>,
    });

    return jsonOk({ user: (await userRef.get()).data() });
  } catch (err) {
    return handleApiError(err);
  }
}
