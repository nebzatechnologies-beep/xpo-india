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
    memberKycMap?: Record<string, 'Verified' | 'In review' | 'Pending'>;
    contactStageMap?: Record<string, 'Uploaded' | 'Invited' | 'Registered'>;
    importedContactsCount?: number;
    pricing: {
      clientMonthly: number;
      clientUsdMonthly?: number;
      clientMonthlyViews?: number;
      freeClientViews: number;
      clientAutoPay?: boolean;
      clientRollover?: boolean;
      partnerMonthly: number;
      partnerUsdMonthly?: number;
      partnerMonthlyReplies?: number;
      freePartnerReplies: number;
      partnerAutoPay?: boolean;
      partnerRollover?: boolean;
    };
    waveRules?: {
      partnersPerRound: number;
      responseWindowSeconds: number;
      targetClaims: number;
      deliveryFallbackSeconds: number;
    };
    whatsappAutomation?: {
      autoPaused: boolean;
      intakeMode: 'smart_one_shot' | 'step_by_step';
      autoHoldFlagged: boolean;
      flaggedKeywords: string[];
      welcomeGreeting: string;
      waveAlertHeader: string;
      clientWaState: string;
      partnerWaState: string;
      pausedConvos: Record<string, boolean>;
      coordinatorMessages: {
        id: string;
        target: 'client' | 'partner';
        convoId?: string;
        senderName: string;
        text: string;
        time: string;
      }[];
      customSynonyms: {
        word: string;
        category: string;
        addedAt: string;
      }[];
      ignoredUnmappedWords: string[];
      smartFeatures: Record<string, boolean>;
      globalKeywords: {
        word: string;
        does: string;
        reply: string;
        enabled: boolean;
        lock?: boolean;
      }[];
      rules: {
        hi: string;
        lo: string;
        misses: string;
        hours: string;
        promise: string;
        quiet: string;
        rate: string;
        retries: string;
        hold: string;
        exp: string;
        indiaGateway: string;
      };
    };
    siteCms?: {
      sections: { k: string; label: string; note: string; on: boolean; lock?: boolean }[];
      hero: {
        client: { l1: string; l2: string; sub: string; ph: string };
        partner: { l1: string; l2: string; sub: string; ph: string };
      };
      faqs: { id: string; q: string; a: string }[];
      history: { w: string; who: string; what: string }[];
    };
    gateways?: {
      razorpayKeyId: string;
      paypalClientId: string;
      metaPhoneNumberId: string;
      metaWabaId: string;
      metaVerifyToken: string;
      metaDisplayPhone: string;
    };
    auditLogs?: {
      ts: string;
      op: string;
      act: string;
      cat: string;
    }[];
    customSubcategories?: {
      sectorName: string;
      catName: string;
      subName: string;
      partnersCount: number;
      keywords: string;
      synonyms: string;
    }[];
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
      memberKycMap: {},
      contactStageMap: {},
      importedContactsCount: 0,
      pricing: {
        clientMonthly: 299,
        clientUsdMonthly: 9.99,
        clientMonthlyViews: 30,
        freeClientViews: 5,
        clientAutoPay: true,
        clientRollover: false,
        partnerMonthly: 999,
        partnerUsdMonthly: 19.99,
        partnerMonthlyReplies: 50,
        freePartnerReplies: 3,
        partnerAutoPay: true,
        partnerRollover: false,
      },
      waveRules: {
        partnersPerRound: 3,
        responseWindowSeconds: 300,
        targetClaims: 3,
        deliveryFallbackSeconds: 60,
      },
      whatsappAutomation: {
        autoPaused: false,
        intakeMode: 'smart_one_shot',
        autoHoldFlagged: true,
        flaggedKeywords: ['betting', 'gambling', 'casino', 'crypto', 'adult', 'advance fee', 'hawala'],
        welcomeGreeting:
          'Hello *{name}*! Welcome to *XPO India* — Verified B2B Requirements & 5-Minute Partner Matching with 0% Commission.',
        waveAlertHeader: '⚡ NEW WAVE 1 LEAD · 5 MIN RESPONSE WINDOW',
        clientWaState: 'ACTIVE',
        partnerWaState: 'OFFER_SENT',
        pausedConvos: { W70003: true },
        coordinatorMessages: [],
        customSynonyms: [
          { word: 'box printing', category: 'Industrial Packaging & Raw Materials', addedAt: '2 Nov' },
        ],
        ignoredUnmappedWords: [],
        smartFeatures: {
          voice_notes: true,
          photos_ocr: true,
          compare_cards: true,
          one_tap_links: true,
          no_double_pings: true,
          evening_digest: true,
          tailored_pitches: true,
          deal_checkin: true,
        },
        globalKeywords: [
          {
            word: 'STOP',
            does: 'Pauses bot immediately, unsubscribes number and marks do-not-contact',
            reply: 'You have been unsubscribed from XPO India. Reply START anytime to resume.',
            enabled: true,
            lock: true,
          },
          {
            word: 'HELP',
            does: 'Gives coordinator contact number and WhatsApp support desk link',
            reply: 'XPO Help Desk: Call/WhatsApp +91 98200 12345 or reply to this chat with your query.',
            enabled: true,
          },
          {
            word: 'RESET',
            does: 'Clears current draft requirement and restarts fresh prompt',
            reply: 'Starting fresh. What service or material do you need across India?',
            enabled: true,
          },
          {
            word: 'MENU',
            does: 'Shows quick links to Post Requirement, Partner Directory, and My Requests',
            reply: '1. Post free requirement\n2. View active leads\n3. Talk to coordinator',
            enabled: true,
          },
          {
            word: 'AGENT',
            does: 'Pauses bot and escalates to human coordinator queue',
            reply: 'Connecting you to an XPO coordinator right now. Hold on a moment.',
            enabled: true,
          },
        ],
        rules: {
          hi: '88',
          lo: '60',
          misses: '2',
          hours: '09:00 – 20:00 IST (Mon – Sat)',
          promise: 'Under 10 minutes during work hours',
          quiet: '21:00 – 09:00 local time',
          rate: '500',
          retries: '3',
          hold: '10',
          exp: '30',
          indiaGateway: 'Razorpay',
        },
      },
      siteCms: {
        sections: [
          { k: 'hero', label: 'Hero & requirement box', note: 'Always shown at top of page', on: true, lock: true },
          { k: 'trust', label: 'Trust strip (0% commission · 5-min wave)', note: '4 highlight badges under the hero', on: true },
          { k: 'how', label: 'How XPO works (3 steps)', note: 'Side-by-side steps for Clients & Partners', on: true },
          { k: 'cats', label: 'Popular categories grid', note: 'Top 12 categories from the 4-tier taxonomy', on: true },
          { k: 'plans', label: 'Transparent pricing cards', note: 'Free tier + ₹299 Client / ₹999 Partner plans', on: true },
          { k: 'wa', label: 'WhatsApp-first preview', note: 'Interactive preview of WhatsApp notifications', on: true },
          { k: 'faq', label: 'Frequently asked questions', note: 'Expandable FAQ list', on: true },
        ],
        hero: {
          client: {
            l1: 'Tell us what your business needs.',
            l2: 'Hear from verified partners in minutes.',
            sub: 'Post for free on the web or on WhatsApp. Up to 3 matched partners respond in each 5-minute wave — you choose who to connect with.',
            ph: 'e.g. 10,000 printed 3-ply corrugated boxes in Pune within 2 weeks',
          },
          partner: {
            l1: 'Real client requirements in your categories,',
            l2: 'sent to your WhatsApp.',
            sub: 'No bidding wars or cold directories. Get 5-minute lead alerts matched to your trade and city. Your first 3 replies are free.',
            ph: 'e.g. Corrugated box manufacturer · Chakan, Pune',
          },
        },
        faqs: [
          {
            id: 'F1',
            q: 'Does XPO take a commission on deals?',
            a: 'No. XPO charges zero commission on deals. Clients and partners agree on scope, price and payment terms directly.',
          },
          {
            id: 'F2',
            q: 'How does the 5-minute partner wave work?',
            a: 'Each approved requirement is sent to 3 matched partners at a time. They have 5 minutes to express interest before the next wave of 3 is notified.',
          },
          {
            id: 'F3',
            q: 'When are phone numbers shared?',
            a: 'Phone numbers stay masked until the client unlocks a partner profile AND the partner accepts the connection request.',
          },
          {
            id: 'F4',
            q: 'Do I need to install an app to use XPO?',
            a: 'No. Both clients and partners can post requirements, receive lead alerts, reply and connect entirely on WhatsApp or on xpoindia.com.',
          },
        ],
        history: [
          { w: '2 Nov, 18:40', who: 'XPO Superadmin', what: 'Added FAQ on overseas use' },
          { w: '28 Oct, 11:05', who: 'XPO Superadmin', what: 'New hero copy for partners' },
        ],
      },
      gateways: {
        razorpayKeyId: 'rzp_live_9482019481',
        paypalClientId: 'AY7k8194_live_client',
        metaPhoneNumberId: '104928172948201',
        metaWabaId: '918274019284710',
        metaVerifyToken: 'xpo_india_webhook_secret_2026',
        metaDisplayPhone: '+91 40 4917 2200',
      },
      auditLogs: [
        { ts: 'Today, 11:42', op: 'Pavan (Superadmin)', act: 'Reviewed XPO-REQ-40971 wave 2', cat: 'Moderation' },
        { ts: 'Today, 10:18', op: 'Pavan (Superadmin)', act: 'Opened KYC review for Shree Packaging', cat: 'Members' },
        { ts: 'Today, 09:12', op: 'System Automations', act: 'Held XPO-REQ-41190 on keyword "betting"', cat: 'Safety' },
        { ts: 'Yesterday, 17:05', op: 'Pavan (Superadmin)', act: 'Exported 185 contacts to CSV', cat: 'Contacts' },
        { ts: '28 Oct, 14:20', op: 'Pavan (Superadmin)', act: 'Updated Partner Pro pricing in INR', cat: 'Billing' },
      ],
      customSubcategories: [],
      customReqs: [],
    },
  };
}

