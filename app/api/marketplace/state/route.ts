import { NextRequest, NextResponse } from 'next/server';
import { requireFirestore } from '@/lib/firebase/admin';
import type { ClientReqItem, PartnerReply } from '@/components/creator/xpo-client-app';
import type { PartnerOpportunity, PartnerScreenId } from '@/components/absorber/xpo-partner-app';

export const dynamic = 'force-dynamic';

export interface SharedMarketplaceState {
  updatedAt: string;
  client: {
    free: number;
    plan: number;
    planOn: boolean;
    kyc: 'none' | 'pending' | 'verified' | 'rejected';
    reqs: Record<string, ClientReqItem>;
    order: string[];
    seq: number;
  };
  partner: {
    credits: number;
    plan: 'free' | 'active';
    kyc: 'none' | 'pending' | 'verified' | 'rejected';
    capabilities: string[];
    opportunities: PartnerOpportunity[];
    notifs: {
      id: string;
      text: string;
      time: string;
      unread: boolean;
      targetScreen: PartnerScreenId;
      oppId?: string;
    }[];
  };
  admin: {
    heldAction: 'none' | 'approved' | 'rejected';
    reqStatuses: Record<string, 'approved' | 'rejected' | 'pending_review' | 'paused' | 'active_matching'>;
    kycDecisions: Record<string, 'verified' | 'rejected' | 'pending' | 'none'>;
    pricing: {
      clientMonthly: number;
      partnerMonthly: number;
      freeClientViews: number;
      freePartnerReplies: number;
    };
    customReqs: {
      id: string;
      title: string;
      clientName: string;
      clientCompany: string;
      cat: string;
      city: string;
      budget: string;
      timeline: string;
      status: 'held' | 'wave1' | 'approved' | 'rejected';
      posted: string;
      desc: string;
    }[];
  };
}

