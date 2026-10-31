import { requireFirestore } from '@/lib/firebase/admin';
import { runStructuredAgentCompletion } from '@/lib/agent/llm-client';
import {
  extractRequirementEntitiesDeterministically,
  resolveTaxonomyFromNaturalLanguage,
} from '@/lib/agent/taxonomy-resolver';
import { resolveInstantCheckoutUrlForUser } from '@/lib/billing/entitlements';
import {
  redactClaimForClient,
  unlockPartnerForClient,
} from '@/lib/marketplace/candidate-unlocks';
import {
  requestMutualConnection,
  respondToMutualConnection,
} from '@/lib/marketplace/connections';
import { respondToLeadOffer } from '@/lib/marketplace/lead-distribution';
import { createServiceRequirement } from '@/lib/marketplace/requirements';
import { getPlatformSettings } from '@/lib/services/platform-settings';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import {
  getUserByUid,
  getUserRoleProfiles,
  updateUserAndRoleProfile,
} from '@/lib/services/users';
import { QuotaExceededError, ValidationError } from '@/lib/utils/api-handler';
import type {
  AiProviderType,
  ClientLeadClaimView,
  CrmContact,
  CustomerRole,
  LeadClaim,
  PartnerRoleProfile,
  WhatsAppLeadOffer,
  XpoUser,
} from '@/lib/types/domain';

export interface AgentRequirementDraft {
  title: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName?: string;
  skillTagIds: string[];
  specifications: string;
  workLocation: string;
  timeline: string;
  estimatedBudget: string | null;
}

export type CustomerAgentCard =
  | {
      type: 'requirement_draft';
      draft: AgentRequirementDraft;
    }
  | {
      type: 'requirement_posted';
      reqId: string;
      xpoCode: string;
      title: string;
      categoryName: string;
      workLocation: string;
      moderationStatus: string;
      matchedCount: number;
      dispatchedOffersCount: number;
    }
  | {
      type: 'responded_partners';
      claims: ClientLeadClaimView[];
      freeViewsRemaining: number;
      paidViewsRemaining: number;
      unlimitedViews: boolean;
    }
  | {
      type: 'partner_unlocked';
      claim: ClientLeadClaimView;
      alreadyUnlocked: boolean;
      remainingFreeViews: number;
      remainingPaidViews: number;
      unlimitedViews: boolean;
    }
  | {
      type: 'connection_requested';
      connectionId: string;
      xpoCode: string;
      status: string;
    }
  | {
      type: 'live_offers';
      offers: Array<{
        id: string;
        xpoCode: string;
        reqId: string;
        expiresAt: string;
        status: string;
        round: number;
      }>;
    }
  | {
      type: 'offer_claimed';
      claimId: string;
      xpoCode: string;
      remainingFreeClaims: number;
      remainingPaidClaims: number;
      unlimitedClaims: boolean;
    }
  | {
      type: 'partner_profile_updated';
      businessName: string;
      city: string;
      servicesOffered: string[];
      categoryNames: string[];
      skillNames: string[];
    }
  | {
      type: 'subscription_required';
      role: CustomerRole;
      reason: string;
      checkoutUrl: string;
      priceLabel: string;
      allowanceLabel: string;
    }
  | {
      type: 'entitlement_summary';
      role: CustomerRole;
      freeRemaining: number;
      paidRemaining: number;
      unlimited: boolean;
      hasActiveSubscription: boolean;
    };

export interface CustomerAgentActionInput {
  type:
    | 'confirm_requirement'
    | 'unlock_claim'
    | 'request_connection'
    | 'claim_offer'
    | 'decline_offer'
    | 'accept_connection'
    | 'decline_connection'
    | 'save_partner_profile';
  payload?: Record<string, unknown>;
}

export interface CustomerAgentResponse {
  reply: string;
  providerUsed: AiProviderType;
  role: CustomerRole;
  cards: CustomerAgentCard[];
  draftRequirement: AgentRequirementDraft | null;
  suggestedPrompts: string[];
}

export type CrmMissingOnboardingField =
  | 'name'
  | 'businessName'
  | 'city'
  | 'businessInfo'
  | 'servicesOffered';

