'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchMarketplaceState,
  postMarketplaceAction,
  subscribeMarketplaceSync,
} from '@/lib/marketplace/sync-client';
import { getXpoWhatsAppBotUrl } from '@/lib/whatsapp/demo-bot-link';

export type PartnerScreenId =
  | 'feed'
  | 'opp'
  | 'replies'
  | 'conn'
  | 'cats'
  | 'billing'
  | 'notifs'
  | 'profile'
  | 'verify'
  | 'settings'
  | 'help';

export interface PartnerOpportunity {
  id: string;
  ref: string;
  title: string;
  cat: string;
  loc: string;
  when: string;
  budget: string;
  posted: string;
  clientLabel: string;
  clientName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail: string;
  waveBadge?: string;
  isOverseas?: boolean;
  matched: boolean;
  brief: string;
  myReplyStatus: 'none' | 'sent_waiting' | 'client_requested' | 'connected' | 'declined';
  myPitch?: string;
  myTimeline?: string;
  myQuote?: string;
  repliedAt?: string;
}

interface PartnerAppState {
  dark: boolean;
  scene: 'active' | 'incoming' | 'zero' | 'paid' | 'overseas';
  screen: PartnerScreenId;
  oppId: string;
  country: 'IN' | 'AE';
  credits: number;
  plan: 'free' | 'active';
  payMethod: 'upi' | 'card' | 'paypal';
  payFail: boolean;
  ctlOpen: boolean;
  menuOpen: 'none' | 'notif' | 'user';
  filterTab: 'matched' | 'all' | 'overseas';
  search: string;
  capabilities: string[];
  capModalOpen: boolean;
  newCapInput: string;
  pitchDraft: string;
  timelineDraft: string;
  quoteDraft: string;
  profile: {
    bizName: string;
    contactName: string;
    email: string;
    phone: string;
    city: string;
    tier: string;
    industry: string;
  };
  sheet:
    | null
    | { type: 'checkout' }
    | { type: 'processing'; label: string }
    | { type: 'paysuccess' }
    | { type: 'payfail' }
    | { type: 'cancel' }
    | { type: 'reply'; oppId: string };
  alerts: { id: number; tone: string; title: string; msg?: string }[];
  notifs: { id: string; text: string; time: string; unread: boolean; targetScreen: PartnerScreenId; oppId?: string }[];
  opportunities: PartnerOpportunity[];
}

function createInitialOpportunities(): PartnerOpportunity[] {
  return [
    {
      id: 'req-1',
      ref: 'XPO-REQ-40971',
      title: 'E-commerce website for a 5-store retail chain',
      cat: 'Web & Mobile Development',
      loc: 'Hyderabad',
      when: 'Within a month',
      budget: '₹3L – ₹8L',
      posted: 'Yesterday',
      clientLabel: 'Verified retail chain · Hyderabad',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      clientPhone: '+91 98490 00112',
      clientEmail: 'pavan@testtraders.in',
      waveBadge: 'CLIENT REQUESTED CONTACT',
      matched: true,
      brief:
        'Looking for a team that has built multi-store retail websites with Razorpay, inventory sync across 5 Hyderabad stores, and WhatsApp order updates.',
      myReplyStatus: 'client_requested',
      myPitch:
        'Built 14 retail e-commerce stores on Shopify & custom stacks. Razorpay + shiprocket ready, 5-week delivery.',
      myTimeline: '4–5 weeks',
      myQuote: '₹4.5L – ₹6.5L',
      repliedAt: 'Yesterday · 4:15 PM',
    },
    {
      id: 'req-2',
      ref: 'XPO-REQ-41208',
      title: '10,000 printed 3-ply corrugated boxes',
      cat: 'Packaging & Printing',
      loc: 'Hyderabad',
      when: 'Within 2 weeks',
      budget: 'Open to quotes',
      posted: '2 min ago',
      clientLabel: 'Verified trading business · Hyderabad',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      clientPhone: '+91 98490 00112',
      clientEmail: 'pavan@testtraders.in',
      waveBadge: 'WAVE 1 · NEW',
      matched: true,
      brief:
        '10,000 3-ply corrugated mailer boxes (12×9×4 in) with single-colour black logo print on top flap. Delivery to Kukatpally warehouse in Hyderabad within 2 weeks.',
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
      loc: 'Medchal, Hyderabad',
      when: '1–3 months',
      budget: '₹18L – ₹24L',
      posted: '6 days ago',
      clientLabel: 'Verified warehouse operator · Hyderabad',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      clientPhone: '+91 98490 00112',
      clientEmail: 'pavan@testtraders.in',
      matched: false,
      brief:
        'Turnkey 50 kW on-grid rooftop solar installation on PEB warehouse shed in Medchal with net metering approval and 5-year AMC.',
      myReplyStatus: 'none',
    },
    {
      id: 'req-6',
      ref: 'XPO-REQ-39114',
      title: 'Company website developer',
      cat: 'Web & Mobile Development',
      loc: 'Hyderabad',
      when: 'Completed',
      budget: '₹1.2L',
      posted: '12 days ago',
      clientLabel: 'Test Traders · Hyderabad',
      clientName: 'Pavan',
      clientCompany: 'Test Traders',
      clientPhone: '+91 98490 00112',
      clientEmail: 'pavan@testtraders.in',
      matched: true,
      brief:
        'Corporate B2B catalogue website with fast mobile load times, WhatsApp lead capture, and product inquiry forms.',
      myReplyStatus: 'connected',
      myPitch: 'Fast Next.js corporate site with WhatsApp lead integration and SEO setup.',
      myTimeline: '2 weeks',
      myQuote: '₹1.15L',
      repliedAt: '11 days ago',
    },
  ];
}