function buildInitialMarketplaceState(): SharedMarketplaceState {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    client: {
      free: 4,
      plan: 0,
      planOn: false,
      kyc: 'verified',
      seq: 41230,
      order: ['r1', 'r2', 'r3', 'r4', 'r5'],
      reqs: {
        r1: {
          code: 'XPO-REQ-40971',
          title: 'E-commerce website for a 5-store retail chain',
          sector: 'Technology & Software',
          cat: 'Web & Mobile Development',
          sub: 'Full-Stack & SaaS Engineering',
          loc: 'Hyderabad',
          timeline: 'Within 2-4 Weeks',
          budget: '₹2,00,000',
          spec: 'Product catalogue for 5 stores, UPI checkout, store pickup and stock sync with our billing software.',
          posted: 'posted today, 10:42',
          status: 'interested',
          wave: 2,
          partners: [
            {
              id: 'p1',
              real: 'Klo Tech',
              masked: 'Software agency · Mumbai',
              city: 'Mumbai',
              verified: true,
              pitch:
                '"We\'ve shipped 14 D2C stores on Next.js with Razorpay and store pickup. Can start Monday."',
              tags: ['Next.js', 'Razorpay', 'Replied in 2 min'],
              details: '6 years · klotech.in · GST verified · serves Pan-India',
              phone: '+91 56794 24578',
              st: 'locked',
            },
            {
              id: 'p2',
              real: 'Srujan Digital',
              masked: 'Freelancer · Hyderabad',
              city: 'Hyderabad',
              verified: false,
              pitch:
                '"Shopify and custom apps for retail; I can show two live stores in Hyderabad."',
              tags: ['Shopify', 'Replied in 4 min'],
              details: '3 years · portfolio link on profile · phone verified',
              phone: '+91 98490 11870',
              st: 'locked',
            },
          ],
        },
        r2: {
          code: 'XPO-REQ-41208',
          title: '10,000 printed 3-ply corrugated boxes',
          sector: 'Manufacturing & Industrial Supply',
          cat: 'Industrial Packaging & Raw Materials',
          sub: 'Corrugated, Flexible & Custom Packaging',
          loc: 'Pune',
          timeline: 'Within 2-4 Weeks',
          budget: 'Quotes invited',
          spec: '3-ply, 12 x 10 x 8 in, 2-colour logo print, delivered to our Pune warehouse.',
          posted: 'posted today, 11:05',
          status: 'finding',
          wave: 1,
          partners: [],
        },
        r3: {
          code: 'XPO-REQ-41190',
          title: 'Marketing for a fantasy sports and betting app',
          sector: 'Design, Branding & Digital Growth',
          cat: 'Performance Marketing & SEO',
          sub: 'Meta, Google Ads & B2B Lead Generation',
          loc: 'Bengaluru',
          timeline: 'Immediate (Within 7 Days)',
          budget: '₹5,00,000',
          spec: 'Launch campaign across Meta and Google for an app.',
          posted: 'posted today, 09:12',
          status: 'held',
          wave: 0,
          partners: [],
        },
        r4: {
          code: 'XPO-REQ-40655',
          title: '50 kW rooftop solar for a warehouse',
          sector: 'Construction, Interiors & EPC',
          cat: 'Solar & Electrical EPC',
          sub: 'Commercial & Industrial Solar Rooftop',
          loc: 'Nagpur',
          timeline: 'Flexible / Ongoing Retainer',
          budget: '₹25,00,000',
          spec: 'Net-metered rooftop system on a 12,000 sq ft warehouse roof.',
          posted: 'posted 31 Oct',
          status: 'nomatch',
          wave: 3,
          partners: [],
        },
        r5: {
          code: 'XPO-REQ-39114',
          title: 'Company website developer',
          sector: 'Technology & Software',
          cat: 'Web & Mobile Development',
          sub: 'Full-Stack & SaaS Engineering',
          loc: 'Hyderabad',
          timeline: 'Flexible / Ongoing Retainer',
          budget: '₹40,000',
          spec: 'Five-page company website with an enquiry form.',
          posted: 'posted 28 Oct',
          status: 'closed',
          closedReason: 'Found a partner on XPO',
          wave: 1,
          partners: [
            {
              id: 'p3',
              real: 'Klo Tech',
              masked: 'Software agency · Mumbai',
              city: 'Mumbai',
              verified: true,
              pitch: '"Five-page sites in a week, with CMS."',
              tags: ['Next.js'],
              details: '6 years · klotech.in',
              phone: '+91 56794 24578',
              st: 'connected',
            },
          ],
        },
      },
    },
    partner: {
      credits: 3,
      plan: 'free',
      kyc: 'verified',
      capabilities: [
        'Web & Mobile Development',
        'Shopify & E-commerce',
        'Custom ERP & Portals',
        'UI/UX & Frontend',
        'Packaging & Printing',
      ],
      notifs: [
        {
          id: 'n1',
          text: 'Test Traders unlocked your reply on "E-commerce website for a 5-store retail chain" — confirm to share contact',
          time: '12m ago',
          unread: true,
          targetScreen: 'opp',
          oppId: 'req-1',
        },
        {
          id: 'n2',
          text: 'New Wave 1 match: "10,000 printed 3-ply corrugated boxes" in Pune',
          time: '2m ago',
          unread: true,
          targetScreen: 'opp',
          oppId: 'req-2',
        },
        {
          id: 'n3',
          text: 'Connected with Pavan (Test Traders) on "Company website developer"',
          time: '11d ago',
          unread: false,
          targetScreen: 'conn',
        },
      ],
      opportunities: [
        {
          id: 'req-1',
          ref: 'XPO-REQ-40971',
          title: 'E-commerce website for a 5-store retail chain',
          cat: 'Web & Mobile Development',
          loc: 'Hyderabad',
          when: 'Within 2-4 Weeks',
          budget: '₹2,00,000',
          posted: 'Yesterday',
          clientLabel: 'Verified retail chain · Hyderabad',
          clientName: 'Pavan',
          clientCompany: 'Test Traders',
          clientPhone: '+91 98490 00112',
          clientEmail: 'pavan@testtraders.in',
          waveBadge: 'CLIENT REQUESTED CONTACT',
          matched: true,
          brief:
            'Product catalogue for 5 stores, UPI checkout, store pickup and stock sync with our billing software.',
          myReplyStatus: 'client_requested',
          myPitch:
            "We've shipped 14 D2C stores on Next.js with Razorpay and store pickup. Can start Monday.",
          myTimeline: '3–4 weeks',
          myQuote: '₹1,85,000',
          repliedAt: 'Yesterday · 4:15 PM',
        },
        {
          id: 'req-2',
          ref: 'XPO-REQ-41208',
          title: '10,000 printed 3-ply corrugated boxes',
          cat: 'Packaging & Printing',
          loc: 'Pune',
          when: 'Within 2-4 Weeks',
          budget: 'Quotes invited',
          posted: '2 min ago',
          clientLabel: 'Verified trading business · Pune',
          clientName: 'Pavan',
          clientCompany: 'Test Traders',
          clientPhone: '+91 98490 00112',
          clientEmail: 'pavan@testtraders.in',
          waveBadge: 'WAVE 1 · NEW',
          matched: true,
          brief:
            '3-ply, 12 x 10 x 8 in, 2-colour logo print, delivered to our Pune warehouse.',
          myReplyStatus: 'none',
        },
        {
          id: 'req-3',
          ref: 'XPO-REQ-41302',
          title: 'Custom ERP & inventory sync for 12 pharmaceutical depots',
          cat: 'Web & Mobile Development',
          loc: 'Mumbai',
          when: 'Within a month',
          budget: '₹5L – ₹12L',
          posted: '18 min ago',
          clientLabel: 'Verified distributor · Mumbai',
          clientName: 'Vikram Mehta',
          clientCompany: 'MedLink Pharma Logistics',
          clientPhone: '+91 98201 44810',
          clientEmail: 'vikram@medlinkpharma.in',
          waveBadge: 'MATCHED TO YOU',
          matched: true,
          brief:
            'Need a web & mobile inventory portal connecting 12 state depots with batch-expiry tracking, GST e-invoicing API, and Tally Prime sync.',
          myReplyStatus: 'none',
        },
        {
          id: 'req-4',
          ref: 'XPO-REQ-41299',
          title: 'Shopify Plus migration & headless storefront for D2C apparel brand',
          cat: 'Web & Mobile Development',
          loc: 'Dubai, UAE',
          when: 'Right away (urgent)',
          budget: '$8,000 – $15,000',
          posted: '1 hr ago',
          clientLabel: 'Verified D2C brand · Dubai, UAE',
          clientName: 'Tariq Al-Mansoor',
          clientCompany: 'Noor Atelier LLC',
          clientPhone: '+971 50 482 9910',
          clientEmail: 'tariq@nooratelier.ae',
          waveBadge: 'OVERSEAS · USD',
          isOverseas: true,
          matched: true,
          brief:
            'Migrating from Magento to Shopify Plus with bilingual English/Arabic RTL storefront, multi-currency checkout (AED/SAR/USD), and ERP webhook integration.',
          myReplyStatus: 'sent_waiting',
          myPitch:
            'Delivered 6 Shopify Plus headless storefronts in GCC with full Arabic RTL and multi-currency checkout in 4 weeks.',
          myTimeline: '4 weeks',
          myQuote: '$9,500',
          repliedAt: '35 min ago',
        },
        {
          id: 'req-5',
          ref: 'XPO-REQ-40655',
          title: '50 kW rooftop solar for a warehouse',
          cat: 'Solar & Clean Energy',
          loc: 'Nagpur',
          when: 'Flexible / Ongoing Retainer',
          budget: '₹25,00,000',
          posted: '6 days ago',
          clientLabel: 'Verified warehouse operator · Nagpur',
          clientName: 'Pavan',
          clientCompany: 'Test Traders',
          clientPhone: '+91 98490 00112',
          clientEmail: 'pavan@testtraders.in',
          matched: false,
          brief: 'Net-metered rooftop system on a 12,000 sq ft warehouse roof.',
          myReplyStatus: 'none',
        },
        {
          id: 'req-6',
          ref: 'XPO-REQ-39114',
          title: 'Company website developer',
          cat: 'Web & Mobile Development',
          loc: 'Hyderabad',
          when: 'Completed',
          budget: '₹40,000',
          posted: '12 days ago',
          clientLabel: 'Test Traders · Hyderabad',
          clientName: 'Pavan',
          clientCompany: 'Test Traders',
          clientPhone: '+91 98490 00112',
          clientEmail: 'pavan@testtraders.in',
          matched: true,
          brief: 'Five-page company website with an enquiry form.',
          myReplyStatus: 'connected',
          myPitch: 'Five-page sites in a week, with CMS.',
          myTimeline: '1 week',
          myQuote: '₹38,000',
          repliedAt: '11 days ago',
        },
      ],
    },
    admin: {
      heldAction: 'none',
      reqStatuses: {
        'XPO-REQ-40971': 'active_matching',
        'XPO-REQ-41208': 'active_matching',
        'XPO-REQ-41190': 'pending_review',
        'XPO-REQ-40655': 'active_matching',
        'XPO-REQ-39114': 'approved',
      },
      kycDecisions: {
        client: 'verified',
        partner: 'verified',
      },
      pricing: {
        clientMonthly: 1000,
        partnerMonthly: 1500,
        freeClientViews: 4,
        freePartnerReplies: 3,
      },
      customReqs: [],
    },
  };
}

