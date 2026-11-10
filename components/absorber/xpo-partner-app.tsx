'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchMarketplaceState,
  postMarketplaceAction,
  subscribeMarketplaceSync,
} from '@/lib/marketplace/sync-client';

export type PartnerScreenId =
  | 'feed'
  | 'opp'
  | 'replies'
  | 'conn'
  | 'notifs'
  | 'billing'
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

  const activeOpp = S.opportunities.find((o) => o.id === S.oppId) || S.opportunities[0];
  const isSim = forceMobileSim || mobileSim;

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
          <div
            style={{
              background: 'var(--sf)',
              borderBottom: '1px solid var(--ln)',
              padding: '6px 18px 4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11.5,
              fontWeight: 800,
              color: 'var(--tx)',
              flexShrink: 0,
            }}
          >
            <span>9:41</span>
            <span
              style={{
                width: 76,
                height: 16,
                borderRadius: 99,
                background: '#15171C',
                display: 'inline-block',
              }}
            />
            <span>5G · 100%</span>
          </div>
        )}
        <div className="shell">
        {/* LEFT SIDEBAR */}
        <aside
          className="side"
          style={{
            background: 'var(--sf)',
            borderRight: '1px solid var(--ln)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: '4px 10px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <img
              src="/xpo-logo.png"
              alt="XPO"
              style={{ height: 28, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
            />
            <span className="chip b" style={{ fontSize: 10.5 }}>
              PARTNER
            </span>
          </div>

          <button
            type="button"
            className="btn b1"
            onClick={() => setS((prev) => ({ ...prev, capModalOpen: true }))}
            style={{ width: '100%' }}
          >
            + My categories ({S.capabilities.length})
          </button>

          <nav aria-label="Partner" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              type="button"
              className={`nav pn ${S.screen === 'feed' || S.screen === 'opp' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Matched requests</span>
              {incomingCount > 0 ? (
                <span className="cnt">{incomingCount}</span>
              ) : (
                <span className="cnt muted">{S.opportunities.filter((o) => o.matched).length}</span>
              )}
            </button>

            <button
              type="button"
              className={`nav pn ${S.screen === 'replies' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>My replies</span>
              <span className="cnt muted">{repliesList.length}</span>
            </button>

            <button
              type="button"
              className={`nav pn ${S.screen === 'conn' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Connected</span>
              {connectedList.length > 0 && <span className="cnt muted">{connectedList.length}</span>}
            </button>

            <button
              type="button"
              className={`nav pn ${S.screen === 'notifs' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'notifs' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              </svg>
              <span>Notifications</span>
              {unreadCount > 0 && <span className="cnt">{unreadCount}</span>}
            </button>
          </nav>

          <div
            style={{
              marginTop: 'auto',
              padding: 12,
              borderTop: '1px solid var(--ln)',
              fontSize: 12,
              color: 'var(--tx3)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--tx2)', marginBottom: 2 }}>Need a hand?</div>
              WhatsApp us at <span className="mono">+91 40 4917 2200</span>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 6, borderTop: '1px solid var(--ln)' }}>
              <Link
                href="/dashboard/client"
                style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx2)', textDecoration: 'none' }}
              >
                Client view →
              </Link>
              <Link
                href="/superadmin"
                style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx2)', textDecoration: 'none' }}
              >
                Superadmin →
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div className="col">
          {/* TOPBAR */}
          <header className="top" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/xpo-logo.png"
                alt="XPO"
                className="only-sm"
                style={{ height: 24, width: 'auto', objectFit: 'contain' }}
              />
              {S.screen === 'opp' && activeOpp && (
                <div className="crumb fx">
                  <button
                    className="bl"
                    style={{ fontSize: 13 }}
                    onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
                  >
                    Matched requests
                  </button>
                  <span>/</span>
                  <b className="truncate max-w-[200px] sm:max-w-[360px]">{activeOpp.title}</b>
                </div>
              )}
              {S.screen === 'notifs' && (
                <div className="crumb fx">
                  <span>Notifications &amp; Alerts</span>
                </div>
              )}
              {['profile', 'verify', 'billing', 'settings', 'help'].includes(S.screen) && (
                <div className="crumb fx">
                  <span>Account</span>
                  <span>/</span>
                  <b>
                    {S.screen === 'profile'
                      ? 'Profile'
                      : S.screen === 'verify'
                      ? 'Verification'
                      : S.screen === 'billing'
                      ? 'Account & Plan'
                      : S.screen === 'settings'
                      ? 'Settings & categories'
                      : 'Help & privacy'}
                  </b>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              {!hideSimToolbar && (
                <>
                  <button
                    type="button"
                    className="pill hide-sm"
                    onClick={() => setMobileSim((m) => !m)}
                    title="Toggle 390×844 Mobile Application Simulator"
                  >
                    <span>📱 {mobileSim ? 'Desktop View' : 'Mobile App'}</span>
                  </button>
                  <Link
                    href="/simulator"
                    className="pill hide-sm"
                    style={{ textDecoration: 'none', color: 'var(--tx)' }}
                    title="Open Live Mobile & WhatsApp Automation Studio"
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: '#16A34A' }} />
                    <span>WhatsApp &amp; Mobile Sim</span>
                  </Link>
                </>
              )}
              {S.screen !== 'billing' && (
                <button
                  className="pill"
                  onClick={() => setS((prev) => ({ ...prev, screen: 'billing' }))}
                  title="Each reply to a client request uses 1 reply credit"
                >
                  <span className="pdot" style={{ background: creditDot }} />
                  <span>{creditLabel}</span>
                </button>
              )}

              <button
                className="ib"
                aria-label="Notifications"
                onClick={() =>
                  setS((prev) => ({
                    ...prev,
                    menuOpen: prev.menuOpen === 'notif' ? 'none' : 'notif',
                  }))
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
              </button>

              <button
                className="av"
                aria-label="Account menu"
                onClick={() =>
                  setS((prev) => ({
                    ...prev,
                    menuOpen: prev.menuOpen === 'user' ? 'none' : 'user',
                  }))
                }
              >
                KT
              </button>

              {S.menuOpen === 'notif' && (
                <div className="menu" style={{ width: 340, right: 44, maxWidth: 'calc(100vw - 24px)' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--ln)',
                      marginBottom: 4,
                    }}
                  >
                    <b style={{ fontSize: 13.5 }}>Notifications</b>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn bl"
                        style={{ minHeight: 0, padding: 0, fontSize: 12 }}
                        onClick={() =>
                          setS((prev) => ({
                            ...prev,
                            notifs: prev.notifs.map((n) => ({ ...n, unread: false })),
                          }))
                        }
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {S.notifs.slice(0, 4).map((n) => (
                    <button
                      key={n.id}
                      className="mi"
                      style={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 4,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: n.unread ? 'var(--rbg2)' : 'transparent',
                        marginBottom: 2,
                      }}
                      onClick={() =>
                        setS((prev) => ({
                          ...prev,
                          menuOpen: 'none',
                          notifs: prev.notifs.map((x) =>
                            x.id === n.id ? { ...x, unread: false } : x
                          ),
                          screen: n.targetScreen,
                          oppId: n.oppId || prev.oppId,
                        }))
                      }
                    >
                      <div style={{ fontSize: 13, fontWeight: n.unread ? 700 : 500, color: 'var(--tx)', textAlign: 'left' }}>
                        {n.text}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{n.time}</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, menuOpen: 'none', screen: 'notifs' }))}
                    style={{
                      borderTop: '1px solid var(--ln)',
                      marginTop: 4,
                      justifyContent: 'center',
                      color: '#C8102E',
                      fontWeight: 700,
                    }}
                  >
                    <span>View all notifications →</span>
                  </button>
                </div>
              )}

              {S.menuOpen === 'user' && (
                <div className="menu" role="menu" aria-label="Account">
                  <div
                    style={{
                      padding: '12px 12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      borderBottom: '1px solid var(--ln)',
                      marginBottom: 6,
                    }}
                  >
                    <b style={{ fontSize: 15 }}>Klo Tech</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      Rohan Rao · {S.country === 'IN' ? 'Hyderabad, India' : 'Dubai, UAE'}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'profile', menuOpen: 'none' }))}
                  >
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'verify', menuOpen: 'none' }))}
                  >
                    <span>Verification</span>
                    <span className="chip g">Verified</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'billing', menuOpen: 'none' }))}
                  >
                    <span>Account &amp; Plan</span>
                    <span className={`chip ${S.plan === 'active' ? 'g' : ''}`}>
                      {S.plan === 'active' ? 'Plan active' : `${S.credits} free`}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'settings', menuOpen: 'none' }))}
                  >
                    <span>Settings &amp; categories</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'help', menuOpen: 'none' }))}
                  >
                    <span>Help &amp; privacy</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() =>
                      setS((prev) => ({ ...prev, dark: !prev.dark, menuOpen: 'none' }))
                    }
                  >
                    <span>{S.dark ? 'Light mode' : 'Dark mode'}</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{S.dark ? 'On' : 'Off'}</span>
                  </button>
                  <div style={{ borderTop: '1px solid var(--ln)', margin: '6px 0' }} />
                  <Link href="/dashboard/client" role="menuitem" className="mi">
                    <span>Switch to Client view</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>→</span>
                  </Link>
                  <Link href="/superadmin" role="menuitem" className="mi">
                    <span>Superadmin Console</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>→</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    style={{
                      color: 'var(--rtx)',
                      borderTop: '1px solid var(--ln)',
                      borderRadius: '0 0 10px 10px',
                      marginTop: 6,
                    }}
                    onClick={() => {
                      fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
                      router.push('/login');
                    }}
                  >
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* SCREEN 1: MATCHED REQUESTS FEED */}
          {S.screen === 'feed' && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              {/* Incoming connection request highlight banner if any */}
              {incomingCount > 0 && (
                <div
                  className="card"
                  style={{
                    padding: '16px 20px',
                    marginBottom: 20,
                    borderLeft: '4px solid #C8102E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="chip r">Action needed</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                        XPO-REQ-40971
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>
                      Test Traders (Pavan) used 1 view to see your details
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      Confirm to share your phone &amp; WhatsApp and unlock their direct number.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn b1 sm" onClick={() => acceptClientRequest('req-1')}>
                      Accept &amp; share contact
                    </button>
                    <button className="btn b2 sm" onClick={() => openOpp('req-1')}>
                      Review request
                    </button>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '-.025em',
                      margin: '0 0 4px',
                    }}
                  >
                    Client requests matched to Klo Tech
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: 0 }}>
                    Sent in 5-minute waves to verified partners in your categories. Zero commission on deals.
                  </p>
                </div>
                <button
                  className="btn b2 sm"
                  onClick={() => setS((prev) => ({ ...prev, capModalOpen: true }))}
                >
                  My categories ({S.capabilities.length})
                </button>
              </div>

              {/* Filter & search bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div className="seg-group">
                  <button
                    className={S.filterTab === 'matched' ? 'on' : ''}
                    onClick={() => setS((prev) => ({ ...prev, filterTab: 'matched' }))}
                  >
                    Matched ({S.opportunities.filter((o) => o.matched).length})
                  </button>
                  <button
                    className={S.filterTab === 'all' ? 'on' : ''}
                    onClick={() => setS((prev) => ({ ...prev, filterTab: 'all' }))}
                  >
                    All requests ({S.opportunities.length})
                  </button>
                  <button
                    className={S.filterTab === 'overseas' ? 'on' : ''}
                    onClick={() => setS((prev) => ({ ...prev, filterTab: 'overseas' }))}
                  >
                    Overseas USD ({S.opportunities.filter((o) => o.isOverseas).length})
                  </button>
                </div>

                <input
                  className="inp"
                  style={{ maxWidth: 280, width: '100%' }}
                  placeholder="Search keyword, city or ID"
                  value={S.search}
                  onChange={(e) => setS((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>

              {/* Feed cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOpps.filter((o) => !(incomingCount > 0 && o.id === 'req-1' && o.myReplyStatus === 'client_requested')).map((o) => (
                  <div
                    key={o.id}
                    className="rowb"
                    style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}
                    onClick={() => openOpp(o.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                          {o.ref}
                        </span>
                        <span className="chip">{o.cat}</span>
                        {o.isOverseas && <span className="chip p">Overseas · USD</span>}
                      </div>

                      <div>
                        {o.myReplyStatus === 'client_requested' && (
                          <span className="chip r">
                            <span className="pdot" style={{ background: '#C8102E' }} />
                            Client requested your contact
                          </span>
                        )}
                        {o.myReplyStatus === 'sent_waiting' && (
                          <span className="chip b">Reply sent · Waiting on client</span>
                        )}
                        {o.myReplyStatus === 'connected' && (
                          <span className="chip g">Connected with {o.clientName}</span>
                        )}
                        {o.myReplyStatus === 'none' && o.waveBadge && (
                          <span className="chip a">{o.waveBadge}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{o.title}</div>
                      <div style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.55 }}>{o.brief}</div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        paddingTop: 8,
                        borderTop: '1px solid var(--ln)',
                        fontSize: 12.5,
                        color: 'var(--tx3)',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        📍 {o.loc} · ⏱ {o.when} · 💰 <b style={{ color: 'var(--tx)' }}>{o.budget}</b> · Posted{' '}
                        {o.posted}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--tx)' }}>
                        {o.myReplyStatus === 'none' ? 'View & send reply →' : 'Open details →'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 2: OPPORTUNITY DETAIL */}
          {S.screen === 'opp' && activeOpp && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              <button type="button" className="bl only-sm" style={{ marginBottom: 6, paddingLeft: 0 }} onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}>← Matched requests</button>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                    {activeOpp.ref}
                  </span>
                  <span className="chip">{activeOpp.cat}</span>
                  <span className="chip g">✓ Verified Business</span>
                  {activeOpp.isOverseas && <span className="chip p">Overseas · USD</span>}
                </div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: '-.025em',
                    margin: '0 0 6px',
                  }}
                >
                  {activeOpp.title}
                </h1>
                <div style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                  📍 {activeOpp.loc} · Needed: <b>{activeOpp.when}</b> · Budget: <b>{activeOpp.budget}</b> · Posted{' '}
                  {activeOpp.posted}
                </div>
              </div>

              {/* 4-Stage Opportunity Progress Bar (Mirrors Client Request Detail) */}
              <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                {(() => {
                  const stageIdx =
                    activeOpp.myReplyStatus === 'connected'
                      ? 3
                      : activeOpp.myReplyStatus === 'client_requested'
                      ? 2
                      : activeOpp.myReplyStatus === 'sent_waiting'
                      ? 1
                      : 0;
                  const stages = [
                    '1. Wave 1 Offer',
                    '2. Reply Sent',
                    '3. Client Unlocked',
                    '4. Connected',
                  ];
                  return (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {stages.map((label, idx) => {
                          const active = idx <= stageIdx;
                          return (
                            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span
                                style={{
                                  height: 6,
                                  borderRadius: 99,
                                  background:
                                    idx === 3 && stageIdx === 3
                                      ? '#16A34A'
                                      : active
                                      ? 'var(--inv)'
                                      : 'var(--sf3)',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: idx === stageIdx ? 800 : 600,
                                  color: active ? 'var(--tx)' : 'var(--tx3)',
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                        {stageIdx === 0 &&
                          'Matched to Klo Tech in Wave 1. Send your 2-line pitch and timeline to claim a slot.'}
                        {stageIdx === 1 &&
                          'Your pitch is with the client. You will be alerted on WhatsApp the moment they unlock your reply.'}
                        {stageIdx === 2 &&
                          'Client spent 1 view to unlock your reply! Accept below to exchange direct phone & WhatsApp numbers.'}
                        {stageIdx === 3 &&
                          'Both sides agreed — direct phone, WhatsApp, and email are unlocked with zero commission.'}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Client specification card */}
              <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Client brief
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: '0 0 14px', color: 'var(--tx)' }}>
                  {activeOpp.brief}
                </p>
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: '1px solid var(--ln)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    fontSize: 12.5,
                    color: 'var(--tx2)',
                  }}
                >
                  <span>
                    Posted by:{' '}
                    <b>
                      {activeOpp.myReplyStatus === 'connected'
                        ? `${activeOpp.clientName} · ${activeOpp.clientCompany}`
                        : activeOpp.clientLabel}
                    </b>
                  </span>
                  <span>Zero platform commission · Direct settlement</span>
                </div>
              </div>

              {/* Status-dependent action card */}
              {activeOpp.myReplyStatus === 'client_requested' && (
                <div
                  className="card"
                  style={{
                    padding: 22,
                    borderLeft: '4px solid #C8102E',
                    marginBottom: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="chip r">Client unlocked your reply</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>
                    {activeOpp.clientCompany} ({activeOpp.clientName}) wants to speak with you
                  </h3>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 16px', lineHeight: 1.55 }}>
                    They spent 1 view to see your reply. Accept to share your contact details and unlock{' '}
                    {activeOpp.clientName}&apos;s direct WhatsApp and phone number. If you decline, their view is
                    refunded.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn b1" onClick={() => acceptClientRequest(activeOpp.id)}>
                      Accept &amp; unlock client contact
                    </button>
                    <button className="btn b2" onClick={() => declineClientRequest(activeOpp.id)}>
                      Decline (refunds client&apos;s view)
                    </button>
                  </div>
                </div>
              )}

              {activeOpp.myReplyStatus === 'connected' && (
                <div
                  className="card"
                  style={{
                    padding: 22,
                    borderLeft: '4px solid #16A34A',
                    marginBottom: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="chip g">✓ Connected with client</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
                    {activeOpp.clientName} · {activeOpp.clientCompany}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 14 }}>
                    Phone: <span className="mono">{activeOpp.clientPhone}</span> · Email:{' '}
                    <span className="mono">{activeOpp.clientEmail}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      className="btn b4"
                      href={`https://wa.me/${activeOpp.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${activeOpp.clientName}, reaching out from Klo Tech via XPO regarding "${activeOpp.title}" (${activeOpp.ref}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Message on WhatsApp
                    </a>
                    <a className="btn b2" href={`tel:${activeOpp.clientPhone}`}>
                      Call {activeOpp.clientPhone}
                    </a>
                  </div>
                </div>
              )}

              {activeOpp.myReplyStatus === 'sent_waiting' && (
                <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="chip b">Reply sent · Waiting on client</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{activeOpp.repliedAt}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Your note to the client:</div>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 9,
                      background: 'var(--sf2)',
                      border: '1px solid var(--ln)',
                      fontSize: 13.5,
                      color: 'var(--tx2)',
                    }}
                  >
                    “{activeOpp.myPitch}”
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 8 }}>
                    Proposed timeline: <b>{activeOpp.myTimeline}</b> · Indicative quote: <b>{activeOpp.myQuote}</b>
                  </div>
                </div>
              )}

              {activeOpp.myReplyStatus === 'none' && (
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                    Can Klo Tech take this on?
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 16px', lineHeight: 1.55 }}>
                    Send a short 2-line note with your relevant experience and timeline. Sending a reply uses{' '}
                    <b>1 reply credit</b> ({S.credits} left). Your phone number stays private until both sides agree
                    to connect.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn b1" onClick={() => openReplySheet(activeOpp.id)}>
                      {S.credits > 0 ? 'Send a reply · uses 1 reply' : 'Get Partner Plan to reply'}
                    </button>
                    <button
                      className="btn b2"
                      onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
                    >
                      Back to matched requests
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3: MY REPLIES */}
          {S.screen === 'replies' && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>My replies</h1>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 20px' }}>
                Every client request Klo Tech has replied to.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {repliesList.map((r) => (
                  <div
                    key={r.id}
                    className="rowb"
                    onClick={() => openOpp(r.id)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                          {r.ref}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{r.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                        “{r.myPitch}”
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {r.myReplyStatus === 'client_requested' && (
                        <span className="chip r">Client requested contact</span>
                      )}
                      {r.myReplyStatus === 'sent_waiting' && (
                        <span className="chip b">Waiting on client</span>
                      )}
                      {r.myReplyStatus === 'connected' && <span className="chip g">Connected</span>}
                      {r.myReplyStatus === 'declined' && <span className="chip">Declined</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4: CONNECTED CLIENTS */}
          {S.screen === 'conn' && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Connected clients</h1>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 20px' }}>
                Direct client contacts you&apos;ve unlocked. Reach out on WhatsApp or phone — zero commission.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {connectedList.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="chip g">✓ Connected</span>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--tx3)' }}>
                            {c.ref}
                          </span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{c.clientCompany}</div>
                        <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 6 }}>
                          {c.clientName} · {c.loc} · For: <b>{c.title}</b>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                          Phone: <span className="mono">{c.clientPhone}</span> · Email:{' '}
                          <span className="mono">{c.clientEmail}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          className="btn b4 sm"
                          href={`https://wa.me/${c.clientPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                        <a className="btn b2 sm" href={`tel:${c.clientPhone}`}>
                          Call
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4B: NOTIFICATIONS & ALERTS (Unified with Client App) */}
          {S.screen === 'notifs' && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>
                    Notifications &amp; Alerts
                  </h1>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tx2)' }}>
                    Wave 1 matches, client unlock requests, and connection updates.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn bl"
                    onClick={() =>
                      setS((prev) => ({
                        ...prev,
                        notifs: prev.notifs.map((n) => ({ ...n, unread: false })),
                      }))
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="alw">
                {S.notifs.map((n) => (
                  <div
                    key={n.id}
                    className="al"
                    onClick={() =>
                      setS((prev) => ({
                        ...prev,
                        notifs: prev.notifs.map((x) =>
                          x.id === n.id ? { ...x, unread: false } : x
                        ),
                        screen: n.targetScreen,
                        oppId: n.oppId || prev.oppId,
                      }))
                    }
                    style={{
                      background: n.unread ? 'var(--rbg2)' : 'var(--sf)',
                    }}
                  >
                    <span
                      className="alic"
                      style={
                        n.unread
                          ? { background: 'var(--rbg)', color: '#C8102E' }
                          : { background: 'var(--gbg)', color: 'var(--gtx)' }
                      }
                    >
                      {n.unread ? '!' : '✓'}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          alignItems: 'baseline',
                        }}
                      >
                        <b style={{ fontSize: 14.5, fontWeight: n.unread ? 800 : 600 }}>
                          {n.text}
                        </b>
                        <span style={{ fontSize: 12, color: 'var(--tx2)', whiteSpace: 'nowrap' }}>
                          {n.time}
                        </span>
                      </span>
                    </span>
                    {n.unread && <span className="udot" aria-label="Unread" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 5: UNIFIED ACCOUNT (PROFILE, VERIFICATION, ACCOUNT & PLAN, SETTINGS, HELP) */}
          {['profile', 'verify', 'billing', 'settings', 'help'].includes(S.screen) && (
            <div className="pg" style={{ maxWidth: 1040, padding: '28px clamp(16px, 4vw, 48px) 140px' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 14px' }}>Account</h1>

              <div
                role="tablist"
                aria-label="Partner Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                  width: 'fit-content',
                  marginBottom: 22,
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify', 'Verification'],
                    ['billing', 'Account & Plan'],
                    ['settings', 'Settings & categories'],
                    ['help', 'Help & privacy'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={S.screen === key}
                    onClick={() => setS((prev) => ({ ...prev, screen: key }))}
                    style={
                      S.screen === key
                        ? {
                            background: 'var(--sf)',
                            color: 'var(--tx)',
                            boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                          }
                        : { background: 'transparent', color: 'var(--tx2)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PROFILE */}
              {S.screen === 'profile' && (
                <section
                  className="card"
                  style={{
                    maxWidth: 760,
                    padding: 24,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                  }}
                >
                  <label className="fld">
                    Contact name
                    <input className="inp" defaultValue="Rohan Rao" />
                  </label>
                  <label className="fld">
                    WhatsApp / mobile number
                    <input className="inp" value="+91 56794 24578" readOnly />
                  </label>
                  <label className="fld">
                    Partner business name
                    <input className="inp" defaultValue="Klo Tech" />
                  </label>
                  <label className="fld">
                    Primary city
                    <select className="inp" defaultValue="Hyderabad">
                      <option>Hyderabad</option>
                      <option>Mumbai</option>
                      <option>Bengaluru</option>
                      <option>Pune</option>
                      <option>Delhi NCR</option>
                    </select>
                  </label>
                  <label className="fld">
                    Website / portfolio URL
                    <input className="inp" defaultValue="https://klotech.in" />
                  </label>
                  <label className="fld">
                    Years in business
                    <input className="inp" defaultValue="6 years · Pan-India delivery" />
                  </label>
                  <div className="fld" style={{ gridColumn: '1 / -1' }}>
                    <span>Billing country</span>
                    <div className="seg-group">
                      <button
                        type="button"
                        className={S.country === 'IN' ? 'on' : ''}
                        onClick={() => setS((prev) => ({ ...prev, country: 'IN', payMethod: 'upi' }))}
                      >
                        India (₹ + GST)
                      </button>
                      <button
                        type="button"
                        className={S.country === 'AE' ? 'on' : ''}
                        onClick={() => setS((prev) => ({ ...prev, country: 'AE', payMethod: 'paypal' }))}
                      >
                        Outside India ($ USD)
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      className="btn b3"
                      onClick={() => toast('ok', 'Partner profile saved')}
                    >
                      Save changes
                    </button>
                  </div>
                </section>
              )}

              {/* TAB 2: VERIFICATION */}
              {S.screen === 'verify' && (
                <section
                  className="card"
                  style={{
                    maxWidth: 760,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <b style={{ fontSize: 17 }}>Verified Partner badge</b>
                    <span className="chip g">Verified</span>
                  </div>
                  <span style={{ fontSize: 14, lineHeight: '21px', color: 'var(--tx2)' }}>
                    GST certificate (27AABCK8821M1Z9) checked on 28 Oct. The Verified · GST checked badge shows on every reply you send to clients.
                  </span>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'var(--sf2)',
                      border: '1px solid var(--ln)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                      fontSize: 13.5,
                    }}
                  >
                    <div>
                      <div className="lbl" style={{ marginBottom: 2 }}>Legal entity</div>
                      <b>Klo Tech Pvt Ltd</b>
                    </div>
                    <div>
                      <div className="lbl" style={{ marginBottom: 2 }}>GSTIN / Reg ID</div>
                      <span className="mono">27AABCK8821M1Z9</span>
                    </div>
                    <div>
                      <div className="lbl" style={{ marginBottom: 2 }}>Service coverage</div>
                      <b>Pan-India &amp; Overseas USD</b>
                    </div>
                  </div>
                </section>
              )}

              {/* TAB 3: ACCOUNT & PLAN */}
              {S.screen === 'billing' && (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: 16,
                      marginBottom: 18,
                    }}
                  >
                    <section
                      className="card"
                      style={{
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <span className="lbl">Partner replies</span>
                      <b style={{ fontSize: 30 }}>
                        {S.plan === 'active'
                          ? `${S.credits} of 50 plan replies left`
                          : `${S.credits} of 3 free replies left`}
                      </b>
                      <span
                        style={{
                          height: 8,
                          borderRadius: 99,
                          background: 'var(--sf3)',
                          overflow: 'hidden',
                          display: 'block',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            background: 'var(--inv)',
                            width: `${Math.min(100, (S.plan === 'active' ? S.credits / 50 : S.credits / 3) * 100)}%`,
                          }}
                        />
                      </span>
                      <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                        Used only when you send a pitch to a matched client request. Zero commission on deals.
                      </span>
                    </section>

                    <section
                      className="card"
                      style={{
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        borderColor: 'var(--tx)',
                      }}
                    >
                      <span className="lbl">XPO Partner Plan</span>
                      {S.plan === 'active' ? (
                        <>
                          <b style={{ fontSize: 22 }}>Active · renews 4 Dec 2026</b>
                          <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                            {S.country === 'IN'
                              ? '₹999 + 18% GST (₹1,178.82) a month · 50 replies'
                              : '$19.99 a month · 50 replies'}
                          </span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                            <button
                              className="btn b2"
                              onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }))}
                            >
                              Change payment method
                            </button>
                            <button
                              className="btn bl"
                              onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'cancel' } }))}
                            >
                              Cancel plan
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <b style={{ fontSize: 30 }}>
                            {S.country === 'IN' ? '₹999 / month + GST' : '$19.99 / month'}
                          </b>
                          <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                            50 partner replies a month · Priority Wave 1 alerts · cancel any time
                          </span>
                          <button
                            className="btn b1"
                            onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }))}
                          >
                            Get Partner Plan
                          </button>
                        </>
                      )}
                    </section>
                  </div>

                  <section className="card" style={{ overflowX: 'auto', marginBottom: 18 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        minWidth: 540,
                      }}
                    >
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>
                        Activity
                      </div>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>
                        Change
                      </div>
                      <div className="lbl" style={{ padding: '12px 18px', background: 'var(--sf2)' }}>
                        Date
                      </div>
                      {[
                        ...(S.plan === 'active'
                          ? [{ a: 'Partner Plan started · Razorpay UPI AutoPay', c: '+50 plan replies', d: '4 Nov, 11:20' }]
                          : []),
                        { a: 'Replied to XPO-REQ-41299 (Shopify Plus migration)', c: '−1 reply', d: 'Today, 10:15' },
                        { a: 'Replied to XPO-REQ-40971 (E-commerce website)', c: '−1 reply', d: 'Yesterday, 16:15' },
                        { a: 'Starter partner grant', c: '+5 free replies', d: '28 Oct, 09:30' },
                      ].map((row, idx) => (
                        <React.Fragment key={idx}>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>
                            {row.a}
                          </div>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>
                            {row.c}
                          </div>
                          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ln)', fontSize: 13.5 }}>
                            {row.d}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </section>

                  {S.plan === 'active' && (
                    <section
                      className="card"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <b>Invoice XPO-INV-2611-0118</b>
                        <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                          {S.country === 'IN'
                            ? '₹1,178.82 incl. GST ₹179.82 · 4 Nov 2026 · Razorpay'
                            : '$19.99 · 4 Nov 2026 · PayPal'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn b2"
                        onClick={() => toast('ok', 'Invoice XPO-INV-2611-0118 downloaded')}
                      >
                        Download PDF
                      </button>
                    </section>
                  )}
                </>
              )}

              {/* TAB 4: SETTINGS & CATEGORIES */}
              {S.screen === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>Matched categories &amp; skills</div>
                        <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                          You receive 5-minute Wave 1 alerts on WhatsApp for these categories.
                        </div>
                      </div>
                      <button
                        className="btn b2 sm"
                        onClick={() => setS((prev) => ({ ...prev, capModalOpen: true }))}
                      >
                        Edit categories ({S.capabilities.length})
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {S.capabilities.map((c) => (
                        <span key={c} className="chip b">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>WhatsApp &amp; notification preferences</div>
                    <label
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid var(--ln)',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      <div>
                        <div>5-minute Wave 1 alerts on WhatsApp (+91 56794 24578)</div>
                        <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500 }}>
                          Instant alert when a client posts in your matched categories
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: '#C8102E' }} />
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid var(--ln)',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      <div>
                        <div>Quiet hours · 21:00–08:00 IST</div>
                        <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500 }}>
                          Pause non-urgent category alerts overnight
                        </div>
                      </div>
                      <input type="checkbox" style={{ width: 20, height: 20, accentColor: '#C8102E' }} />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 5: HELP & PRIVACY */}
              {S.screen === 'help' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  <section
                    className="card"
                    style={{
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <b style={{ fontSize: 17 }}>Report a problem</b>
                    <label className="fld">
                      What happened?
                      <select className="inp">
                        <option>Unclear or spam client requirement</option>
                        <option>Reply credit used on invalid post</option>
                        <option>Payment or GST invoice issue</option>
                        <option>Something isn&apos;t working</option>
                      </select>
                    </label>
                    <label className="fld">
                      Details
                      <textarea className="inp ta" rows={3} placeholder="Include the XPO-REQ code if applicable" />
                    </label>
                    <button
                      type="button"
                      className="btn b3"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => toast('ok', 'Report sent to XPO Trust & Safety')}
                    >
                      Send to XPO
                    </button>
                  </section>

                  <section
                    className="card"
                    style={{
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <b style={{ fontSize: 17 }}>Your data &amp; privacy</b>
                    <span style={{ fontSize: 13.5, lineHeight: '21px', color: 'var(--tx2)' }}>
                      Your phone number is never shared with clients until you explicitly accept their connection request.
                    </span>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => toast('info', 'Preparing your DPDP partner data archive…')}
                    >
                      Download my data
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => toast('info', 'GST / profile correction request opened')}
                    >
                      Ask for a correction
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      style={{ color: 'var(--rtx)' }}
                      onClick={() => toast('warn', 'Account deletion confirmation required')}
                    >
                      Delete my account…
                    </button>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR (Unified .tpill design matching Client App) */}
      <nav aria-label="Partner Main" className="tabbar">
        <button
          type="button"
          className="tb"
          onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
          style={{ color: ['feed', 'opp'].includes(S.screen) ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              ['feed', 'opp'].includes(S.screen)
                ? { background: 'var(--rbg)', color: '#C8102E' }
                : undefined
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <span>Matched</span>
        </button>

        <button
          type="button"
          className="tb"
          onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
          style={{ color: S.screen === 'replies' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              S.screen === 'replies' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span>Replies ({repliesList.length})</span>
        </button>

        <button
          type="button"
          className="tb"
          onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
          style={{ color: S.screen === 'conn' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              S.screen === 'conn' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </span>
          <span>Connected</span>
        </button>

        <button
          type="button"
          className="tb"
          onClick={() => setS((prev) => ({ ...prev, screen: 'notifs' }))}
          style={{ color: S.screen === 'notifs' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              S.screen === 'notifs' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="dot" style={{ top: -4, right: 4 }}>
                {unreadCount}
              </span>
            )}
          </span>
          <span>Alerts</span>
        </button>

        <button
          type="button"
          className="tb"
          onClick={() => setS((prev) => ({ ...prev, screen: 'billing' }))}
          style={{ color: S.screen === 'billing' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              S.screen === 'billing' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </span>
          <span>Plan</span>
        </button>
      </nav>

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

      {/* PROTOTYPE CONTROLS DRAWER (Unified .proto design matching Client & Superadmin) */}
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
              <button
                type="button"
                onClick={() => setMobileSim((m) => !m)}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: '#86EFAC',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 12.5,
                }}
              >
                📱 {mobileSim ? 'Desktop View' : 'Mobile App Sim'}
              </button>
              <Link
                href="/simulator"
                style={{ color: '#86EFAC', fontWeight: 700, textDecoration: 'none' }}
              >
                WhatsApp Sim →
              </Link>
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
      </div>
    </div>
  );
}