/**
 * Superadmin Step 5 — CRM-Aware Automatic Registration helper:
 * Inspects an uploaded Client/Partner CRM contact and determines which fields are
 * ALREADY known vs which missing details need to be collected during WhatsApp onboarding.
 */
export function resolveMissingCrmOnboardingFields(params: {
  role: CustomerRole;
  crmContact?: CrmContact | null;
  existingUser?: XpoUser | null;
}): {
  prefilled: {
    name: string;
    businessName: string;
    city: string;
    businessInfo: string;
    servicesOffered: string[];
    categoryId: string;
    categoryName: string;
    subcategoryId: string;
  };
  missingFields: CrmMissingOnboardingField[];
} {
  const crm = params.crmContact;
  const usr = params.existingUser;

  const rawName = (crm?.contactName || usr?.displayName || '').trim();
  const isPlaceholderName =
    !rawName ||
    rawName.toLowerCase() === 'prospect' ||
    rawName.toLowerCase() === 'whatsapp user' ||
    rawName.startsWith('+');

  const name = isPlaceholderName ? '' : rawName;
  const businessName = (crm?.companyName || '').trim();
  const city = (
    crm?.city && crm.city !== 'Unspecified'
      ? crm.city
      : usr?.primaryCity && usr.primaryCity !== 'Unspecified'
        ? usr.primaryCity
        : ''
  ).trim();
  const businessInfo = (crm?.businessInfo || crm?.notes || '').trim();
  const servicesOffered = Array.isArray(crm?.servicesOffered)
    ? crm!.servicesOffered.filter(Boolean)
    : crm?.skills?.length
      ? crm.skills.filter(Boolean)
      : [];
  const categoryId = (crm?.categoryId || '').trim();
  const categoryName = (crm?.categoryName || '').trim();
  const subcategoryId = (crm?.subcategoryId || '').trim();

  const missingFields: CrmMissingOnboardingField[] = [];
  if (!name) missingFields.push('name');
  if (!businessName) missingFields.push('businessName');
  if (!city) missingFields.push('city');

  if (params.role === 'client') {
    if (!businessInfo) missingFields.push('businessInfo');
  } else {
    if (servicesOffered.length === 0 && !categoryId && !categoryName) {
      missingFields.push('servicesOffered');
    }
  }

  return {
    prefilled: {
      name,
      businessName,
      city,
      businessInfo,
      servicesOffered,
      categoryId,
      categoryName,
      subcategoryId,
    },
    missingFields,
  };
}