async function getOrInitMarketplaceState(): Promise<SharedMarketplaceState> {
  const db = requireFirestore();
  const docRef = db.collection('marketplace_state').doc('live');
  const snap = await docRef.get();
  if (snap.exists) {
    const data = snap.data() as SharedMarketplaceState;
    if (data && data.client && data.partner && data.admin && Array.isArray(data.client.order)) {
      return data;
    }
  }
  const initial = JSON.parse(JSON.stringify(buildInitialMarketplaceState())) as SharedMarketplaceState;
  await docRef.set(initial);
  return initial;
}

export async function GET() {
  try {
    const state = await getOrInitMarketplaceState();
    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error: any) {
    console.error('[GET /api/marketplace/state] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATE_FETCH_FAILED',
          message: error?.message || 'Failed to load marketplace state',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body || {};

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ACTION', message: 'Action is required' },
        },
        { status: 400 }
      );
    }

    const db = requireFirestore();
    const state = await getOrInitMarketplaceState();
    const now = new Date().toISOString();
    state.updatedAt = now;

    switch (action) {
      case 'client.post_requirement': {
        const key = payload?.key || payload?.reqKey;
        const reqItem = (payload?.requirement || payload?.req) as ClientReqItem | undefined;
        if (key && reqItem && reqItem.code) {
          state.client.reqs[key] = reqItem;
          if (!state.client.order.includes(key)) {
            state.client.order.unshift(key);
          }
          state.client.seq = Math.max(state.client.seq + 1, 41231);

          const isHeld = reqItem.status === 'held';
          state.admin.reqStatuses[reqItem.code] = isHeld ? 'pending_review' : 'active_matching';

          // Add to Superadmin customReqs list
          const adminReqEntry = {
            id: reqItem.code,
            title: reqItem.title,
            clientName: 'Pavan',
            clientCompany: 'Test Traders',
            cat: reqItem.cat || 'Web & Mobile Development',
            city: reqItem.loc || 'Hyderabad',
            budget: reqItem.budget || 'Quotes invited',
            timeline: reqItem.timeline || 'Within 2-4 Weeks',
            status: (isHeld ? 'held' : 'wave1') as 'held' | 'wave1',
            posted: 'just now',
            desc: reqItem.spec || reqItem.title,
          };
          const existingAdminIdx = state.admin.customReqs.findIndex((r) => r.id === reqItem.code);
          if (existingAdminIdx >= 0) {
            state.admin.customReqs[existingAdminIdx] = adminReqEntry;
          } else {
            state.admin.customReqs.unshift(adminReqEntry);
          }

          // If not held, push immediately to Partner's Wave 1 feed
          if (!isHeld) {
            const oppId = 'req-' + reqItem.code;
            const existsInPartner = state.partner.opportunities.some(
              (o) => o.ref === reqItem.code
            );
            if (!existsInPartner) {
              state.partner.opportunities.unshift({
                id: oppId,
                ref: reqItem.code,
                title: reqItem.title,
                cat: reqItem.cat || 'Web & Mobile Development',
                loc: reqItem.loc || 'Hyderabad',
                when: reqItem.timeline || 'Within 2-4 Weeks',
                budget: reqItem.budget || 'Quotes invited',
                posted: 'Just now',
                clientLabel: `Verified business · ${reqItem.loc || 'Hyderabad'}`,
                clientName: 'Pavan',
                clientCompany: 'Test Traders',
                clientPhone: '+91 98490 00112',
                clientEmail: 'pavan@testtraders.in',
                waveBadge: 'WAVE 1 · NEW',
                matched: true,
                brief: reqItem.spec || reqItem.title,
                myReplyStatus: 'none',
              });
              state.partner.notifs.unshift({
                id: 'n-' + Date.now(),
                text: `New Wave 1 match: "${reqItem.title}" in ${reqItem.loc || 'Hyderabad'} (${reqItem.code})`,
                time: 'Just now',
                unread: true,
                targetScreen: 'opp',
                oppId,
              });
            }
          }

          // Persist to Firestore requirements collection
          await db.collection('requirements').doc(reqItem.code).set(
            {
              id: reqItem.code,
              xpoCode: reqItem.code,
              referenceCode: reqItem.code,
              clientUid: 'local-superadmin',
              clientName: 'Pavan',
              clientBusinessName: 'Test Traders',
              title: reqItem.title,
              specifications: reqItem.spec || reqItem.title,
              description: reqItem.spec || reqItem.title,
              sectorName: reqItem.sector || 'Technology & Software',
              categoryName: reqItem.cat || 'Web & Mobile Development',
              workLocation: reqItem.loc || 'Hyderabad',
              city: reqItem.loc || 'Hyderabad',
              country: 'India',
              timeline: reqItem.timeline || 'Within 2-4 Weeks',
              estimatedBudget: reqItem.budget || 'Quotes invited',
              budgetLabel: reqItem.budget || 'Quotes invited',
              status: isHeld ? 'under_review' : 'active',
              moderationStatus: isHeld ? 'pending_review' : 'approved',
              distributionStatus: isHeld ? 'paused' : 'active_matching',
              interestedPartnerIds: [],
              interestedCount: 0,
              waveNumber: isHeld ? 0 : 1,
              createdAt: now,
              updatedAt: now,
            },
            { merge: true }
          );
        }
        break;
      }

      case 'client.update_requirement': {
        const { key, patch } = payload || {};
        if (key && state.client.reqs[key] && patch) {
          state.client.reqs[key] = {
            ...state.client.reqs[key],
            ...patch,
          };
          const updated = state.client.reqs[key];
          state.partner.opportunities = state.partner.opportunities.map((o) =>
            o.ref === updated.code
              ? {
                  ...o,
                  title: updated.title,
                  cat: updated.cat,
                  loc: updated.loc,
                  when: updated.timeline,
                  budget: updated.budget,
                  brief: updated.spec,
                }
              : o
          );
          await db.collection('requirements').doc(updated.code).set(
            {
              title: updated.title,
              specifications: updated.spec,
              description: updated.spec,
              workLocation: updated.loc,
              city: updated.loc,
              timeline: updated.timeline,
              estimatedBudget: updated.budget,
              budgetLabel: updated.budget,
              status: updated.status === 'closed' ? 'closed' : 'active',
              updatedAt: now,
            },
            { merge: true }
          );
        }
        break;
      }

      case 'client.update_partner_status': {
        const key = payload?.key || payload?.reqKey;
        const partnerId = payload?.partnerId;
        const st = payload?.st || (payload?.status === 'requested' ? 'waiting' : payload?.status);
        const { free, plan } = payload || {};
        if (typeof free === 'number') state.client.free = free;
        if (typeof plan === 'number') state.client.plan = plan;
        if (key && state.client.reqs[key]) {
          const r = state.client.reqs[key];
          r.partners = r.partners.map((p: PartnerReply) =>
            p.id === partnerId ? { ...p, st } : p
          );

          // If Partner is Klo Tech (p1 or p3), sync to Partner workspace
          const targetPartner = r.partners.find((p) => p.id === partnerId);
          if (
            targetPartner &&
            (partnerId === 'p1' ||
              partnerId === 'p3' ||
              targetPartner.real.toLowerCase().includes('klo tech'))
          ) {
            const partnerStatus =
              st === 'connected'
                ? 'connected'
                : st === 'declined'
                ? 'declined'
                : st === 'waiting' || st === 'unlocked'
                ? 'client_requested'
                : 'sent_waiting';

            state.partner.opportunities = state.partner.opportunities.map((o) =>
              o.ref === r.code
                ? {
                    ...o,
                    myReplyStatus: partnerStatus,
                    waveBadge:
                      partnerStatus === 'client_requested'
                        ? 'CLIENT REQUESTED CONTACT'
                        : partnerStatus === 'connected'
                        ? 'CONNECTED'
                        : o.waveBadge,
                  }
                : o
            );

            if (st === 'waiting' || st === 'unlocked') {
              const targetOpp = state.partner.opportunities.find((o) => o.ref === r.code);
              state.partner.notifs.unshift({
                id: 'n-' + Date.now(),
                text: `Test Traders unlocked your reply on "${r.title}" (${r.code}) — confirm to share contact`,
                time: 'Just now',
                unread: true,
                targetScreen: 'opp',
                oppId: targetOpp?.id || 'req-1',
              });
            }
          }

          await db
            .collection('connections')
            .doc(`${r.code}_${partnerId}`)
            .set(
              {
                id: `${r.code}_${partnerId}`,
                requirementId: r.code,
                clientUid: 'local-superadmin',
                partnerId,
                status: st,
                updatedAt: now,
              },
              { merge: true }
            );
        }
        break;
      }

      case 'client.update_account': {
        const { free, plan, planOn, kyc } = payload || {};
        if (typeof free === 'number') state.client.free = free;
        if (typeof plan === 'number') state.client.plan = plan;
        if (typeof planOn === 'boolean') state.client.planOn = planOn;
        if (kyc) {
          state.client.kyc = kyc;
          state.admin.kycDecisions.client = kyc;
        }
        await db.collection('role_profiles').doc('local-superadmin_client').set(
          {
            freePartnerViewsRemaining: state.client.free,
            paidPartnerViewsRemaining: state.client.plan,
            paidViewsUnlimited: state.client.planOn,
            verificationStatus: state.client.kyc,
            updatedAt: now,
          },
          { merge: true }
        );
        break;
      }

      case 'partner.submit_reply': {
        const oppId = payload?.oppId;
        const ref = payload?.ref || payload?.refCode;
        const { pitch, timeline, quote, credits } = payload || {};
        if (typeof credits === 'number') {
          state.partner.credits = credits;
        }
        let targetRef = ref;
        state.partner.opportunities = state.partner.opportunities.map((o) => {
          if (o.id === oppId || (ref && o.ref === ref)) {
            targetRef = o.ref;
            return {
              ...o,
              myReplyStatus: 'sent_waiting' as const,
              myPitch: pitch,
              myTimeline: timeline || '3–4 weeks',
              myQuote: quote || 'Open to discuss',
              repliedAt: 'Just now',
              waveBadge: 'REPLY SENT',
            };
          }
          return o;
        });

        // Reflect the Partner's pitch in the Client's requirement!
        if (targetRef) {
          const reqEntry = Object.entries(state.client.reqs).find(
            ([, item]) => item.code === targetRef
          );
          if (reqEntry) {
            const [reqKey, clientReq] = reqEntry;
            const formattedPitch = pitch.startsWith('"') ? pitch : `"${pitch}"`;
            const newPartnerReply: PartnerReply = {
              id: 'p1',
              real: 'Klo Tech',
              masked: 'Software agency · Hyderabad',
              city: 'Hyderabad',
              verified: state.partner.kyc === 'verified',
              pitch: formattedPitch,
              tags: [
                timeline || '3–4 weeks',
                quote || 'Quote shared',
                'Replied just now',
              ].filter(Boolean),
              details: '6 years · klotech.in · GST verified · serves Pan-India',
              phone: '+91 56794 24578',
              st: 'locked',
            };
            const existingIdx = clientReq.partners.findIndex((p) => p.id === 'p1');
            const updatedPartners =
              existingIdx >= 0
                ? clientReq.partners.map((p, idx) =>
                    idx === existingIdx ? { ...p, ...newPartnerReply } : p
                  )
                : [newPartnerReply, ...clientReq.partners];

            state.client.reqs[reqKey] = {
              ...clientReq,
              status: clientReq.status === 'finding' ? 'interested' : clientReq.status,
              partners: updatedPartners,
            };
          }

          await db
            .collection('lead_claims')
            .doc(`${targetRef}_partner-klotech`)
            .set(
              {
                id: `${targetRef}_partner-klotech`,
                requirementId: targetRef,
                partnerUid: 'partner-klotech',
                partnerName: 'Rohan Rao',
                partnerBusinessName: 'Klo Tech Pvt Ltd',
                pitch,
                quotedPrice: quote || 'Open to discuss',
                estimatedTimeline: timeline || '3–4 weeks',
                status: 'submitted',
                createdAt: now,
                updatedAt: now,
              },
              { merge: true }
            );
        }
        break;
      }

      case 'partner.respond_connection': {
        const oppId = payload?.oppId;
        const ref = payload?.ref || payload?.refCode;
        const decision = payload?.decision;
        const isAccept = decision === 'accepted' || decision === 'connected';
        let targetRef = ref;

        state.partner.opportunities = state.partner.opportunities.map((o) => {
          if (o.id === oppId || (ref && o.ref === ref)) {
            targetRef = o.ref;
            return {
              ...o,
              myReplyStatus: isAccept ? ('connected' as const) : ('declined' as const),
              waveBadge: isAccept ? 'CONNECTED' : undefined,
            };
          }
          return o;
        });

        if (targetRef) {
          const reqEntry = Object.entries(state.client.reqs).find(
            ([, item]) => item.code === targetRef
          );
          if (reqEntry) {
            const [reqKey, clientReq] = reqEntry;
            state.client.reqs[reqKey] = {
              ...clientReq,
              partners: clientReq.partners.map((p) =>
                p.id === 'p1'
                  ? { ...p, st: isAccept ? 'connected' : 'declined' }
                  : p
              ),
            };
          }

          await db
            .collection('connections')
            .doc(`${targetRef}_p1`)
            .set(
              {
                id: `${targetRef}_p1`,
                requirementId: targetRef,
                clientUid: 'local-superadmin',
                partnerUid: 'partner-klotech',
                status: isAccept ? 'accepted' : 'declined',
                updatedAt: now,
              },
              { merge: true }
            );
        }
        break;
      }

      case 'partner.update_account': {
        const { credits, plan, kyc, capabilities } = payload || {};
        if (typeof credits === 'number') state.partner.credits = credits;
        if (plan === 'free' || plan === 'active') state.partner.plan = plan;
        if (kyc) {
          state.partner.kyc = kyc;
          state.admin.kycDecisions.partner = kyc;
        }
        if (Array.isArray(capabilities)) {
          state.partner.capabilities = capabilities;
        }
        await db.collection('role_profiles').doc('partner-klotech_partner').set(
          {
            freeClaimsRemaining: state.partner.credits,
            paidClaimsUnlimited: state.partner.plan === 'active',
            verificationStatus: state.partner.kyc,
            serviceCategories: state.partner.capabilities,
            updatedAt: now,
          },
          { merge: true }
        );
        break;
      }

      case 'admin.moderate_requirement': {
        const { reqId, decision } = payload || {};
        const targetCode = reqId || 'XPO-REQ-41190';
        const isApproved = decision === 'approved';

        if (targetCode === 'XPO-REQ-41190') {
          state.admin.heldAction = isApproved ? 'approved' : 'rejected';
        }
        state.admin.reqStatuses[targetCode] = isApproved ? 'active_matching' : 'rejected';
        state.admin.customReqs = state.admin.customReqs.map((cr) =>
          cr.id === targetCode
            ? { ...cr, status: isApproved ? 'wave1' : 'rejected' }
            : cr
        );

        const reqEntry = Object.entries(state.client.reqs).find(
          ([, item]) => item.code === targetCode
        );
        if (reqEntry) {
          const [reqKey, clientReq] = reqEntry;
          state.client.reqs[reqKey] = {
            ...clientReq,
            status: isApproved ? 'finding' : 'rejected',
            wave: isApproved ? 1 : 0,
          };

          // If approved, push to Partner's Wave 1 feed
          if (isApproved) {
            const existsInPartner = state.partner.opportunities.some(
              (o) => o.ref === targetCode
            );
            if (!existsInPartner) {
              const newOppId = 'req-' + targetCode;
              state.partner.opportunities.unshift({
                id: newOppId,
                ref: targetCode,
                title: clientReq.title,
                cat: clientReq.cat || 'Performance Marketing & SEO',
                loc: clientReq.loc || 'Bengaluru',
                when: clientReq.timeline || 'Immediate (Within 7 Days)',
                budget: clientReq.budget || '₹5,00,000',
                posted: 'Just now',
                clientLabel: `Verified business · ${clientReq.loc || 'Bengaluru'}`,
                clientName: 'Pavan',
                clientCompany: 'Test Traders',
                clientPhone: '+91 98490 00112',
                clientEmail: 'pavan@testtraders.in',
                waveBadge: 'WAVE 1 · NEW',
                matched: true,
                brief: clientReq.spec || clientReq.title,
                myReplyStatus: 'none',
              });
              state.partner.notifs.unshift({
                id: 'n-' + Date.now(),
                text: `New Wave 1 match: "${clientReq.title}" in ${clientReq.loc} (${targetCode})`,
                time: 'Just now',
                unread: true,
                targetScreen: 'opp',
                oppId: newOppId,
              });
            }
          }
        }

        await db
          .collection('requirements')
          .doc(targetCode)
          .set(
            {
              status: isApproved ? 'active' : 'rejected',
              moderationStatus: isApproved ? 'approved' : 'rejected',
              distributionStatus: isApproved ? 'active_matching' : 'closed',
              waveNumber: isApproved ? 1 : 0,
              updatedAt: now,
            },
            { merge: true }
          );
        break;
      }

      case 'admin.verify_kyc': {
        const targetRole = payload?.targetRole || payload?.role;
        const decision = payload?.decision;
        if (targetRole === 'client') {
          state.client.kyc = decision;
          state.admin.kycDecisions.client = decision;
        } else if (targetRole === 'partner') {
          state.partner.kyc = decision;
          state.admin.kycDecisions.partner = decision;
        }
        break;
      }

      case 'admin.update_pricing': {
        const { clientMonthly, partnerMonthly, freeClientViews, freePartnerReplies } =
          payload || {};
        state.admin.pricing = {
          clientMonthly:
            typeof clientMonthly === 'number'
              ? clientMonthly
              : state.admin.pricing.clientMonthly,
          partnerMonthly:
            typeof partnerMonthly === 'number'
              ? partnerMonthly
              : state.admin.pricing.partnerMonthly,
          freeClientViews:
            typeof freeClientViews === 'number'
              ? freeClientViews
              : state.admin.pricing.freeClientViews,
          freePartnerReplies:
            typeof freePartnerReplies === 'number'
              ? freePartnerReplies
              : state.admin.pricing.freePartnerReplies,
        };
        break;
      }

      case 'reset': {
        const fresh = JSON.parse(JSON.stringify(buildInitialMarketplaceState())) as SharedMarketplaceState;
        await db.collection('marketplace_state').doc('live').set(fresh);
        return NextResponse.json({ success: true, data: fresh });
      }
    }

    const cleanState = JSON.parse(JSON.stringify(state)) as SharedMarketplaceState;
    await db.collection('marketplace_state').doc('live').set(cleanState);

    return NextResponse.json({
      success: true,
      data: cleanState,
    });
  } catch (error: any) {
    console.error('[POST /api/marketplace/state] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATE_UPDATE_FAILED',
          message: error?.message || 'Failed to update marketplace state',
        },
      },
      { status: 500 }
    );
  }
}
