'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type PartnerScreenId = 'feed' | 'opp' | 'replies' | 'conn' | 'billing';

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
}: {
  initialScreen?: PartnerScreenId;
  initialOppId?: string;
}) {
  const router = useRouter();
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

    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: opp.ref,
          pitchMessage: pitch,
          estimatedTimeline: S.timelineDraft,
          indicativeQuote: S.quoteDraft || 'Open to discuss',
        }),
      });
    } catch {
      // Prototype state continues cleanly
    }

    setS((prev) => ({
      ...prev,
      credits: Math.max(0, prev.credits - 1),
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
        return {
          ...prev,
          plan: 'active',
          credits: prev.credits + 50,
          sheet: null,
        };
      });
      if (!S.payFail) {
        toast('ok', 'Partner Plan active — 50 replies added', 'Your receipt has been emailed.');
      }
    }, 1100);
  };

  const confirmCancelPlan = () => {
    setS((prev) => ({ ...prev, plan: 'free', sheet: null }));
    toast('info', 'Partner Plan cancelled', 'You keep your remaining replies until 4 Dec 2026.');
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

  return (
    <div
      className={`xt ${S.dark ? 'dark' : ''}`}
      onClick={() => {
        if (S.menuOpen !== 'none') setS((prev) => ({ ...prev, menuOpen: 'none' }));
      }}
    >
      <div className="shell">
        {/* LEFT SIDEBAR */}
        <aside className="side hidden md:flex">
          <div
            style={{
              padding: '4px 10px 18px',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              className={`nav ${S.screen === 'feed' || S.screen === 'opp' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Matched requests
              {incomingCount > 0 ? (
                <span className="cnt">{incomingCount}</span>
              ) : (
                <span className="cnt muted">{S.opportunities.filter((o) => o.matched).length}</span>
              )}
            </button>

            <button
              className={`nav ${S.screen === 'replies' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              My replies
              <span className="cnt muted">{repliesList.length}</span>
            </button>

            <button
              className={`nav ${S.screen === 'conn' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Connected
              {connectedList.length > 0 && <span className="cnt muted">{connectedList.length}</span>}
            </button>

            <button
              className={`nav ${S.screen === 'billing' ? 'on' : ''}`}
              onClick={() => setS((prev) => ({ ...prev, screen: 'billing' }))}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Account &amp; Plan
            </button>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: 12,
              borderTop: '1px solid var(--ln)',
              fontSize: 12,
              color: 'var(--tx3)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--tx2)', marginBottom: 2 }}>Need a hand?</div>
            WhatsApp us at <span className="mono">+91 40 4917 2200</span>
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div className="col" style={{ paddingBottom: 68 }}>
          {/* TOPBAR */}
          <header className="top" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/xpo-logo.png"
                alt="XPO"
                className="md:hidden"
                style={{ height: 24, width: 'auto', objectFit: 'contain' }}
              />
              {S.screen === 'opp' && activeOpp ? (
                <div className="crumb">
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
              ) : (
                <div className="crumb">
                  <b>
                    {S.screen === 'feed'
                      ? 'Matched client requests'
                      : S.screen === 'replies'
                      ? 'My replies'
                      : S.screen === 'conn'
                      ? 'Connected clients'
                      : 'Account & Plan'}
                  </b>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <button
                className="pill"
                onClick={() => setS((prev) => ({ ...prev, screen: 'billing' }))}
                title="Each reply to a client request uses 1 reply credit"
              >
                <span className="dot" style={{ background: creditDot }} />
                <span>{creditLabel}</span>
              </button>

              <button
                className="ib"
                aria-label="Notifications"
                onClick={() =>
                  setS((prev) => ({
                    ...prev,
                    menuOpen: prev.menuOpen === 'notif' ? 'none' : 'notif',
                    notifs: prev.notifs.map((n) => ({ ...n, unread: false })),
                  }))
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: '#C8102E',
                    }}
                  />
                )}
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
                <div className="menu" style={{ width: 340 }}>
                  <div
                    style={{
                      padding: '8px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--tx3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                    }}
                  >
                    Updates
                  </div>
                  {S.notifs.map((n) => (
                    <button
                      key={n.id}
                      className="mi"
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}
                      onClick={() =>
                        setS((prev) => ({
                          ...prev,
                          menuOpen: 'none',
                          screen: n.targetScreen,
                          oppId: n.oppId || prev.oppId,
                        }))
                      }
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textAlign: 'left' }}>
                        {n.text}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{n.time}</div>
                    </button>
                  ))}
                </div>
              )}

              {S.menuOpen === 'user' && (
                <div className="menu">
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ln)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5 }}>Klo Tech Pvt Ltd</div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)' }}>
                      Rohan Rao · {S.country === 'IN' ? 'Hyderabad, India' : 'Dubai, UAE'}
                    </div>
                  </div>
                  <button
                    className="mi"
                    onClick={() => setS((prev) => ({ ...prev, screen: 'billing', menuOpen: 'none' }))}
                  >
                    <span>Account &amp; Plan</span>
                  </button>
                  <button
                    className="mi"
                    onClick={() =>
                      setS((prev) => ({ ...prev, dark: !prev.dark, menuOpen: 'none' }))
                    }
                  >
                    <span>Appearance</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{S.dark ? 'Dark' : 'Light'}</span>
                  </button>
                  <button
                    className="mi"
                    onClick={() => router.push('/creator/dashboard')}
                  >
                    <span>Switch to Client app →</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* SCREEN 1: MATCHED REQUESTS FEED */}
          {S.screen === 'feed' && (
            <div style={{ maxWidth: 880, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
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
                <div className="seg">
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
                  style={{ maxWidth: 280 }}
                  placeholder="Search by keyword, city, or XPO-REQ…"
                  value={S.search}
                  onChange={(e) => setS((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>

              {/* Feed cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOpps.map((o) => (
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
                            <span className="dot" style={{ background: '#C8102E' }} />
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
            <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
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
            <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>My replies</h1>
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
            <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Connected clients</h1>
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

          {/* SCREEN 5: ACCOUNT & PARTNER PLAN */}
          {S.screen === 'billing' && (
            <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', padding: '28px 24px 64px' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Account &amp; Partner Plan</h1>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', margin: '0 0 22px' }}>
                Manage your partner replies, billing country, and matched categories.
              </p>

              <div className="card" style={{ padding: 22, marginBottom: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div className="lbl" style={{ marginBottom: 4 }}>
                      {S.plan === 'active' ? 'XPO Partner Plan · Active' : 'Starter Partner Grant'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      {S.credits} partner {S.credits === 1 ? 'reply' : 'replies'} remaining
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}>
                      {S.plan === 'active'
                        ? S.country === 'IN'
                          ? '50 replies / month · ₹999 + 18% GST (₹1,178.82/mo) · Renews 4 Dec 2026'
                          : '50 replies / month · $19.99/mo · Renews 4 Dec 2026'
                        : S.country === 'IN'
                        ? 'Upgrade to XPO Partner Plan for 50 replies/month at ₹999 + 18% GST.'
                        : 'Upgrade to XPO Partner Plan for 50 replies/month at $19.99/month.'}
                    </div>
                  </div>
                  <div>
                    {S.plan === 'active' ? (
                      <button
                        className="btn b2"
                        onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'cancel' } }))}
                      >
                        Cancel plan
                      </button>
                    ) : (
                      <button
                        className="btn b1"
                        onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }))}
                      >
                        {S.country === 'IN'
                          ? 'Get Partner Plan · ₹999/mo + GST'
                          : 'Get Partner Plan · $19.99/mo'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>Matched categories &amp; skills</div>
                    <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      You receive 5-minute Wave 1 alerts on WhatsApp for these categories.
                    </div>
                  </div>
                  <button
                    className="btn b2 sm"
                    onClick={() => setS((prev) => ({ ...prev, capModalOpen: true }))}
                  >
                    Edit categories
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
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="tabbar md:hidden">
        <button
          className={`tb ${S.screen === 'feed' || S.screen === 'opp' ? 'on' : ''}`}
          onClick={() => setS((prev) => ({ ...prev, screen: 'feed' }))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Matched</span>
        </button>
        <button
          className={`tb ${S.screen === 'replies' ? 'on' : ''}`}
          onClick={() => setS((prev) => ({ ...prev, screen: 'replies' }))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Replies ({repliesList.length})</span>
        </button>
        <button
          className={`tb ${S.screen === 'conn' ? 'on' : ''}`}
          onClick={() => setS((prev) => ({ ...prev, screen: 'conn' }))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>Connected</span>
        </button>
        <button
          className={`tb ${S.screen === 'billing' ? 'on' : ''}`}
          onClick={() => setS((prev) => ({ ...prev, screen: 'billing' }))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
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
                  className="fld"
                  rows={3}
                  placeholder="E.g. We supply 3-ply printed mailer boxes to 40+ D2C brands in Hyderabad from our Jeedimetla unit. Can deliver 10,000 boxes in 9 days."
                  value={S.pitchDraft}
                  onChange={(e) => setS((prev) => ({ ...prev, pitchDraft: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                }}
              >
                Save categories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT SHEET */}
      {S.sheet?.type === 'checkout' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--ln)' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>XPO Partner Plan — 50 replies / month</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
                Priority Wave 1 matching · Verified Partner badge · Zero commission on deals
              </div>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {S.country === 'IN' ? (
                <>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'var(--sf2)',
                      border: '1px solid var(--ln)',
                      fontSize: 13.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>XPO Partner Plan (50 replies / month)</span>
                      <b>₹999.00</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tx2)' }}>
                      <span>GST (18%)</span>
                      <span>₹179.82</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--ln)',
                        fontWeight: 800,
                      }}
                    >
                      <span>Total today</span>
                      <span>₹1,178.82 / month</span>
                    </div>
                  </div>
                  <div className="seg">
                    <button
                      className={S.payMethod === 'upi' ? 'on' : ''}
                      onClick={() => setS((prev) => ({ ...prev, payMethod: 'upi' }))}
                    >
                      UPI AutoPay
                    </button>
                    <button
                      className={S.payMethod === 'card' ? 'on' : ''}
                      onClick={() => setS((prev) => ({ ...prev, payMethod: 'card' }))}
                    >
                      Card
                    </button>
                    <button
                      className={S.payMethod === 'paypal' ? 'on' : ''}
                      onClick={() => setS((prev) => ({ ...prev, payMethod: 'paypal' }))}
                    >
                      PayPal
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'var(--sf2)',
                    border: '1px solid var(--ln)',
                    fontSize: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                  }}
                >
                  <span>XPO Partner Plan (50 replies / month)</span>
                  <span>$19.99 / month via PayPal</span>
                </div>
              )}
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
                Not now
              </button>
              <button className="btn b1" onClick={startPayment}>
                {S.country === 'IN' ? 'Pay ₹1,178.82 & start plan' : 'Pay $19.99 & start plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {S.sheet?.type === 'processing' && (
        <div className="scrim">
          <div className="dialog" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Confirming payment…</div>
            <div style={{ fontSize: 13.5, color: 'var(--tx2)' }}>{S.sheet.label}</div>
          </div>
        </div>
      )}

      {S.sheet?.type === 'payfail' && (
        <div className="scrim" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
          <div className="dialog" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Payment didn&apos;t go through</div>
            <div style={{ fontSize: 13.5, color: 'var(--tx2)', marginBottom: 18 }}>
              No money was deducted. You can retry with UPI AutoPay or another method.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn b2" onClick={() => setS((prev) => ({ ...prev, sheet: null }))}>
                Close
              </button>
              <button
                className="btn b1"
                onClick={() => setS((prev) => ({ ...prev, sheet: { type: 'checkout' } }))}
              >
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
      <div className="alw">
        {S.alerts.map((a) => (
          <div key={a.id} className="al">
            <div className={`alic ${a.tone}`}>
              {a.tone === 'ok' ? '✓' : a.tone === 'warn' || a.tone === 'err' ? '!' : 'i'}
            </div>
            <div className="alb">
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

      {/* PROTOTYPE CONTROLS DRAWER */}
      <div className="ctl" onClick={(e) => e.stopPropagation()}>
        {S.ctlOpen ? (
          <div className="ctlp">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <b style={{ fontSize: 12.5 }}>Prototype controls (Partner)</b>
              <button
                className="bl"
                style={{ fontSize: 12 }}
                onClick={() => setS((prev) => ({ ...prev, ctlOpen: false }))}
              >
                Close
              </button>
            </div>

            <div className="lbl" style={{ margin: '6px 0 4px' }}>
              Jump to a situation
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {(
                [
                  ['active', 'Active partner'],
                  ['incoming', 'Client requests contact'],
                  ['zero', 'Out of free replies'],
                  ['paid', 'Partner Plan active'],
                  ['overseas', 'Overseas partner (USD)'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`chipb ${S.scene === id ? 'on' : ''}`}
                  style={{ height: 26, padding: '0 9px', fontSize: 11.5 }}
                  onClick={() => applyScene(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="lbl" style={{ margin: '8px 0 4px' }}>
              Trigger events from the client side
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                className="btn b2 sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={trigNewMatch}
              >
                New Wave 1 matched request arrives
              </button>
              <button
                className="btn b2 sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={trigClientUnlocks}
              >
                Client unlocks your reply (requests contact)
              </button>
              <button
                className="btn b2 sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  setS((prev) => ({ ...prev, payFail: !prev.payFail }));
                  toast(
                    'info',
                    !S.payFail ? 'Next payment will fail' : 'Next payment will succeed'
                  );
                }}
              >
                Make next payment fail: {S.payFail ? 'ON' : 'off'}
              </button>
            </div>

            <div className="lbl" style={{ margin: '10px 0 4px' }}>
              Other apps in this prototype
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn b2 sm"
                style={{ flex: 1 }}
                onClick={() => router.push('/creator/dashboard')}
              >
                Client app →
              </button>
              <button
                className="btn b2 sm"
                style={{ flex: 1 }}
                onClick={() => router.push('/admin/dashboard')}
              >
                Superadmin →
              </button>
            </div>
          </div>
        ) : (
          <button
            className="ctlt"
            onClick={() => setS((prev) => ({ ...prev, ctlOpen: true }))}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: '#C8102E',
              }}
            />
            Prototype controls
          </button>
        )}
      </div>
    </div>
  );
}