export async function runCustomerAgentTurn(params: {
  uid: string;
  roleOverride?: CustomerRole;
  channel: 'web' | 'whatsapp';
  message?: string;
  action?: CustomerAgentActionInput;
  draftRequirement?: Partial<AgentRequirementDraft> | null;
  appOrigin?: string;
  isSimulated?: boolean;
}): Promise<CustomerAgentResponse> {
  const db = requireFirestore();
  const [user, profiles, settings, taxonomy] = await Promise.all([
    getUserByUid(params.uid),
    getUserRoleProfiles(params.uid),
    getPlatformSettings(),
    getFullTaxonomyTree(),
  ]);

  if (!user) {
    throw new ValidationError('Authenticated XPO user account not found.');
  }

  const role: CustomerRole = user.isSuperadmin
    ? params.roleOverride || user.role
    : user.role;

  const clientSuggestions = [
    'Need a React & Next.js SaaS portal built in Bengaluru within 4 weeks',
    'Show Partners who responded to my requirements',
    'Check my free Partner view credits',
  ];

  const partnerSuggestions = [
    'Show my active 5-minute lead opportunities',
    'Update my services: CNC Turning, Sheet Metal Fabrication in Pune & Mumbai',
    'Check my remaining free lead applications',
  ];

  const defaultSuggestions = role === 'client' ? clientSuggestions : partnerSuggestions;

  // 1. Handle Direct Deterministic Action Execution (1-Click Cards / Buttons)
  if (params.action) {
    try {
      if (params.action.type === 'confirm_requirement' && role === 'client') {
        const draftPayload = (params.action.payload || params.draftRequirement || {}) as Partial<AgentRequirementDraft>;
        const resolvedTax = draftPayload.categoryId
          ? {
              category:
                taxonomy.categories.find((c) => c.id === draftPayload.categoryId) ||
                taxonomy.categories[0]!,
              subcategory: draftPayload.subcategoryId
                ? taxonomy.subcategories.find((s) => s.id === draftPayload.subcategoryId) || null
                : null,
              skillTagIds: draftPayload.skillTagIds || [],
            }
          : await resolveTaxonomyFromNaturalLanguage(
              `${draftPayload.title || ''} ${draftPayload.specifications || ''}`
            );

        const created = await createServiceRequirement({
          clientUid: params.uid,
          title: draftPayload.title || 'Business Service Requirement',
          categoryId: resolvedTax.category.id,
          subcategoryId: resolvedTax.subcategory?.id || null,
          skillTagIds: resolvedTax.skillTagIds,
          specifications:
            draftPayload.specifications || draftPayload.title || 'Submitted via XPO Agent',
          workLocation: draftPayload.workLocation || user.primaryCity || 'Pan India',
          timeline: draftPayload.timeline || 'Within 2-4 weeks',
          estimatedBudget: draftPayload.estimatedBudget || null,
          sourceChannel: params.channel,
          isSimulated: params.isSimulated,
        });

        return {
          reply:
            created.requirement.moderationStatus === 'approved'
              ? `Requirement *${created.requirement.xpoCode}* is live (100% free)! XPO matched *${created.matchedCount}* eligible Partners and dispatched *${created.dispatchedOffersCount}* priority 5-minute WhatsApp alerts.`
              : `Requirement *${created.requirement.xpoCode}* has been submitted and queued for quick moderation review before 5-minute Partner distribution.`,
          providerUsed: 'deterministic',
          role,
          cards: [
            {
              type: 'requirement_posted',
              reqId: created.requirement.id,
              xpoCode: created.requirement.xpoCode,
              title: created.requirement.title,
              categoryName: created.requirement.categoryName,
              workLocation: created.requirement.workLocation,
              moderationStatus: created.requirement.moderationStatus,
              matchedCount: created.matchedCount,
              dispatchedOffersCount: created.dispatchedOffersCount,
            },
          ],
          draftRequirement: null,
          suggestedPrompts: clientSuggestions,
        };
      }

      if (params.action.type === 'save_partner_profile' && role === 'partner') {
        const payload = params.action.payload || {};
        const { profile } = await updateUserAndRoleProfile({
          uid: params.uid,
          role: 'partner',
          userUpdates: {
            primaryCity: typeof payload.city === 'string' ? payload.city : undefined,
          },
          businessUpdates:
            typeof payload.businessName === 'string'
              ? { companyName: payload.businessName }
              : undefined,
          profileUpdates: payload,
        });
        return {
          reply: `Partner profile and capabilities updated successfully! Active categories: ${
            (profile as PartnerRoleProfile).categoryIds?.length || 0
          }.`,
          providerUsed: 'deterministic',
          role,
          cards: [],
          draftRequirement: null,
          suggestedPrompts: partnerSuggestions,
        };
      }

      if (params.action.type === 'unlock_claim' && role === 'client') {
        const claimId = String(params.action.payload?.claimId || '');
        if (!claimId) throw new ValidationError('claimId is required to unlock a Partner profile.');
        const res = await unlockPartnerForClient({
          clientUid: params.uid,
          claimId,
          sourceChannel: params.channel,
        });

        return {
          reply: res.alreadyUnlocked
            ? `Partner *${res.claim.partnerBusinessName}* was already unlocked (0 credits deducted). You can review their profile and request a direct connection.`
            : `Unlocked *${res.claim.partnerBusinessName}*! Remaining free Partner views: *${res.remainingFreeViews}*${res.unlimitedViews ? ' (Unlimited Client Plan active)' : res.remainingPaidViews > 0 ? ` + ${res.remainingPaidViews} plan views` : ''}.`,
          providerUsed: 'deterministic',
          role,
          cards: [
            {
              type: 'partner_unlocked',
              claim: res.claim,
              alreadyUnlocked: res.alreadyUnlocked,
              remainingFreeViews: res.remainingFreeViews,
              remainingPaidViews: res.remainingPaidViews,
              unlimitedViews: res.unlimitedViews,
            },
          ],
          draftRequirement: null,
          suggestedPrompts: clientSuggestions,
        };
      }

      if (params.action.type === 'request_connection' && role === 'client') {
        const claimId = String(params.action.payload?.claimId || '');
        if (!claimId) throw new ValidationError('claimId is required to request a connection.');
        const conn = await requestMutualConnection({
          claimOrApplicationId: claimId,
          initiatorUid: params.uid,
        });

        return {
          reply: `Mutual connection request sent for *${conn.sourceCode}*! Once the Partner accepts on WhatsApp or Web, XPO will release direct contact details to both sides.`,
          providerUsed: 'deterministic',
          role,
          cards: [
            {
              type: 'connection_requested',
              connectionId: conn.id,
              xpoCode: conn.sourceCode,
              status: conn.status,
            },
          ],
          draftRequirement: null,
          suggestedPrompts: clientSuggestions,
        };
      }

      if (
        (params.action.type === 'claim_offer' || params.action.type === 'decline_offer') &&
        role === 'partner'
      ) {
        const offerId = String(params.action.payload?.offerId || '');
        const capabilityNote = String(params.action.payload?.capabilityNote || '').trim() || undefined;
        if (!offerId) throw new ValidationError('offerId is required.');

        const res = await respondToLeadOffer({
          offerId,
          partnerUid: params.uid,
          action: params.action.type === 'claim_offer' ? 'claim' : 'decline',
          capabilityNote,
        });

        if (res.status === 'declined') {
          return {
            reply:
              'Opportunity declined with zero credit deduction. XPO has redirected this lead to the next eligible Partner.',
            providerUsed: 'deterministic',
            role,
            cards: [],
            draftRequirement: null,
            suggestedPrompts: partnerSuggestions,
          };
        }

        return {
          reply: `Interest submitted for *${res.claim!.xpoCode}*! Your Partner profile is now shortlisted for the Client. Remaining free starter applications: *${res.remainingFreeClaims ?? 0}*.`,
          providerUsed: 'deterministic',
          role,
          cards: [
            {
              type: 'offer_claimed',
              claimId: res.claim!.id,
              xpoCode: res.claim!.xpoCode,
              remainingFreeClaims: res.remainingFreeClaims ?? 0,
              remainingPaidClaims: res.remainingPaidClaims ?? 0,
              unlimitedClaims: Boolean(res.unlimitedClaims),
            },
          ],
          draftRequirement: null,
          suggestedPrompts: partnerSuggestions,
        };
      }

      if (
        (params.action.type === 'accept_connection' ||
          params.action.type === 'decline_connection') &&
        role === 'partner'
      ) {
        const connectionId = String(params.action.payload?.connectionId || '');
        if (!connectionId) throw new ValidationError('connectionId is required.');
        const conn = await respondToMutualConnection({
          connectionId,
          recipientUid: params.uid,
          decision: params.action.type === 'accept_connection' ? 'accepted' : 'declined',
        });

        return {
          reply:
            conn.status === 'accepted'
              ? `Connection accepted for *${conn.sourceCode}*! Client contact released: *${conn.releasedInitiatorContact?.companyName}* (${conn.releasedInitiatorContact?.phoneE164}).`
              : `Connection request for *${conn.sourceCode}* was declined.`,
          providerUsed: 'deterministic',
          role,
          cards: [],
          draftRequirement: null,
          suggestedPrompts: partnerSuggestions,
        };
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        const checkout = await resolveInstantCheckoutUrlForUser({
          uid: params.uid,
          role,
          appOrigin: params.appOrigin,
        });
        return {
          reply: `${err.message} Subscribe (${checkout.priceLabel}) to unlock ${checkout.allowanceLabel}.`,
          providerUsed: 'deterministic',
          role,
          cards: [
            {
              type: 'subscription_required',
              role,
              reason: err.message,
              checkoutUrl: checkout.checkoutUrl,
              priceLabel: checkout.priceLabel,
              allowanceLabel: checkout.allowanceLabel,
            },
          ],
          draftRequirement: null,
          suggestedPrompts: defaultSuggestions,
        };
      }
      throw err;
    }
  }

  // 2. Conversational Natural Language Turn
  const rawMessage = (params.message || '').trim();
  if (!rawMessage) {
    return {
      reply:
        role === 'client'
          ? 'Tell me what product, service, or Partner you need — I will structure your requirement, match verified Partners, and notify them in 5 minutes (100% free to post).'
          : 'Tell me the services, categories, and locations you cover, or ask to view your active 5-minute business leads.',
      providerUsed: 'deterministic',
      role,
      cards: [],
      draftRequirement: params.draftRequirement as AgentRequirementDraft | null,
      suggestedPrompts: defaultSuggestions,
    };
  }

  const lowerMsg = rawMessage.toLowerCase();

  // Quick confirmation shortcut when a Client has an active draft ("confirm", "post it", "submit", "yes")
  if (
    role === 'client' &&
    params.draftRequirement?.title &&
    params.draftRequirement?.categoryId &&
    /^(?:confirm|post|post it|submit|publish|yes|send|go ahead)\b/i.test(rawMessage)
  ) {
    return runCustomerAgentTurn({
      ...params,
      action: {
        type: 'confirm_requirement',
        payload: params.draftRequirement as Record<string, unknown>,
      },
    });
  }

  // Client conversational turn
  if (role === 'client') {
    const categorySummary = taxonomy.categories
      .map((c) => {
        const subs = taxonomy.subcategories
          .filter((s) => s.categoryId === c.id)
          .map((s) => `${s.id}:${s.name}`)
          .join(', ');
        return `${c.id} (${c.name}) -> [${subs}]`;
      })
      .join('\n');

    interface ClientNluResult {
      intent: 'post_requirement' | 'list_partners' | 'check_credits' | 'general_help';
      reply: string;
      title?: string;
      categoryId?: string;
      subcategoryId?: string | null;
      specifications?: string;
      workLocation?: string;
      timeline?: string;
      estimatedBudget?: string | null;
    }

    const { data: nlu, providerUsed } = await runStructuredAgentCompletion<ClientNluResult>({
      systemInstruction:
        `You are the XPO Client Agent. Clients post business requirements 100% free, receive interested Partners in 5 minutes, and unlock Partner profiles (${settings.subscriptions.clientFreePartnerViews} initial free Partner views, then Client Plan).\n` +
        `Available XPO Categories & Subcategories:\n${categorySummary}\n\n` +
        `Classify the Client's message into JSON with fields:\n` +
        `{"intent": "post_requirement" | "list_partners" | "check_credits" | "general_help", "reply": string, "title"?: string, "categoryId"?: string, "subcategoryId"?: string | null, "specifications"?: string, "workLocation"?: string, "timeline"?: string, "estimatedBudget"?: string | null}`,
      userPrompt:
        `Client City: ${user.primaryCity || 'India'}\n` +
        `Existing Draft: ${JSON.stringify(params.draftRequirement || null)}\n` +
        `Client Message: ${rawMessage}`,
      fallback: async () => {
        if (
          /\b(?:responded|interested|shortlist|partners|claims|candidates|who applied)\b/i.test(
            lowerMsg
          ) &&
          !/\b(?:need|looking for|require|build|hire|manufacture|supply)\b/i.test(lowerMsg)
        ) {
          return {
            intent: 'list_partners',
            reply: 'Here are the Partners who have responded to your requirements.',
          };
        }
        if (/\b(?:credit|credits|quota|plan|subscription|free views|balance)\b/i.test(lowerMsg)) {
          return {
            intent: 'check_credits',
            reply: 'Here is your current Partner profile view balance.',
          };
        }
        if (rawMessage.length < 10 && /\b(?:hi|hello|hey|help)\b/i.test(lowerMsg)) {
          return {
            intent: 'general_help',
            reply:
              'Hello! Describe the service, product, or specialist you need (including location and timeline), and I will prepare your XPO requirement immediately.',
          };
        }

        const tax = await resolveTaxonomyFromNaturalLanguage(rawMessage);
        const entities = extractRequirementEntitiesDeterministically(
          rawMessage,
          params.draftRequirement?.workLocation || user.primaryCity
        );

        return {
          intent: 'post_requirement',
          reply:
            'I have structured your requirement and matched it to the closest XPO category. Review the card below and confirm to dispatch 5-minute Partner alerts (free to post).',
          title: params.draftRequirement?.title || entities.title,
          categoryId: tax.category.id,
          subcategoryId: tax.subcategory?.id || null,
          specifications: params.draftRequirement?.specifications
            ? `${params.draftRequirement.specifications}\n${rawMessage}`
            : rawMessage,
          workLocation: entities.workLocation,
          timeline: entities.timeline,
          estimatedBudget: entities.estimatedBudget,
        };
      },
    });

    if (nlu.intent === 'list_partners') {
      const claimsSnap = await db
        .collection('lead_claims')
        .where('clientUid', '==', params.uid)
        .limit(20)
        .get();
      const redacted = claimsSnap.docs
        .map((d) => redactClaimForClient(d.data() as LeadClaim))
        .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));

      const cp = profiles.client;
      return {
        reply:
          redacted.length > 0
            ? `You have *${redacted.length}* interested Partner response(s). Locked cards protect Partner identity until you tap Unlock (1 view credit; unlock once, view forever).`
            : 'No Partners have claimed your requirements yet. Post a new requirement or give active 5-minute alerts a moment to complete.',
        providerUsed,
        role,
        cards: [
          {
            type: 'responded_partners',
            claims: redacted,
            freeViewsRemaining: cp?.freePartnerViewsRemaining ?? settings.subscriptions.clientFreePartnerViews,
            paidViewsRemaining: cp?.paidPartnerViewsRemaining ?? 0,
            unlimitedViews: Boolean(cp?.paidViewsUnlimited && cp?.activeSubscriptionId),
          },
        ],
        draftRequirement: null,
        suggestedPrompts: clientSuggestions,
      };
    }

    if (nlu.intent === 'check_credits') {
      const cp = profiles.client;
      return {
        reply: nlu.reply,
        providerUsed,
        role,
        cards: [
          {
            type: 'entitlement_summary',
            role: 'client',
            freeRemaining:
              cp?.freePartnerViewsRemaining ?? settings.subscriptions.clientFreePartnerViews,
            paidRemaining: cp?.paidPartnerViewsRemaining ?? 0,
            unlimited: Boolean(cp?.paidViewsUnlimited && cp?.activeSubscriptionId),
            hasActiveSubscription: Boolean(cp?.activeSubscriptionId),
          },
        ],
        draftRequirement: null,
        suggestedPrompts: clientSuggestions,
      };
    }

    if (nlu.intent === 'post_requirement') {
      const fallbackTax = await resolveTaxonomyFromNaturalLanguage(rawMessage);
      const validCat =
        taxonomy.categories.find((c) => c.id === nlu.categoryId) || fallbackTax.category;
      const validSub =
        (nlu.subcategoryId
          ? taxonomy.subcategories.find((s) => s.id === nlu.subcategoryId)
          : null) || fallbackTax.subcategory;

      const det = extractRequirementEntitiesDeterministically(
        rawMessage,
        params.draftRequirement?.workLocation || user.primaryCity
      );

      const draft: AgentRequirementDraft = {
        title: (nlu.title || params.draftRequirement?.title || det.title).trim(),
        categoryId: validCat.id,
        categoryName: validCat.name,
        subcategoryId: validSub?.id || null,
        subcategoryName: validSub?.name,
        skillTagIds: fallbackTax.skillTagIds,
        specifications: (nlu.specifications || rawMessage).trim(),
        workLocation: (
          nlu.workLocation ||
          params.draftRequirement?.workLocation ||
          det.workLocation
        ).trim(),
        timeline: (nlu.timeline || params.draftRequirement?.timeline || det.timeline).trim(),
        estimatedBudget:
          nlu.estimatedBudget ?? params.draftRequirement?.estimatedBudget ?? det.estimatedBudget,
      };

      return {
        reply:
          nlu.reply ||
          'Your requirement draft is ready! Confirm below to publish for free and trigger 5-minute Partner matching.',
        providerUsed,
        role,
        cards: [{ type: 'requirement_draft', draft }],
        draftRequirement: draft,
        suggestedPrompts: [
          'Confirm and post this requirement',
          'Update timeline to Urgent (within 7 days)',
        ],
      };
    }

    return {
      reply: nlu.reply,
      providerUsed,
      role,
      cards: [],
      draftRequirement: (params.draftRequirement as AgentRequirementDraft) || null,
      suggestedPrompts: clientSuggestions,
    };
  }

  // 3. Partner Conversational Turn
  interface PartnerNluResult {
    intent: 'update_profile' | 'list_offers' | 'check_credits' | 'general_help';
    reply: string;
    servicesOffered?: string[];
    operatingCities?: string[];
    capabilities?: string;
  }

  const { data: pNlu, providerUsed } = await runStructuredAgentCompletion<PartnerNluResult>({
    systemInstruction:
      `You are the XPO Partner Agent. Partners receive matching Client leads on WhatsApp, respond within 5 minutes (0 deduction on ignore/decline), get ${settings.subscriptions.partnerFreeClaims} initial free valid applications, and then subscribe to the XPO Partner Plan.\n` +
      `Classify the Partner's message into JSON:\n` +
      `{"intent": "update_profile" | "list_offers" | "check_credits" | "general_help", "reply": string, "servicesOffered"?: string[], "operatingCities"?: string[], "capabilities"?: string}`,
    userPrompt: `Partner City: ${user.primaryCity || 'India'}\nPartner Message: ${rawMessage}`,
    fallback: async () => {
      if (/\b(?:offer|offers|lead|leads|opportunities|5-min|active)\b/i.test(lowerMsg)) {
        return {
          intent: 'list_offers',
          reply: 'Checking your live 5-minute business lead opportunities.',
        };
      }
      if (/\b(?:credit|credits|quota|plan|subscription|free|applications|claims)\b/i.test(lowerMsg)) {
        return {
          intent: 'check_credits',
          reply: 'Here is your current lead application credit balance.',
        };
      }
      if (
        /\b(?:service|services|we provide|we offer|specialize|update|category|skills|fabricat|develop|design|market|install|supply|consult)\b/i.test(
          lowerMsg
        )
      ) {
        const services = rawMessage
          .replace(/^(?:update my services[:\s]*|we offer[:\s]*|i provide[:\s]*|services[:\s]*)/i, '')
          .split(/[,;/]+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 2)
          .slice(0, 8);
        const det = extractRequirementEntitiesDeterministically(rawMessage, user.primaryCity);
        return {
          intent: 'update_profile',
          reply: 'I have updated your Partner profile services, matching categories, and location.',
          servicesOffered: services.length > 0 ? services : [rawMessage.slice(0, 80)],
          operatingCities: det.workLocation ? [det.workLocation] : [user.primaryCity || 'Bengaluru'],
          capabilities: rawMessage,
        };
      }
      return {
        intent: 'general_help',
        reply:
          'Tell me what services you offer and your operating cities to upgrade your matching profile, or ask to view your active 5-minute business leads.',
      };
    },
  });

  if (pNlu.intent === 'list_offers') {
    const nowIso = new Date().toISOString();
    const offersSnap = await db
      .collection('whatsapp_lead_offers')
      .where('partnerUid', '==', params.uid)
      .where('status', 'in', ['dispatched', 'delivered'])
      .get();

    const activeOffers = offersSnap.docs
      .map((d) => d.data() as WhatsAppLeadOffer)
      .filter((o) => o.expiresAt > nowIso)
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

    return {
      reply:
        activeOffers.length > 0
          ? `You have *${activeOffers.length}* live 5-minute opportunity alert(s)! Respond before expiry — declining or ignoring deducts zero credits.`
          : 'You have no open 5-minute lead windows at this moment. Make sure your services and categories are up to date so XPO routes matching Client requirements to you.',
      providerUsed,
      role,
      cards: [
        {
          type: 'live_offers',
          offers: activeOffers.map((o) => ({
            id: o.id,
            xpoCode: o.xpoCode,
            reqId: o.reqId,
            expiresAt: o.expiresAt,
            status: o.status,
            round: o.round,
          })),
        },
      ],
      draftRequirement: null,
      suggestedPrompts: partnerSuggestions,
    };
  }

  if (pNlu.intent === 'check_credits') {
    const pp = profiles.partner;
    return {
      reply: pNlu.reply,
      providerUsed,
      role,
      cards: [
        {
          type: 'entitlement_summary',
          role: 'partner',
          freeRemaining: pp?.freeClaimsRemaining ?? settings.subscriptions.partnerFreeClaims,
          paidRemaining: pp?.paidClaimsRemaining ?? 0,
          unlimited: Boolean(pp?.paidClaimsUnlimited && pp?.activeSubscriptionId),
          hasActiveSubscription: Boolean(pp?.activeSubscriptionId),
        },
      ],
      draftRequirement: null,
      suggestedPrompts: partnerSuggestions,
    };
  }

  if (pNlu.intent === 'update_profile') {
    const tax = await resolveTaxonomyFromNaturalLanguage(rawMessage);
    const existingPartner = profiles.partner;
    const nextCategoryIds = Array.from(
      new Set([...(existingPartner?.categoryIds || []), tax.category.id])
    );
    const nextSubcategoryIds = Array.from(
      new Set([
        ...(existingPartner?.subcategoryIds || []),
        ...(tax.subcategory ? [tax.subcategory.id] : []),
      ])
    );
    const nextSectorIds = Array.from(
      new Set([...(existingPartner?.sectorIds || []), tax.sector.id])
    );
    const nextSkillTagIds = Array.from(
      new Set([...(existingPartner?.skillTagIds || []), ...tax.skillTagIds])
    );
    const nextSkillNames = Array.from(
      new Set([...(existingPartner?.skillNames || []), ...tax.matchedSkillNames])
    );
    const nextServices = Array.from(
      new Set([
        ...(existingPartner?.servicesOffered || []),
        ...(pNlu.servicesOffered || [tax.category.name]),
      ])
    ).slice(0, 15);
    const nextRegions = Array.from(
      new Set([
        ...(existingPartner?.operatingRegions || []),
        ...(pNlu.operatingCities || []),
        ...(user.primaryCity ? [user.primaryCity] : []),
      ])
    ).filter(Boolean);

    await updateUserAndRoleProfile({
      uid: params.uid,
      role: 'partner',
      profileUpdates: {
        sectorIds: nextSectorIds,
        categoryIds: nextCategoryIds,
        subcategoryIds: nextSubcategoryIds,
        skillTagIds: nextSkillTagIds,
        skillNames: nextSkillNames,
        servicesOffered: nextServices,
        operatingRegions: nextRegions,
        capabilities: pNlu.capabilities || existingPartner?.capabilities || rawMessage,
      },
    });

    const catNames = nextCategoryIds
      .map((id) => taxonomy.categories.find((c) => c.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    return {
      reply:
        pNlu.reply ||
        `Updated your Partner profile under *${tax.category.name}*. XPO will now route matching Client requirements to your WhatsApp.`,
      providerUsed,
      role,
      cards: [
        {
          type: 'partner_profile_updated',
          businessName: existingPartner?.businessName || user.displayName,
          city: nextRegions[0] || user.primaryCity || 'India',
          servicesOffered: nextServices,
          categoryNames: catNames,
          skillNames: nextSkillNames,
        },
      ],
      draftRequirement: null,
      suggestedPrompts: partnerSuggestions,
    };
  }

  return {
    reply: pNlu.reply,
    providerUsed,
    role,
    cards: [],
    draftRequirement: null,
    suggestedPrompts: partnerSuggestions,
  };
}