async function getOrInitMarketplaceState(): Promise<SharedMarketplaceState> {
  const db = requireFirestore();
  const docRef = db.collection('marketplace_state').doc('live');
  const snap = await docRef.get();
  const defaults = buildInitialMarketplaceState();
  if (snap.exists) {
    const data = snap.data() as SharedMarketplaceState;
    if (data && data.client && data.partner && data.admin && Array.isArray(data.client.order)) {
      // Backfill any newly added admin fields on existing Firestore document
      data.admin.memberKycMap = data.admin.memberKycMap || {};
      data.admin.contactStageMap = data.admin.contactStageMap || {};
      data.admin.importedContactsCount = data.admin.importedContactsCount || 0;
      data.admin.waveRules = { ...defaults.admin.waveRules!, ...(data.admin.waveRules || {}) };
      data.admin.whatsappAutomation = {
        ...defaults.admin.whatsappAutomation!,
        ...(data.admin.whatsappAutomation || {}),
        rules: {
          ...defaults.admin.whatsappAutomation!.rules,
          ...(data.admin.whatsappAutomation?.rules || {}),
        },
        smartFeatures: {
          ...defaults.admin.whatsappAutomation!.smartFeatures,
          ...(data.admin.whatsappAutomation?.smartFeatures || {}),
        },
      };
      data.admin.siteCms = data.admin.siteCms || defaults.admin.siteCms;
      data.admin.gateways = { ...defaults.admin.gateways!, ...(data.admin.gateways || {}) };
      data.admin.auditLogs =
        Array.isArray(data.admin.auditLogs) && data.admin.auditLogs.length > 0
          ? data.admin.auditLogs
          : defaults.admin.auditLogs;
      data.admin.customSubcategories = data.admin.customSubcategories || [];
      return data;
    }
  }
  const initial = JSON.parse(JSON.stringify(defaults)) as SharedMarketplaceState;
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
        const safePitch = String(pitch || payload?.note || 'Interested in delivering this requirement with full QA.');
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
              myPitch: safePitch,
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
            const formattedPitch = safePitch.startsWith('"') ? safePitch : `"${safePitch}"`;
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
        const memberId = payload?.memberId;
        const memberName = payload?.memberName || 'Member';
        if (targetRole === 'client') {
          state.client.kyc = decision;
          state.admin.kycDecisions.client = decision;
        } else if (targetRole === 'partner') {
          state.partner.kyc = decision;
          state.admin.kycDecisions.partner = decision;
        }
        if (memberId) {
          state.admin.memberKycMap = state.admin.memberKycMap || {};
          state.admin.memberKycMap[memberId] =
            decision === 'verified' ? 'Verified' : decision === 'rejected' ? 'Pending' : 'In review';
        }
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `${decision === 'verified' ? 'Verified' : 'Rejected'} KYC for ${memberName}`,
            cat: 'Members',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.collection('audit_logs').add({
          actorName: 'Pavan (Superadmin)',
          actorRole: 'superadmin',
          module: 'verification',
          action: `kyc.${decision}`,
          targetId: memberId || targetRole,
          summary: `${decision === 'verified' ? 'Verified' : 'Rejected'} KYC for ${memberName}`,
          createdAt: now,
        });
        break;
      }

      case 'admin.update_pricing': {
        const {
          clientMonthly,
          clientUsdMonthly,
          clientMonthlyViews,
          freeClientViews,
          clientAutoPay,
          clientRollover,
          partnerMonthly,
          partnerUsdMonthly,
          partnerMonthlyReplies,
          freePartnerReplies,
          partnerAutoPay,
          partnerRollover,
        } = payload || {};
        state.admin.pricing = {
          ...state.admin.pricing,
          clientMonthly:
            typeof clientMonthly === 'number'
              ? clientMonthly
              : state.admin.pricing.clientMonthly,
          clientUsdMonthly:
            typeof clientUsdMonthly === 'number'
              ? clientUsdMonthly
              : state.admin.pricing.clientUsdMonthly ?? 9.99,
          clientMonthlyViews:
            typeof clientMonthlyViews === 'number'
              ? clientMonthlyViews
              : state.admin.pricing.clientMonthlyViews ?? 30,
          freeClientViews:
            typeof freeClientViews === 'number'
              ? freeClientViews
              : state.admin.pricing.freeClientViews,
          clientAutoPay:
            typeof clientAutoPay === 'boolean'
              ? clientAutoPay
              : state.admin.pricing.clientAutoPay ?? true,
          clientRollover:
            typeof clientRollover === 'boolean'
              ? clientRollover
              : state.admin.pricing.clientRollover ?? false,
          partnerMonthly:
            typeof partnerMonthly === 'number'
              ? partnerMonthly
              : state.admin.pricing.partnerMonthly,
          partnerUsdMonthly:
            typeof partnerUsdMonthly === 'number'
              ? partnerUsdMonthly
              : state.admin.pricing.partnerUsdMonthly ?? 19.99,
          partnerMonthlyReplies:
            typeof partnerMonthlyReplies === 'number'
              ? partnerMonthlyReplies
              : state.admin.pricing.partnerMonthlyReplies ?? 50,
          freePartnerReplies:
            typeof freePartnerReplies === 'number'
              ? freePartnerReplies
              : state.admin.pricing.freePartnerReplies,
          partnerAutoPay:
            typeof partnerAutoPay === 'boolean'
              ? partnerAutoPay
              : state.admin.pricing.partnerAutoPay ?? true,
          partnerRollover:
            typeof partnerRollover === 'boolean'
              ? partnerRollover
              : state.admin.pricing.partnerRollover ?? false,
        };
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `Updated subscription plans (Client ₹${state.admin.pricing.clientMonthly}, Partner ₹${state.admin.pricing.partnerMonthly})`,
            cat: 'Billing',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.doc('platform_settings/subscriptions').set(
          {
            clientFreePartnerViews: state.admin.pricing.freeClientViews,
            clientPaidMonthlyPartnerViews: state.admin.pricing.clientMonthlyViews ?? 30,
            clientInrMonthlyPrice: state.admin.pricing.clientMonthly,
            clientUsdMonthlyPrice: state.admin.pricing.clientUsdMonthly ?? 9.99,
            partnerFreeClaims: state.admin.pricing.freePartnerReplies,
            partnerPaidMonthlyClaims: state.admin.pricing.partnerMonthlyReplies ?? 50,
            partnerInrMonthlyPrice: state.admin.pricing.partnerMonthly,
            partnerUsdMonthlyPrice: state.admin.pricing.partnerUsdMonthly ?? 19.99,
            updatedAt: now,
          },
          { merge: true }
        );
        break;
      }

      case 'admin.update_whatsapp_automation': {
        const wa = state.admin.whatsappAutomation!;
        if (typeof payload?.autoPaused === 'boolean') wa.autoPaused = payload.autoPaused;
        if (payload?.intakeMode === 'smart_one_shot' || payload?.intakeMode === 'step_by_step') {
          wa.intakeMode = payload.intakeMode;
        }
        if (typeof payload?.autoHoldFlagged === 'boolean') {
          wa.autoHoldFlagged = payload.autoHoldFlagged;
        }
        if (Array.isArray(payload?.flaggedKeywords)) {
          wa.flaggedKeywords = payload.flaggedKeywords;
        } else if (typeof payload?.flaggedKeywords === 'string') {
          wa.flaggedKeywords = payload.flaggedKeywords;
        }
        if (Array.isArray(payload?.customSynonyms)) {
          wa.customSynonyms = payload.customSynonyms;
        }
        if (Array.isArray(payload?.ignoredUnmappedWords)) {
          wa.ignoredUnmappedWords = payload.ignoredUnmappedWords;
        }
        if (typeof payload?.welcomeGreeting === 'string') {
          wa.welcomeGreeting = payload.welcomeGreeting;
        }
        if (typeof payload?.waveAlertHeader === 'string') {
          wa.waveAlertHeader = payload.waveAlertHeader;
        }
        if (typeof payload?.clientWaState === 'string') {
          wa.clientWaState = payload.clientWaState;
        }
        if (typeof payload?.partnerWaState === 'string') {
          wa.partnerWaState = payload.partnerWaState;
        }
        if (payload?.smartFeatures && typeof payload.smartFeatures === 'object') {
          wa.smartFeatures = { ...wa.smartFeatures, ...payload.smartFeatures };
        }
        if (Array.isArray(payload?.globalKeywords)) {
          wa.globalKeywords = payload.globalKeywords;
        }
        if (payload?.rules && typeof payload.rules === 'object') {
          wa.rules = { ...wa.rules, ...payload.rules };
        }
        const summaryText = payload?.summary || 'Updated WhatsApp automation flow & rules';
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: summaryText,
            cat: 'Automation',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await Promise.all([
          db.doc('platform_settings/whatsapp_automation').set(
            {
              ...wa,
              updatedAt: now,
            },
            { merge: true }
          ),
          db.collection('audit_logs').add({
            actorName: 'Pavan (Superadmin)',
            actorRole: 'superadmin',
            module: 'whatsapp',
            action: 'whatsapp_automation.updated',
            summary: summaryText,
            createdAt: now,
          }),
        ]);
        break;
      }

      case 'admin.send_coordinator_message': {
        const wa = state.admin.whatsappAutomation!;
        const target = payload?.target === 'partner' ? 'partner' : 'client';
        const text = String(payload?.text || '').trim();
        const convoId = payload?.convoId;
        if (text) {
          const msgObj = {
            id: 'coord-' + Date.now(),
            target: target as 'client' | 'partner',
            convoId,
            senderName: payload?.senderName || 'Pavan (XPO Coordinator)',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          wa.coordinatorMessages = [...(wa.coordinatorMessages || []).slice(-19), msgObj];
          state.admin.auditLogs = [
            {
              ts: 'Just now',
              op: 'Pavan (Superadmin)',
              act: `Sent live WhatsApp coordinator message to ${target.toUpperCase()}: "${text.slice(0, 40)}"`,
              cat: 'Automation',
            },
            ...(state.admin.auditLogs || []).slice(0, 49),
          ];
          await db.collection('whatsapp_messages').add({
            id: msgObj.id,
            sessionId: convoId || `sim_${target}`,
            direction: 'outbound',
            senderRole: 'superadmin_coordinator',
            textBody: text,
            deliveryStatus: 'delivered',
            createdAt: now,
          });
        }
        break;
      }

      case 'admin.toggle_convo_pause': {
        const wa = state.admin.whatsappAutomation!;
        const convoId = payload?.convoId;
        const paused = Boolean(payload?.paused);
        const contactName = payload?.contactName || convoId;
        if (convoId) {
          wa.pausedConvos = { ...(wa.pausedConvos || {}), [convoId]: paused };
          state.admin.auditLogs = [
            {
              ts: 'Just now',
              op: 'Pavan (Superadmin)',
              act: paused
                ? `Paused bot & took over conversation ${convoId} (${contactName})`
                : `Resumed automated bot for ${convoId} (${contactName})`,
              cat: 'Automation',
            },
            ...(state.admin.auditLogs || []).slice(0, 49),
          ];
          await db
            .collection('whatsapp_sessions')
            .doc(convoId)
            .set({ botPaused: paused, updatedAt: now }, { merge: true });
        }
        break;
      }

      case 'admin.add_synonym_mapping': {
        const wa = state.admin.whatsappAutomation!;
        const word = String(payload?.word || '').trim().toLowerCase();
        const category = String(payload?.category || '').trim();
        const ignore = Boolean(payload?.ignore);
        if (word) {
          if (ignore) {
            if (!wa.ignoredUnmappedWords.includes(word)) {
              wa.ignoredUnmappedWords.push(word);
            }
          } else if (category) {
            const exists = wa.customSynonyms.some((s) => s.word.toLowerCase() === word);
            if (!exists) {
              wa.customSynonyms.unshift({
                word,
                category,
                addedAt: 'Just now',
              });
            }
            if (!wa.ignoredUnmappedWords.includes(word)) {
              wa.ignoredUnmappedWords.push(word);
            }
            await db.collection('taxonomy_tags').doc(`syn_${word.replace(/[^a-z0-9]/g, '_')}`).set(
              {
                word,
                categoryName: category,
                createdAt: now,
              },
              { merge: true }
            );
          }
          state.admin.auditLogs = [
            {
              ts: 'Just now',
              op: 'Pavan (Superadmin)',
              act: ignore
                ? `Ignored unmapped phrase "${word}"`
                : `Mapped WhatsApp synonym "${word}" → ${category}`,
              cat: 'Taxonomy',
            },
            ...(state.admin.auditLogs || []).slice(0, 49),
          ];
        }
        break;
      }

      case 'admin.update_wave_rules': {
        const {
          partnersPerRound,
          responseWindowSeconds,
          targetClaims,
          deliveryFallbackSeconds,
        } = payload || {};
        state.admin.waveRules = {
          partnersPerRound:
            typeof partnersPerRound === 'number'
              ? partnersPerRound
              : state.admin.waveRules?.partnersPerRound ?? 3,
          responseWindowSeconds:
            typeof responseWindowSeconds === 'number'
              ? responseWindowSeconds
              : state.admin.waveRules?.responseWindowSeconds ?? 300,
          targetClaims:
            typeof targetClaims === 'number'
              ? targetClaims
              : state.admin.waveRules?.targetClaims ?? 3,
          deliveryFallbackSeconds:
            typeof deliveryFallbackSeconds === 'number'
              ? deliveryFallbackSeconds
              : state.admin.waveRules?.deliveryFallbackSeconds ?? 60,
        };
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `Updated Wave Matching Rules (${state.admin.waveRules.partnersPerRound} partners/wave, ${state.admin.waveRules.responseWindowSeconds}s window)`,
            cat: 'Settings',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.doc('platform_settings/matching').set(
          {
            ...state.admin.waveRules,
            updatedAt: now,
          },
          { merge: true }
        );
        break;
      }

      case 'admin.update_site_cms': {
        const currentCms = state.admin.siteCms!;
        if (Array.isArray(payload?.sections)) currentCms.sections = payload.sections;
        if (payload?.hero) currentCms.hero = payload.hero;
        if (Array.isArray(payload?.faqs)) currentCms.faqs = payload.faqs;
        const summary = payload?.summary || 'Published website CMS updates';
        currentCms.history = [
          { w: 'Just now', who: 'Pavan (Superadmin)', what: summary },
          ...(currentCms.history || []).slice(0, 19),
        ];
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: summary,
            cat: 'Website',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.doc('platform_settings/cms').set(
          {
            ...currentCms,
            updatedAt: now,
          },
          { merge: true }
        );
        break;
      }

      case 'admin.update_gateways': {
        const nextGateways = {
          ...state.admin.gateways!,
          ...(payload?.gateways || {}),
        };
        state.admin.gateways = nextGateways;
        const summary = payload?.summary || 'Updated gateway & Meta API credentials';
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: summary,
            cat: 'Settings',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await Promise.all([
          db.doc('platform_credentials/live').set(
            {
              gateways: nextGateways,
              updatedAt: now,
            },
            { merge: true }
          ),
          db.doc('platform_settings/whatsapp_config').set(
            {
              phoneNumberId: nextGateways.metaPhoneNumberId,
              businessAccountId: nextGateways.metaWabaId,
              wabaId: nextGateways.metaWabaId,
              verifyToken: nextGateways.metaVerifyToken,
              displayPhoneNumber: nextGateways.metaDisplayPhone,
              updatedAt: now,
            },
            { merge: true }
          ),
        ]);
        break;
      }

      case 'admin.import_contacts': {
        const count = typeof payload?.count === 'number' ? payload.count : 184;
        const role = payload?.role || 'Partner';
        state.admin.importedContactsCount = (state.admin.importedContactsCount || 0) + count;
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `Imported ${count} ${role} contacts from Excel to Firebase CRM`,
            cat: 'Contacts',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.collection('crm_imports').add({
          role,
          importedCount: count,
          status: 'completed',
          createdAt: now,
        });
        break;
      }

      case 'admin.invite_contacts': {
        const contactIds: string[] = Array.isArray(payload?.contactIds) ? payload.contactIds : [];
        const templateName = payload?.template || 'partner_invitation';
        state.admin.contactStageMap = state.admin.contactStageMap || {};
        for (const cid of contactIds) {
          state.admin.contactStageMap[cid] = 'Invited';
        }
        const count = contactIds.length || 42;
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `Dispatched ${count} WhatsApp invites (${templateName}) via Meta API`,
            cat: 'Contacts',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
        await db.collection('whatsapp_campaigns').add({
          templateName,
          recipientCount: count,
          contactIds,
          status: 'dispatched',
          createdAt: now,
        });
        break;
      }

      case 'admin.add_subcategory': {
        const { sectorName, catName, subName, keywords, synonyms } = payload || {};
        if (sectorName && catName && subName) {
          state.admin.customSubcategories = state.admin.customSubcategories || [];
          state.admin.customSubcategories.push({
            sectorName,
            catName,
            subName,
            partnersCount: 12,
            keywords: keywords || subName.toLowerCase(),
            synonyms: synonyms || subName.toLowerCase(),
          });
          state.admin.auditLogs = [
            {
              ts: 'Just now',
              op: 'Pavan (Superadmin)',
              act: `Added subcategory "${subName}" under ${catName}`,
              cat: 'Taxonomy',
            },
            ...(state.admin.auditLogs || []).slice(0, 49),
          ];
          await db.collection('taxonomy_subcategories').add({
            sectorName,
            categoryName: catName,
            name: subName,
            keywords: keywords || subName.toLowerCase(),
            synonyms: synonyms || subName.toLowerCase(),
            createdAt: now,
          });
        }
        break;
      }

      case 'admin.retry_payment': {
        const payId = payload?.payId || 'PAY-80007';
        const who = payload?.who || 'Member';
        state.admin.auditLogs = [
          {
            ts: 'Just now',
            op: 'Pavan (Superadmin)',
            act: `Dispatched UPI AutoPay / Razorpay retry link for ${payId} (${who})`,
            cat: 'Billing',
          },
          ...(state.admin.auditLogs || []).slice(0, 49),
        ];
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