export function XpoPartnerApp({
  initialScreen = 'feed',
  initialOppId,
  forceMobileSim = false,
  hideSimToolbar = false,
}: {
  initialScreen?: PartnerScreenId;
  initialOppId?: string;
  forceMobileSim?: boolean;
  hideSimToolbar?: boolean;
}) {
  const router = useRouter();
  const [mobileSim, setMobileSim] = useState<boolean>(forceMobileSim);
  const [S, setS] = useState<PartnerAppState>(() => ({
    dark: false,
    scene: 'active',
    screen: initialScreen,
    oppId: initialOppId || 'req-1',
    country: 'IN',
    credits: 3,
    plan: 'free',
    payMethod: 'upi',
    payFail: false,
    ctlOpen: false,
    menuOpen: 'none',
    filterTab: 'matched',
    search: '',
    capabilities: [
      'Web & Mobile Development',
      'Shopify & E-commerce',
      'Custom ERP & Portals',
      'UI/UX & Frontend',
      'Packaging & Printing',
    ],
    capModalOpen: false,
    newCapInput: '',
    pitchDraft: '',
    timelineDraft: '3–4 weeks',
    quoteDraft: '',
    profile: {
      bizName: 'Klo Tech Solutions',
      contactName: 'Kiran Kumar',
      email: 'kiran@klotech.in',
      phone: '+91 98480 22334',
      city: 'Hyderabad',
      tier: 'Pro Partner · Wave 1 Priority',
      industry: 'Web & Mobile Development',
    },
    sheet: null,
    alerts: [],
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
        text: 'New Wave 1 match: "10,000 printed 3-ply corrugated boxes" in Hyderabad',
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
    opportunities: createInitialOpportunities(),
  }));

  useEffect(() => {
    setS((prev) => ({
      ...prev,
      screen: initialScreen,
      oppId: initialOppId || prev.oppId,
    }));
  }, [initialScreen, initialOppId]);

  // Live Firebase Firestore & Cross-Workspace Sync (Partner <-> Client <-> Superadmin)
  useEffect(() => {
    const applyServerState = (st: any) => {
      if (!st?.partner) return;
      setS((prev) => ({
        ...prev,
        credits: typeof st.partner.credits === 'number' ? st.partner.credits : prev.credits,
        plan: st.partner.plan === 'active' || st.partner.plan === 'free' ? st.partner.plan : prev.plan,
        capabilities: Array.isArray(st.partner.capabilities) ? st.partner.capabilities : prev.capabilities,
        opportunities: Array.isArray(st.partner.opportunities) && st.partner.opportunities.length > 0
          ? st.partner.opportunities
          : prev.opportunities,
        notifs: Array.isArray(st.partner.notifs) && st.partner.notifs.length > 0
          ? st.partner.notifs
          : prev.notifs,
      }));
    };

    fetchMarketplaceState().then((st) => {
      if (st) applyServerState(st);
    });

    const unsub = subscribeMarketplaceSync((st) => {
      applyServerState(st);
    });
    return unsub;
  }, []);

  const toast = (tone: string, title: string, msg?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setS((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { id, tone, title, msg }],
    }));
    setTimeout(() => {
      setS((prev) => ({
        ...prev,
        alerts: prev.alerts.filter((a) => a.id !== id),
      }));
    }, 5000);
  };

  const dismissAlert = (id: number) => {
    setS((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== id),
    }));
  };

  const applyScene = (sc: PartnerAppState['scene']) => {
    const baseOpps = createInitialOpportunities();
    let credits = 3;
    let plan: 'free' | 'active' = 'free';
    let country: 'IN' | 'AE' = 'IN';
    let payMethod: 'upi' | 'card' | 'paypal' = 'upi';
    let screen: PartnerScreenId = 'feed';
    let oppId = 'req-1';

    if (sc === 'incoming') {
      screen = 'opp';
      oppId = 'req-1';
    } else if (sc === 'zero') {
      credits = 0;
      plan = 'free';
      screen = 'opp';
      oppId = 'req-2';
    } else if (sc === 'paid') {
      credits = 42;
      plan = 'active';
    } else if (sc === 'overseas') {
      country = 'AE';
      payMethod = 'paypal';
    }

    setS((prev) => ({
      ...prev,
      scene: sc,
      credits,
      plan,
      country,
      payMethod,
      screen,
      oppId,
      sheet: null,
      opportunities: baseOpps,
    }));
  };

  const openOpp = (id: string) => {
    const found = S.opportunities.find((o) => o.id === id || o.ref === id);
    setS((prev) => ({
      ...prev,
      screen: 'opp',
      oppId: found ? found.id : id,
      pitchDraft: '',
      quoteDraft: '',
      menuOpen: 'none',
    }));
  };

  const acceptClientRequest = (oppId: string) => {
    const opp = S.opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    setS((prev) => ({
      ...prev,
      opportunities: prev.opportunities.map((o) =>
        o.id === oppId ? { ...o, myReplyStatus: 'connected', waveBadge: 'CONNECTED' } : o
      ),
    }));
    toast(
      'ok',
      `Connected with ${opp.clientCompany}`,
      `${opp.clientName}'s phone (${opp.clientPhone}) and WhatsApp are now unlocked.`
    );
    postMarketplaceAction('partner.respond_connection', {
      oppId,
      ref: opp.ref,
      decision: 'accepted',
    }).catch(() => {});
  };

  const declineClientRequest = (oppId: string) => {
    const opp = S.opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    setS((prev) => ({
      ...prev,
      opportunities: prev.opportunities.map((o) =>
        o.id === oppId ? { ...o, myReplyStatus: 'declined', waveBadge: undefined } : o
      ),
    }));
    toast('info', 'Request declined', `We let ${opp.clientName} know and refunded their view.`);
    postMarketplaceAction('partner.respond_connection', {
      oppId,
      ref: opp.ref,
      decision: 'declined',
    }).catch(() => {});
  };

  const openReplySheet = (oppId: string) => {
    if (S.credits <= 0) {
      setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }));
      return;
    }
    setS((prev) => ({
      ...prev,
      pitchDraft: '',
      timelineDraft: 'Within 2 weeks',
      quoteDraft: '',
      sheet: { type: 'reply', oppId },
    }));
  };

  const submitReply = async (oppId: string) => {
    const pitch = S.pitchDraft.trim();
    if (pitch.length < 15) {
      toast('warn', 'Add a slightly longer note', 'Write at least one sentence on how you can help.');
      return;
    }
    const opp = S.opportunities.find((o) => o.id === oppId);
    if (!opp) return;

    const nextCredits = Math.max(0, S.credits - 1);

    setS((prev) => ({
      ...prev,
      credits: nextCredits,
      sheet: null,
      opportunities: prev.opportunities.map((o) =>
        o.id === oppId
          ? {
              ...o,
              myReplyStatus: 'sent_waiting',
              myPitch: pitch,
              myTimeline: S.timelineDraft,
              myQuote: S.quoteDraft || 'As per scope',
              repliedAt: 'Just now',
              waveBadge: 'REPLY SENT',
            }
          : o
      ),
    }));
    toast(
      'ok',
      'Reply sent to client (1 reply used)',
      `We notified ${opp.clientCompany} on WhatsApp. You'll be alerted if they unlock your contact.`
    );
    postMarketplaceAction('partner.submit_reply', {
      oppId,
      ref: opp.ref,
      pitch,
      timeline: S.timelineDraft,
      quote: S.quoteDraft || 'As per scope',
      credits: nextCredits,
    }).catch(() => {});
  };

  const startPayment = () => {
    const label =
      S.country === 'IN'
        ? S.payMethod === 'upi'
          ? 'Approve ₹1,178.82 UPI AutoPay mandate on your phone…'
          : S.payMethod === 'card'
          ? 'Confirming card with your bank…'
          : 'Confirming with PayPal…'
        : 'Confirming $19.99/mo with PayPal…';
    setS((prev) => ({ ...prev, sheet: { type: 'processing', label } }));
    setTimeout(() => {
      setS((prev) => {
        if (prev.payFail) {
          return { ...prev, payFail: false, sheet: { type: 'payfail' } };
        }
        const nextCreds = prev.credits + 50;
        postMarketplaceAction('partner.update_account', {
          plan: 'active',
          credits: nextCreds,
        }).catch(() => {});
        return {
          ...prev,
          plan: 'active',
          credits: nextCreds,
          sheet: { type: 'paysuccess' },
        };
      });
    }, 900);
  };

  const confirmCancelPlan = () => {
    setS((prev) => ({ ...prev, plan: 'free', sheet: null }));
    toast('info', 'Partner Plan cancelled', 'You keep your remaining replies until 4 Dec 2026.');
    postMarketplaceAction('partner.update_account', { plan: 'free' }).catch(() => {});
  };

  // Prototype triggers
  const trigNewMatch = () => {
    const ref = 'XPO-REQ-' + (41400 + Math.floor(Math.random() * 500));
    const newOpp: PartnerOpportunity = {
      id: 'req-' + Date.now(),
      ref,
      title: 'B2B dealer ordering portal & WhatsApp catalogue bot',
      cat: 'Web & Mobile Development',
      loc: 'Bengaluru',
      when: 'Within a month',
      budget: '₹4L – ₹7L',
      posted: 'Just now',
      clientLabel: 'Verified hardware distributor · Bengaluru',
      clientName: 'Karthik Reddy',
      clientCompany: 'Apex Industrial Supplies',
      clientPhone: '+91 98450 88219',
      clientEmail: 'karthik@apexsupplies.in',
      waveBadge: 'WAVE 1 · LIVE NOW',
      matched: true,
      brief:
        'Need a dealer ordering web app where 250+ hardware retailers can place repeat orders, download GST invoices, and get dispatch alerts on WhatsApp.',
      myReplyStatus: 'none',
    };
    setS((prev) => ({
      ...prev,
      opportunities: [newOpp, ...prev.opportunities],
    }));
    toast('info', `New Wave 1 match (${ref})`, 'B2B dealer ordering portal & WhatsApp catalogue bot · Bengaluru');
  };

  const trigClientUnlocks = () => {
    const waiting = S.opportunities.find((o) => o.myReplyStatus === 'sent_waiting') || S.opportunities[1];
    if (!waiting) return;
    setS((prev) => ({
      ...prev,
      screen: 'opp',
      oppId: waiting.id,
      opportunities: prev.opportunities.map((o) =>
        o.id === waiting.id
          ? {
              ...o,
              myReplyStatus: 'client_requested',
              waveBadge: 'CLIENT REQUESTED CONTACT',
              myPitch:
                o.myPitch ||
                'Ready to deliver on schedule with dedicated project lead and GST billing.',
              myTimeline: o.myTimeline || 'Within 2 weeks',
              myQuote: o.myQuote || 'Matches client budget',
              repliedAt: o.repliedAt || 'Just now',
            }
          : o
      ),
    }));
    toast(
      'ok',
      `${waiting.clientCompany} wants to connect!`,
      'They used 1 view on your reply. Accept to unlock direct WhatsApp & phone.'
    );
  };

  const unreadCount = S.notifs.filter((n) => n.unread).length;
  const incomingCount = S.opportunities.filter((o) => o.myReplyStatus === 'client_requested').length;
  const repliesList = S.opportunities.filter((o) => o.myReplyStatus !== 'none');
  const connectedList = S.opportunities.filter((o) => o.myReplyStatus === 'connected');

  const markNotifRead = (id: string) => {
    setS((prev) => ({
      ...prev,
      notifs: prev.notifs.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    }));
  };

  const creditLabel =
    S.plan === 'active'
      ? `Partner Plan · ${S.credits} replies left`
      : S.credits === 0
      ? '0 replies left · Upgrade'
      : `${S.credits} free ${S.credits === 1 ? 'reply' : 'replies'} left`;

  const creditDot = S.credits === 0 ? '#D97706' : '#16A34A';

  const filteredOpps = S.opportunities.filter((o) => {
    if (S.filterTab === 'matched' && !o.matched) return false;
    if (S.filterTab === 'overseas' && !o.isOverseas) return false;
    if (S.search.trim()) {
      const q = S.search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.cat.toLowerCase().includes(q) ||
        o.loc.toLowerCase().includes(q) ||
        o.ref.toLowerCase().includes(q)
      );
    }
    return true;
  });

  
  const renderLeadCard = (o: PartnerOpportunity) => {
    let badgeText = 'MATCHED TO YOU';
    let badgeClass = 'c-a';
    if (o.myReplyStatus === 'connected') {
      badgeText = 'Connected';
      badgeClass = 'c-g';
    } else if (o.isOverseas || (o.waveBadge && o.waveBadge.toLowerCase().includes('overseas'))) {
      badgeText = 'Overseas · USD';
      badgeClass = 'c-b';
    } else if (o.waveBadge && (o.waveBadge.includes('NEW') || o.waveBadge.includes('Wave 1') || o.waveBadge.includes('WAVE 1'))) {
      badgeText = 'WAVE 1 · NEW';
      badgeClass = 'c-r';
    }

    let statusText = '';
    let statusClass = '';
    if (o.myReplyStatus === 'sent_waiting') {
      statusText = 'Reply sent';
      statusClass = 'c-a';
    } else if (o.myReplyStatus === 'connected') {
      statusText = 'Connected';
      statusClass = 'c-g';
    }

    const isNew = o.myReplyStatus === 'none';
    const act = isNew ? 'View & send reply' : 'Open details';

    const timeDisplay = o.posted.startsWith('Posted') ? o.posted : `Posted ${o.posted}`;

    return (
      <div
        key={o.id}
        role="button"
        tabIndex={0}
        className="card req"
        onClick={() => openOpp(o.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openOpp(o.id);
          }
        }}
      >
        <div className="head">
          <span className="mono mute3">{o.ref}</span>
          <span className={`chip ${badgeClass}`}>{badgeText}</span>
          <span className="sp" />
          {statusText && <span className={`chip ${statusClass}`}>{statusText}</span>}
        </div>

        <h3>{o.title}</h3>
        <span className="mute" style={{ fontSize: 13, lineHeight: 1.5 }}>
          {o.brief}
        </span>

        <div className="meta">
          <span className="chip">{o.cat}</span>
          <span className="chip">📍 {o.loc}</span>
          <span className="chip">⏱ {o.when}</span>
          <span className="chip">💰 {o.budget}</span>
        </div>

        <div className="foot">
          <span className="mono mute3">{timeDisplay}</span>
          <span className="sp" />
          <span
            className={`btn sm ${isNew ? 'red' : 'ghost'}`}
            style={{ pointerEvents: 'none' }}
          >
            {act} →
          </span>
        </div>
      </div>
    );
  };

  const getPartnerTitle = () => {
    if (S.screen === 'feed') return `Requests matched to ${S.profile.bizName || 'Klo Tech'}`;
    if (S.screen === 'opp') return 'Request';
    if (S.screen === 'replies') return 'My replies';
    if (S.screen === 'conn') return 'Connected';
    if (S.screen === 'cats') return 'My categories';
    if (S.screen === 'billing') return 'Plan & billing';
    if (S.screen === 'notifs') return 'Notifications & Alerts';
    return 'Account';
  };

  const activeOpp = S.opportunities.find((o) => o.id === S.oppId) || S.opportunities[0];
  const isSim = forceMobileSim;
  const newCount = S.opportunities.filter((o) => o.myReplyStatus === 'none').length;
  const actionNeededLead = S.opportunities.find((o) => o.myReplyStatus === 'client_requested');

  return (
    <div
      style={
        isSim && !hideSimToolbar
          ? {
              minHeight: '100vh',
              background: '#111318',
              padding: '16px 12px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }
          : undefined
      }
    >
      {isSim && !hideSimToolbar && (
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            background: '#1C1F26',
            border: '1px solid #2E323D',
            borderRadius: 14,
            padding: '10px 16px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: '#1E3A8A',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 99,
              }}
            >
              📱 PARTNER MOBILE APP SIMULATOR (390×844)
            </span>
            <span style={{ fontSize: 12.5, color: '#A9ADB6' }}>
              Wave 1 5-min lead feed · 1-tap quote composer &amp; mutual contact handshake
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => openReplySheet('req-2')}
              style={{
                minHeight: 34,
                padding: '0 12px',
                borderRadius: 9,
                border: '1px solid #3D4250',
                background: '#C8102E',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              + Open Mobile Reply Sheet
            </button>
            <Link
              href="/simulator"
              style={{
                minHeight: 34,
                padding: '0 12px',
                borderRadius: 9,
                border: '1px solid #3D4250',
                background: '#262A34',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12.5,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              💬 Tri-Screen Mobile + WhatsApp Studio →
            </Link>
            <button
              type="button"
              onClick={() => setMobileSim(false)}
              style={{
                minHeight: 34,
                padding: '0 12px',
                borderRadius: 9,
                border: '1px solid #3D4250',
                background: '#262A34',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              🖥 Return to Desktop View
            </button>
          </div>
        </div>
      )}

      <div
        className={`xt ${S.dark ? 'dark' : ''} ${isSim ? 'mobile-sim' : ''}`}
        onClick={() => {
          if (S.menuOpen !== 'none') setS((prev) => ({ ...prev, menuOpen: 'none' }));
        }}
      >
        {isSim && (
          <>
            <div className="iphone-dynamic-island" />
            <div className="iphone-home-indicator" />
            <div
              style={{
                background: 'var(--sf)',
                borderBottom: '1px solid var(--ln)',
                padding: '10px 22px 6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--tx)',
                flexShrink: 0,
                zIndex: 30,
              }}
            >
              <span>9:41</span>
              <span style={{ width: 124, height: 20 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}
        <div className="shell">
        {/* LEFT SIDEBAR */}
        <aside
          className="side"
          style={{
            background: 'var(--sf)',
            borderRight: '1px solid var(--ln)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 14px',
            gap: 4,
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: 248,
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div className="lg" style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 8px', marginBottom: 10 }}>
            <img
              src="/xpo-logo.png"
              alt="XPO India"
              style={{ height: 24, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
            />
            <span className="rolechip">partner</span>
          </div>

          <nav aria-label="Partner navigation" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {/* 1. Requests */}
            <button
              type="button"
              className={`nv ${S.screen === 'feed' || S.screen === 'opp' ? 'active' : ''}`}
              aria-current={S.screen === 'feed' || S.screen === 'opp' ? 'page' : 'false'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
              </svg>
              <span>Requests</span>
              {newCount > 0 && <span className="n">{newCount}</span>}
            </button>

            {/* 2. Replies */}
            <button
              type="button"
              className={`nv ${S.screen === 'replies' ? 'active' : ''}`}
              aria-current={S.screen === 'replies' ? 'page' : 'false'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Replies</span>
              {repliesList.length > 0 && <span className="n">{repliesList.length}</span>}
            </button>

            {/* 3. Connected */}
            <button
              type="button"
              className={`nv ${S.screen === 'conn' ? 'active' : ''}`}
              aria-current={S.screen === 'conn' ? 'page' : 'false'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              <span>Connected</span>
              {connectedList.length > 0 && <span className="n">{connectedList.length}</span>}
            </button>

            {/* 4. Categories */}
            <button
              type="button"
              className={`nv ${S.screen === 'cats' ? 'active' : ''}`}
              aria-current={S.screen === 'cats' ? 'page' : 'false'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'cats' }))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
                <circle cx="7" cy="7" r="1" />
              </svg>
              <span>Categories</span>
            </button>
          </nav>

          <div className="foot" style={{ marginTop: 'auto', borderTop: '1px solid var(--ln)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="av">KT</span>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <b style={{ fontSize: 13.5, lineHeight: 1.2 }}>{S.profile.bizName || 'Klo Tech'}</b>
              <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{S.profile.industry || 'Web & Mobile Development'}</span>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div className="main" style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* TOPBAR */}
          <header className="top" style={{ height: 66, borderBottom: '1px solid var(--ln)', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <img
                src="/xpo-logo.png"
                alt="XPO"
                className="only-sm"
                style={{ height: 24, width: 'auto', objectFit: 'contain' }}
              />
              <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getPartnerTitle()}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 40 }}>
              {/* Alerts Bell Button */}
              <button
                type="button"
                className="hbtn"
                aria-label="Alerts"
                onClick={() =>
                  setS((prev) => ({
                    ...prev,
                    menuOpen: prev.menuOpen === 'notif' ? 'none' : 'notif',
                  }))
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && <span className="hn">{unreadCount}</span>}
              </button>

              {/* Profile Avatar Button */}
              <button
                type="button"
                className="avbtn"
                aria-label="Profile and plan"
                onClick={() =>
                  setS((prev) => ({
                    ...prev,
                    menuOpen: prev.menuOpen === 'user' ? 'none' : 'user',
                  }))
                }
              >
                <span className="av" title={S.profile.bizName || 'Klo Tech'}>KT</span>
              </button>

              {/* Backdrop */}
              {S.menuOpen !== 'none' && (
                <button
                  type="button"
                  className="backdrop"
                  aria-label="Close menu"
                  onClick={() => setS((prev) => ({ ...prev, menuOpen: 'none' }))}
                />
              )}

              {/* Alerts Popover */}
              {S.menuOpen === 'notif' && (
                <div className="pop" role="menu" aria-label="Alerts">
                  <div className="ph">
                    <b>Alerts</b>
                    <span className="sp" style={{ flex: 1 }} />
                    <span className="chip">{S.notifs.length}</span>
                  </div>
                  {S.notifs.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="al"
                      onClick={() => {
                        markNotifRead(n.id);
                        if (n.oppId) openOpp(n.oppId);
                        else setS((prev) => ({ ...prev, screen: 'feed', menuOpen: 'none' }));
                      }}
                    >
                      <span className="t">{n.time}</span>
                      <span>{n.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Profile & Plan Popover */}
              {S.menuOpen === 'user' && (
                <div className="pop" role="menu" aria-label="Profile">
                  <div className="ph">
                    <span className="av">KT</span>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ fontSize: 14.5 }}>{S.profile.bizName || 'Klo Tech'}</b>
                      <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{S.profile.industry || 'Web & Mobile Development'}</span>
                    </div>
                  </div>

                  <div className="planbox">
                    <span className="lbl">Plan &amp; billing</span>
                    <b style={{ fontSize: 14 }}>{S.credits} free replies left</b>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => setS((prev) => ({ ...prev, screen: 'billing', menuOpen: 'none' }))}
                    >
                      Manage plan
                    </button>
                  </div>

                  <button
                    type="button"
                    className="mrow"
                    onClick={() => {
                      setS((prev) => ({ ...prev, menuOpen: 'none' }));
                      toast('info', 'Support hotline', 'Support: +91 40 4917 2200 · support@xpoindia.com');
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" />
                    </svg>
                    <span>Need a hand?</span>
                    <span className="sp mono" style={{ marginLeft: 'auto', color: 'var(--tx3)', fontSize: 12 }}>+91 40 4917 2200</span>
                  </button>

                  <button
                    type="button"
                    className="mrow"
                    onClick={() => setS((prev) => ({ ...prev, dark: !prev.dark }))}
                  >
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
                    </svg>
                    <span>Dark mode</span>
                    <span className="sw sp" role="switch" aria-checked={S.dark} />
                  </button>

                  <Link
                    href="/dashboard/client"
                    className="mrow"
                    style={{ textDecoration: 'none' }}
                    onClick={() => setS((prev) => ({ ...prev, menuOpen: 'none' }))}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
                    </svg>
                    <span>Switch to Client view</span>
                    <span className="sp" style={{ marginLeft: 'auto', color: 'var(--tx3)' }}>→</span>
                  </Link>

                  <button
                    type="button"
                    className="mrow"
                    style={{ color: 'var(--rtx)', borderTop: '1px solid var(--ln)', marginTop: 4, paddingTop: 10 }}
                    onClick={() => {
                      fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
                      router.push('/login');
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* SCREEN 1: MATCHED REQUESTS FEED */}
          {S.screen === 'feed' && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="mute" style={{ fontSize: 13.5, margin: '0 2px 4px' }}>
                Sent in 5-minute waves to verified partners in your categories. Zero commission on deals.
              </p>

              <div className="tabs" style={{ marginBottom: 4 }}>
                <button
                  type="button"
                  className="tb"
                  aria-selected={S.filterTab === 'matched'}
                  onClick={() => setS((prev) => ({ ...prev, filterTab: 'matched' }))}
                >
                  Matched ({S.opportunities.filter((o) => o.matched).length})
                </button>
                <button
                  type="button"
                  className="tb"
                  aria-selected={S.filterTab === 'all'}
                  onClick={() => setS((prev) => ({ ...prev, filterTab: 'all' }))}
                >
                  All requests ({S.opportunities.length})
                </button>
                <button
                  type="button"
                  className="tb"
                  aria-selected={S.filterTab === 'overseas'}
                  onClick={() => setS((prev) => ({ ...prev, filterTab: 'overseas' }))}
                >
                  Overseas USD ({S.opportunities.filter((o) => o.isOverseas).length})
                </button>
              </div>

              {/* Single Action Needed Card */}
              {actionNeededLead && (
                <div className="card attn">
                  <div className="head" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="chip c-r">Action needed</span>
                    <span className="sp" />
                    <span className="mono mute3">{actionNeededLead.ref}</span>
                  </div>
                  <b style={{ fontSize: 15 }}>{actionNeededLead.clientCompany || actionNeededLead.clientName} used 1 view to see your details</b>
                  <span className="mute" style={{ fontSize: 13.5 }}>
                    Confirm to share your phone &amp; WhatsApp and unlock their direct number.
                  </span>
                  <div className="row" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn sm red" onClick={() => acceptClientRequest(actionNeededLead.id)}>
                      Accept &amp; share contact
                    </button>
                    <button className="btn sm ghost" onClick={() => openOpp(actionNeededLead.id)}>
                      Review request
                    </button>
                  </div>
                </div>
              )}

              {/* Feed Cards (Clean Entity Widgets) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOpps
                  .filter((o) => !(actionNeededLead && o.id === actionNeededLead.id))
                  .map((o) => renderLeadCard(o))}
              </div>
            </div>
          )}

          {/* SCREEN 2: OPPORTUNITY DETAIL */}
          {S.screen === 'opp' && activeOpp && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                type="button"
                className="btn ghost sm"
                style={{ alignSelf: 'flex-start', padding: '0 4px', color: 'var(--tx2)' }}
                onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
              >
                ← All requests
              </button>

              {/* Overview Card */}
              <div className="card">
                <div className="head" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="mono mute3">{activeOpp.ref}</span>
                  <span className={`chip ${
                    activeOpp.myReplyStatus === 'connected'
                      ? 'c-g'
                      : activeOpp.isOverseas
                      ? 'c-b'
                      : activeOpp.waveBadge?.includes('NEW') || activeOpp.waveBadge?.includes('Wave 1')
                      ? 'c-r'
                      : 'c-a'
                  }`}>
                    {activeOpp.myReplyStatus === 'connected' ? 'Connected' : activeOpp.isOverseas ? 'Overseas · USD' : activeOpp.waveBadge || 'MATCHED TO YOU'}
                  </span>
                  <span className="sp" />
                  {activeOpp.myReplyStatus === 'sent_waiting' && <span className="chip c-a">Reply sent</span>}
                  {activeOpp.myReplyStatus === 'connected' && <span className="chip c-g">Connected</span>}
                </div>

                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{activeOpp.title}</h2>
                <span className="mute" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                  {activeOpp.brief}
                </span>

                <div className="meta row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip">{activeOpp.cat}</span>
                  <span className="chip">📍 {activeOpp.loc}</span>
                  <span className="chip">⏱ {activeOpp.when}</span>
                  <span className="chip">💰 {activeOpp.budget}</span>
                  <span className="chip">Posted {activeOpp.posted}</span>
                </div>
              </div>

              {/* State: Connected */}
              {activeOpp.myReplyStatus === 'connected' && (
                <div className="card" style={{ borderColor: 'var(--g)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="sq">✓</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 15 }}>{activeOpp.clientName} · {activeOpp.clientCompany}</b>
                      <div className="mute" style={{ fontSize: 12.5, marginTop: 2 }}>
                        {activeOpp.title} · {activeOpp.budget}
                      </div>
                    </div>
                    <span className="chip c-g">{activeOpp.when}</span>
                  </div>
                  <span className="mute" style={{ fontSize: 13.5 }}>
                    You are connected with {activeOpp.clientName} on this request. Direct contact unlocked:
                  </span>
                  <div style={{ fontSize: 13.5, color: 'var(--tx)' }}>
                    Phone: <span className="mono">{activeOpp.clientPhone}</span> · Email: <span className="mono">{activeOpp.clientEmail}</span>
                  </div>
                  <div className="row" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <a
                      className="btn sm red"
                      href={`https://wa.me/${activeOpp.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${activeOpp.clientName}, connecting from Klo Tech via XPO regarding "${activeOpp.title}" (${activeOpp.ref}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      Message on WhatsApp
                    </a>
                    <a
                      className="btn sm"
                      href={`tel:${activeOpp.clientPhone}`}
                      style={{ textDecoration: 'none' }}
                    >
                      Call {activeOpp.clientPhone}
                    </a>
                  </div>
                </div>
              )}

              {/* State: Client Requested Contact */}
              {activeOpp.myReplyStatus === 'client_requested' && (
                <div className="card attn">
                  <div className="head" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="chip c-r">Action needed</span>
                    <span className="sp" />
                    <span className="mono mute3">{activeOpp.ref}</span>
                  </div>
                  <b style={{ fontSize: 15 }}>{activeOpp.clientCompany || activeOpp.clientName} used 1 view to see your details</b>
                  <span className="mute" style={{ fontSize: 13.5 }}>
                    Confirm to share your phone &amp; WhatsApp and unlock their direct number.
                  </span>
                  <div className="row" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn sm red" onClick={() => acceptClientRequest(activeOpp.id)}>
                      Accept &amp; share contact
                    </button>
                    <button className="btn sm ghost" onClick={() => declineClientRequest(activeOpp.id)}>
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* State: Reply Sent · Waiting */}
              {activeOpp.myReplyStatus === 'sent_waiting' && (
                <div className="card" style={{ borderColor: 'var(--g)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="chip c-a">Reply sent</span>
                    <span className="mono mute3">{activeOpp.repliedAt || 'Recently'}</span>
                  </div>
                  <span className="mute" style={{ fontSize: 13.5 }}>
                    The client has your reply. You will be told here when they want to connect.
                  </span>
                  {activeOpp.myPitch && (
                    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: 'var(--sf2)', border: '1px solid var(--ln)', fontStyle: 'italic', fontSize: 13.5 }}>
                      “{activeOpp.myPitch}”
                    </div>
                  )}
                </div>
              )}

              {/* State: New (Reply Composer) */}
              {activeOpp.myReplyStatus === 'none' && (
                <div className="card">
                  <span className="lbl">Your reply</span>
                  <textarea
                    className="inp"
                    rows={3}
                    placeholder="Your quote and a short pitch — why you fit this request"
                    value={S.pitchDraft}
                    onChange={(e) => setS((prev) => ({ ...prev, pitchDraft: e.target.value }))}
                    style={{ resize: 'vertical', minHeight: 90, padding: '12px 14px', lineHeight: 1.5, marginBottom: 12 }}
                  />
                  <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn red"
                      onClick={() => {
                        if (!S.pitchDraft.trim()) {
                          toast('warn', 'Short pitch required', 'Write at least a couple sentences on how you fit this request.');
                          return;
                        }
                        submitReply(activeOpp.id);
                      }}
                    >
                      Send reply · 1 free
                    </button>
                    <span className="mute3" style={{ fontSize: 12.5 }}>
                      {S.credits} free replies left
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3: MY REPLIES */}
          {S.screen === 'replies' && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span className="lbl" style={{ margin: '0 2px 2px', display: 'block' }}>
                My replies ({repliesList.length})
              </span>
              {repliesList.length === 0 ? (
                <div className="empty">No replies yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {repliesList.map((o) => renderLeadCard(o))}
                </div>
              )}
            </div>
          )}

          {/* SCREEN 4: CONNECTED CLIENTS */}
          {S.screen === 'conn' && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span className="lbl" style={{ margin: '0 2px 2px', display: 'block' }}>
                Connected clients ({connectedList.length})
              </span>
              {connectedList.length === 0 ? (
                <div className="empty">No connected clients yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {connectedList.map((c) => (
                    <div key={c.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="sq">✓</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <b style={{ fontSize: 15 }}>{c.clientName} · {c.clientCompany}</b>
                          <div className="mute" style={{ fontSize: 12.5, marginTop: 2 }}>
                            {c.title} · {c.budget}
                          </div>
                        </div>
                        <span className="chip c-g">{c.when}</span>
                      </div>
                      <div className="row" style={{ display: 'flex', gap: 8 }}>
                        <a
                          className="btn ink sm"
                          href={`https://wa.me/${c.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${c.clientName}, connecting from Klo Tech via XPO regarding "${c.title}" (${c.ref}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          Message
                        </a>
                        <a
                          className="btn sm"
                          href={`tel:${c.clientPhone}`}
                          style={{ textDecoration: 'none' }}
                        >
                          Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCREEN 5: CATEGORIES */}
          {S.screen === 'cats' && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="lbl">Categories you receive leads for ({S.capabilities.length})</span>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => setS((prev) => ({ ...prev, capModalOpen: true }))}
                  >
                    Edit
                  </button>
                </div>
                <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip c-g">{S.profile.industry || 'Web & Mobile Development'}</span>
                  {S.capabilities
                    .filter((c) => c !== (S.profile.industry || 'Web & Mobile Development'))
                    .map((c) => (
                      <span key={c} className="chip">{c}</span>
                    ))}
                </div>
                <span className="mute3" style={{ fontSize: 12.5 }}>
                  Leads are matched to you only in these categories.
                </span>
              </div>

              <div className="card flat" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--sf2)', border: '1px solid var(--ln)' }}>
                <span className="lbl">Need a hand?</span>
                <span className="mute" style={{ fontSize: 13.5 }}>
                  Support: +91 40 4917 2200 · support@xpoindia.com
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 6: PLAN & BILLING */}
          {S.screen === 'billing' && (
            <div className="page" style={{ padding: '26px 28px 90px', maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="kpis">
                <div className="kpi">
                  <b>{S.credits}</b>
                  <span>Free replies left</span>
                </div>
                <div className="kpi">
                  <b>{S.opportunities.filter((o) => o.myReplyStatus === 'none').length}</b>
                  <span>New matched</span>
                </div>
                <div className="kpi">
                  <b>{connectedList.length}</b>
                  <span>Connected</span>
                </div>
              </div>

              <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span className="lbl">How replies work</span>
                <span className="mute" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                  You get matched leads in your categories for free, with zero commission on deals. Each reply you send uses one free reply. You have {S.credits} free replies left.
                </span>
                <button
                  type="button"
                  className="btn red"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }));
                  }}
                >
                  Get more replies
                </button>
              </div>

              <div className="card flat" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--sf2)', border: '1px solid var(--ln)' }}>
                <span className="lbl">Need a hand?</span>
                <span className="mute" style={{ fontSize: 13.5 }}>
                  Support: +91 40 4917 2200 · support@xpoindia.com
                </span>
              </div>
            </div>
          )}

          {/* MOBILE TAB BAR */}
          <nav className="mtab" aria-label="Tabs" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: 'var(--sf)', borderTop: '1px solid var(--ln)', display: 'none', zIndex: 30 }}>
            <button
              type="button"
              className="tb"
              aria-selected={S.screen === 'feed' || S.screen === 'opp'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
              </svg>
              <span style={{ fontSize: 11 }}>Requests</span>
            </button>
            <button
              type="button"
              className="tb"
              aria-selected={S.screen === 'replies'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontSize: 11 }}>Replies</span>
            </button>
            <button
              type="button"
              className="tb"
              aria-selected={S.screen === 'conn'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              <span style={{ fontSize: 11 }}>Connected</span>
            </button>
            <button
              type="button"
              className="tb"
              aria-selected={S.screen === 'cats'}
              onClick={() => setS((prev) => ({ ...prev, screen: 'cats' }))}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
                <circle cx="7" cy="7" r="1" />
              </svg>
              <span style={{ fontSize: 11 }}>Categories</span>
            </button>
          </nav>
        </div>
      </div>
{/* SEND REPLY MODAL */}
      {S.sheet?.type === 'reply' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Send a reply to client</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                Uses 1 reply credit ({S.credits} left). Phone numbers stay hidden until the client connects.
              </div>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl" style={{ display: 'block', marginBottom: 6 }}>
                  Short note on your relevant work (2–3 lines)
                </label>
                <textarea
                  className="inp ta"
                  rows={3}
                  placeholder="E.g. We supply 3-ply printed mailer boxes to 40+ D2C brands in Hyderabad from our Jeedimetla unit. Can deliver 10,000 boxes in 9 days."
                  value={S.pitchDraft}
                  onChange={(e) => setS((prev) => ({ ...prev, pitchDraft: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label className="lbl" style={{ display: 'block', marginBottom: 6 }}>
                    Delivery timeline
                  </label>
                  <select
                    className="inp"
                    value={S.timelineDraft}
                    onChange={(e) => setS((prev) => ({ ...prev, timelineDraft: e.target.value }))}
                  >
                    <option>Within 1 week</option>
                    <option>Within 2 weeks</option>
                    <option>3–4 weeks</option>
                    <option>1–2 months</option>
                  </select>
                </div>
                <div>
                  <label className="lbl" style={{ display: 'block', marginBottom: 6 }}>
                    Indicative quote (optional)
                  </label>
                  <input
                    className="inp"
                    placeholder="E.g. ₹14.50 / box + GST"
                    value={S.quoteDraft}
                    onChange={(e) => setS((prev) => ({ ...prev, quoteDraft: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ln)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button className="btn b2" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
                Cancel
              </button>
              <button
                className="btn b1"
                onClick={() => S.sheet?.type === 'reply' && submitReply(S.sheet.oppId)}
              >
                Send reply · 1 credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {S.capModalOpen && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, capModalOpen: false }))}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Matched categories &amp; capabilities</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                Choose the categories Klo Tech serves to receive instant 5-minute Wave 1 alerts.
              </div>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  'Web & Mobile Development',
                  'Shopify & E-commerce',
                  'Custom ERP & Portals',
                  'UI/UX & Frontend',
                  'Packaging & Printing',
                  'Solar & Clean Energy',
                  'CNC & Sheet Metal',
                  'Digital Marketing & Ads',
                ].map((cat) => {
                  const on = S.capabilities.includes(cat);
                  return (
                    <button
                      key={cat}
                      className={`chipb ${on ? 'on' : ''}`}
                      onClick={() =>
                        setS((prev) => ({
                          ...prev,
                          capabilities: on
                            ? prev.capabilities.filter((x) => x !== cat)
                            : [...prev.capabilities, cat],
                        }))
                      }
                    >
                      {on ? '✓ ' : '+ '}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ln)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="btn b1"
                onClick={() => {
                  setS((prev) => ({ ...prev, capModalOpen: false }));
                  toast('ok', 'Categories updated', 'Your matched feed and WhatsApp alerts are updated.');
                  postMarketplaceAction('partner.update_account', {
                    capabilities: S.capabilities,
                  }).catch(() => {});
                }}
              >
                Save categories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED 4-STATE CHECKOUT MODAL (Matches Client App .opt radio cards) */}
      {S.sheet?.type === 'checkout' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Get Partner Plan"
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 20 }}>XPO Partner Plan</b>
              <button
                type="button"
                className="btn bl"
                onClick={() => setS((prev) => ({ ...prev, sheet: null }))}
              >
                Close
              </button>
            </div>
            <span style={{ fontSize: 14, color: 'var(--tx2)' }}>
              50 replies a month · Priority Wave 1 matching · Cancel any time.
            </span>

            <div className="fld">
              <span>Billing country</span>
              <div
                role="radiogroup"
                aria-label="Billing country"
                style={{
                  display: 'inline-flex',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                <button
                  type="button"
                  role="radio"
                  className="seg"
                  aria-checked={S.country === 'IN'}
                  onClick={() => setS((prev) => ({ ...prev, country: 'IN', payMethod: 'upi' }))}
                  style={
                    S.country === 'IN'
                      ? { background: 'var(--inv)', color: '#fff' }
                      : { background: 'transparent', color: 'var(--tx2)' }
                  }
                >
                  India
                </button>
                <button
                  type="button"
                  role="radio"
                  className="seg"
                  aria-checked={S.country === 'AE'}
                  onClick={() => setS((prev) => ({ ...prev, country: 'AE', payMethod: 'paypal' }))}
                  style={
                    S.country === 'AE'
                      ? { background: 'var(--inv)', color: '#fff' }
                      : { background: 'transparent', color: 'var(--tx2)' }
                  }
                >
                  Outside India
                </button>
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label="Payment method"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {(S.country === 'IN'
                ? ([
                    ['upi', 'UPI AutoPay', 'Razorpay · GPay, PhonePe, Paytm, any UPI app'],
                    ['card', 'Debit or credit card', 'Razorpay · Visa, Mastercard, RuPay'],
                    ['paypal', 'PayPal', 'Pay in ₹ with your PayPal account'],
                  ] as const)
                : ([
                    ['paypal', 'PayPal', 'Billed in US$ · cards accepted through PayPal'],
                  ] as const)
              ).map(([mKey, mLabel, mSub]) => (
                <button
                  key={mKey}
                  type="button"
                  role="radio"
                  className="opt"
                  aria-checked={S.payMethod === mKey}
                  onClick={() => setS((prev) => ({ ...prev, payMethod: mKey }))}
                  style={
                    S.payMethod === mKey
                      ? { background: 'var(--sf)', border: '2px solid var(--tx)' }
                      : { background: 'var(--sf)', border: '1.5px solid var(--ln2)' }
                  }
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <b style={{ fontSize: 15 }}>{mLabel}</b>
                    <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{mSub}</span>
                  </span>
                  <span aria-hidden="true" style={{ fontWeight: 800 }}>
                    {S.payMethod === mKey ? '●' : '○'}
                  </span>
                </button>
              ))}
            </div>

            <div
              style={{
                borderTop: '1px solid var(--ln)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Partner Plan, monthly (50 replies)</span>
                <span>{S.country === 'IN' ? '₹999.00' : '$19.99'}</span>
              </div>
              {S.country === 'IN' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST 18%</span>
                  <span>₹179.82</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                <span>Due today</span>
                <span>{S.country === 'IN' ? '₹1,178.82' : '$19.99'}</span>
              </div>
            </div>

            <button type="button" className="btn b1" onClick={startPayment}>
              Pay {S.country === 'IN' ? '₹1,178.82' : '$19.99'} with{' '}
              {{ upi: 'UPI', card: 'card', paypal: 'PayPal' }[S.payMethod]}
            </button>
          </section>
        </div>
      )}

      {S.sheet?.type === 'processing' && (
        <div className="scrim">
          <div className="dialog" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Confirming your payment…</div>
            <div style={{ fontSize: 14, color: 'var(--tx2)' }}>{S.sheet.label}</div>
          </div>
        </div>
      )}

      {S.sheet?.type === 'paysuccess' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div
            className="dialog"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="chip g" style={{ alignSelf: 'flex-start' }}>
              Payment confirmed
            </span>
            <b style={{ fontSize: 22 }}>Partner Plan is active</b>
            <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
              50 replies added until 4 Dec 2026. GST invoice emailed.
            </span>
            <button
              type="button"
              className="btn b1"
              onClick={() => setS((prev) => ({ ...prev, sheet: null }))}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {S.sheet?.type === 'payfail' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div className="dialog" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <span className="chip r" style={{ marginBottom: 10 }}>
              Payment didn&apos;t go through
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              {S.payMethod === 'upi'
                ? 'Your bank declined the UPI mandate'
                : S.payMethod === 'paypal'
                ? "PayPal couldn't complete the payment"
                : 'Your card was declined'}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 18 }}>
              Nothing was charged. You can retry or choose another payment method.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn b2" onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }))}>
                Use another method
              </button>
              <button className="btn b1" onClick={startPayment}>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {S.sheet?.type === 'cancel' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div className="dialog" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Cancel Partner Plan?</div>
            <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 18 }}>
              You&apos;ll keep your remaining {S.credits} replies until the end of your current billing cycle.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn b2" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
                Keep plan
              </button>
              <button className="btn b1" onClick={confirmCancelPlan}>
                Yes, cancel plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS / TOASTS */}
      <div className="toastwrap">
        {S.alerts.map((a) => (
          <div key={a.id} className="toastitem">
            <div className={`toasticon ${a.tone}`}>
              {a.tone === 'ok' ? '✓' : a.tone === 'warn' || a.tone === 'err' ? '!' : 'i'}
            </div>
            <div className="toastbody">
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.title}</div>
              {a.msg && <div style={{ fontSize: 12.5, color: 'var(--tx2)', marginTop: 2 }}>{a.msg}</div>}
            </div>
            <button
              className="ib"
              style={{ width: 26, height: 26, border: 0 }}
              onClick={() => dismissAlert(a.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* PROTOTYPE CONTROLS DRAWER (Only shown when forceMobileSim is active) */}
      {forceMobileSim && (
        <section
          aria-label="Prototype controls"
          className="proto"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 30,
            width: 280,
            background: 'var(--inv)',
            color: '#fff',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 18px 40px -18px rgba(0,0,0,.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 12.5,
          }}
        >
          <button
            type="button"
            onClick={() => setS((prev) => ({ ...prev, ctlOpen: !prev.ctlOpen }))}
            style={{
              background: 'none',
              border: 0,
              color: '#fff',
              font: "800 13px 'Plus Jakarta Sans', sans-serif",
              display: 'flex',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: '#C8102E' }} />
              Prototype controls
            </span>
            <span style={{ marginLeft: 10 }}>{S.ctlOpen ? '−' : '+'}</span>
          </button>

          {S.ctlOpen && (
            <>
              <span style={{ color: '#B9BCC4' }}>Jump to a situation</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(
                  [
                    ['active', 'Active partner'],
                    ['incoming', 'Client requests'],
                    ['zero', 'Out of replies'],
                    ['paid', 'Plan active'],
                    ['overseas', 'Overseas (USD)'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="ctl"
                    onClick={() => applyScene(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span style={{ color: '#B9BCC4' }}>Act as the client side</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button type="button" className="ctl" onClick={trigNewMatch}>
                  New Wave 1 matched request arrives
                </button>
                <button type="button" className="ctl" onClick={trigClientUnlocks}>
                  Client unlocks your reply
                </button>
                <button
                  type="button"
                  className="ctl"
                  onClick={() => {
                    setS((prev) => ({ ...prev, payFail: !prev.payFail }));
                    toast(
                      'info',
                      !S.payFail ? 'Next payment will fail' : 'Next payment will succeed'
                    );
                  }}
                >
                  {S.payFail ? 'Next payment: will fail ✓' : 'Make next payment fail'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                <a
                  href={getXpoWhatsAppBotUrl('partner')}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#86EFAC', fontWeight: 700, textDecoration: 'none' }}
                >
                  💬 Open WhatsApp Bot →
                </a>
                <Link
                  href="/dashboard/client"
                  style={{ color: '#9FC1FF', fontWeight: 700, textDecoration: 'none' }}
                >
                  Client app →
                </Link>
                <Link
                  href="/superadmin"
                  style={{ color: '#9FC1FF', fontWeight: 700, textDecoration: 'none' }}
                >
                  Superadmin →
                </Link>
              </div>
            </>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
