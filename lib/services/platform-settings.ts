import { requireFirestore } from '@/lib/firebase/admin';
import type { PlatformSettingsBundle } from '@/lib/types/domain';
import { recordAuditLog } from './audit';

const SETTINGS_DOC_PATH = 'platform_settings/bundle';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsBundle = {
  roles: {
    clientEnabled: true,
    partnerEnabled: true,
  },
  leadDistribution: {
    partnersPerRound: 3,
    responseWindowSeconds: 300, // 5 minutes
    interestedPartnerTarget: 3,
    clockStartPolicy: 'on_delivered_with_60s_fallback',
    deliveryFallbackSeconds: 60,
    duplicateOffersPermitted: false,
    deductOnExpired: false,
    deductOnDeclined: false,
    deductOnClaim: 1,
    maxNotificationRetries: 3,
  },
  subscriptions: {
    partnerFreeClaims: 5,
    partnerPaidMonthlyClaims: 30,
    partnerPlanUnlimited: false,
    partnerInrMonthlyPrice: 299,
    partnerUsdMonthlyPrice: 9.99,
    clientFreePartnerViews: 5,
    clientPaidMonthlyPartnerViews: 30,
    clientPlanUnlimited: false,
    clientInrMonthlyPrice: 299,
    clientUsdMonthlyPrice: 9.99,
    unusedPaidAllowanceRollover: false,
    clientFreeDailyRequirementLimit: 20,
    gstPercentInr: 18,
    cancellationPolicySummary:
      'Cancel AutoPay anytime before the next billing cycle. Active monthly allowances remain usable until the end of the current paid period; unused monthly allowances do not roll over unless enabled by Superadmin.',
  },
  moderation: {
    autoApproveCleanRequirements: true,
    requirePartnerKycForClaims: false,
    launchGeographyScope: 'india_and_global',
    blockedKeywords: [
      'crypto doubling',
      'mlm scheme',
      'advance registration fee',
      'illegal',
      'betting',
      'gambling',
    ],
  },
  updatedAt: new Date(0).toISOString(),
};

export async function getPlatformSettings(): Promise<PlatformSettingsBundle> {
  const db = requireFirestore();
  const ref = db.doc(SETTINGS_DOC_PATH);
  const snap = await ref.get();

  if (!snap.exists) {
    const seeded: PlatformSettingsBundle = {
      ...DEFAULT_PLATFORM_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
    await ref.set(seeded, { merge: true });
    return seeded;
  }

  const data = snap.data() as Partial<PlatformSettingsBundle>;
  return {
    roles: {
      clientEnabled:
        typeof data.roles?.clientEnabled === 'boolean'
          ? data.roles.clientEnabled
          : DEFAULT_PLATFORM_SETTINGS.roles.clientEnabled,
      partnerEnabled:
        typeof data.roles?.partnerEnabled === 'boolean'
          ? data.roles.partnerEnabled
          : DEFAULT_PLATFORM_SETTINGS.roles.partnerEnabled,
    },
    leadDistribution: {
      ...DEFAULT_PLATFORM_SETTINGS.leadDistribution,
      ...(data.leadDistribution || {}),
    },
    subscriptions: {
      ...DEFAULT_PLATFORM_SETTINGS.subscriptions,
      ...(data.subscriptions || {}),
    },
    moderation: {
      autoApproveCleanRequirements:
        typeof data.moderation?.autoApproveCleanRequirements === 'boolean'
          ? data.moderation.autoApproveCleanRequirements
          : DEFAULT_PLATFORM_SETTINGS.moderation.autoApproveCleanRequirements,
      requirePartnerKycForClaims:
        typeof data.moderation?.requirePartnerKycForClaims === 'boolean'
          ? data.moderation.requirePartnerKycForClaims
          : DEFAULT_PLATFORM_SETTINGS.moderation.requirePartnerKycForClaims,
      launchGeographyScope:
        data.moderation?.launchGeographyScope ||
        DEFAULT_PLATFORM_SETTINGS.moderation.launchGeographyScope,
      blockedKeywords: Array.isArray(data.moderation?.blockedKeywords)
        ? data.moderation.blockedKeywords
        : DEFAULT_PLATFORM_SETTINGS.moderation.blockedKeywords,
    },
    updatedAt: data.updatedAt || DEFAULT_PLATFORM_SETTINGS.updatedAt,
  };
}

export async function updatePlatformSettings(
  updates: Partial<{
    roles: Partial<PlatformSettingsBundle['roles']>;
    leadDistribution: Partial<PlatformSettingsBundle['leadDistribution']>;
    subscriptions: Partial<PlatformSettingsBundle['subscriptions']>;
    moderation: Partial<PlatformSettingsBundle['moderation']>;
  }>,
  actor: { uid: string; name: string }
): Promise<PlatformSettingsBundle> {
  const db = requireFirestore();
  const current = await getPlatformSettings();

  const merged: PlatformSettingsBundle = {
    roles: { ...current.roles, ...(updates.roles || {}) },
    leadDistribution: { ...current.leadDistribution, ...(updates.leadDistribution || {}) },
    subscriptions: { ...current.subscriptions, ...(updates.subscriptions || {}) },
    moderation: { ...current.moderation, ...(updates.moderation || {}) },
    updatedAt: new Date().toISOString(),
  };

  await db.doc(SETTINGS_DOC_PATH).set(merged, { merge: true });

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'settings',
    action: 'platform_settings.updated',
    targetType: 'platform_settings',
    targetId: 'bundle',
    summary: 'Updated XPO runtime platform settings & subscription quota rules',
    metadata: updates as Record<string, unknown>,
  });

  return merged;
}
