'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export type ClientScreen =
  | 'welcome'
  | 'home'
  | 'requests'
  | 'req'
  | 'notifs'
  | 'conn'
  | 'billing'
  | 'profile'
  | 'verify'
  | 'help'
  | 'account';

export interface PartnerReply {
  id: string;
  real: string;
  masked: string;
  city: string;
  verified: boolean;
  pitch: string;
  tags: string[];
  details: string;
  phone: string;
  st: 'locked' | 'waiting' | 'unlocked' | 'connected' | 'declined';
}

export interface ClientReqItem {
  code: string;
  title: string;
  sector: string;
  cat: string;
  sub: string;
  loc: string;
  timeline: string;
  budget: string;
  spec: string;
  posted: string;
  status: 'interested' | 'finding' | 'held' | 'rejected' | 'nomatch' | 'closed';
  closedReason?: string;
  wave: number;
  partners: PartnerReply[];
}

function getBaseReqs(): Record<string, ClientReqItem> {
  return {
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
  };
}

export function XpoClientApp({ initialScreen = 'home' }: { initialScreen?: ClientScreen }) {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<ClientScreen>(initialScreen);
  const [rid, setRid] = useState<string>('r1');
  const [ask, setAsk] = useState<string>('');
  const [askErr, setAskErr] = useState<boolean>(false);
  const [drafted, setDrafted] = useState<boolean>(false);
  const [draft, setDraft] = useState<any>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [closeDlg, setCloseDlg] = useState<boolean>(false);
  const [reason, setReason] = useState<number>(0);
  const [filter, setFilter] = useState<'active' | 'closed' | 'all'>('active');
  const [country, setCountry] = useState<'IN' | 'INTL'>('IN');
  const [free, setFree] = useState<number>(4);
  const [plan, setPlan] = useState<number>(0);
  const [planOn, setPlanOn] = useState<boolean>(false);
  const [method, setMethod] = useState<'upi' | 'card' | 'paypal'>('upi');
  const [co, setCo] = useState<'choose' | 'processing' | 'success' | 'failed' | null>(null);
  const [coAfter, setCoAfter] = useState<{ rid: string; pid: string } | null>(null);
  const [failNext, setFailNext] = useState<boolean>(false);
  const [kyc, setKyc] = useState<'none' | 'pending' | 'verified' | 'rejected'>('verified');
  const [toast, setToast] = useState<string>('');
  const [panel, setPanel] = useState<boolean>(true);
  const [seq, setSeq] = useState<number>(41230);
  const [notifsRead, setNotifsRead] = useState<boolean>(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'act'>('all');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState<boolean>(false);
  const [reqs, setReqs] = useState<Record<string, ClientReqItem>>(getBaseReqs);
  const [order, setOrder] = useState<string[]>(['r1', 'r2', 'r3', 'r4', 'r5']);

  // Mobile bottom-sheet composer state (from Board 2 — Client mobile app core loop)
  const [sheet, setSheet] = useState<'' | 'compose' | 'review' | 'done'>('');
  const [sheetText, setSheetText] = useState<string>('');
  const [sheetWhen, setSheetWhen] = useState<number>(2);
  const [sheetBudget, setSheetBudget] = useState<string>('₹1,20,000');

  const applyScene = (k: 'active' | 'new' | 'out' | 'plan' | 'abroad') => {
    const baseReqs = getBaseReqs();
    setAsk('');
    setAskErr(false);
    setDrafted(false);
    setDraft(null);
    setEditing(false);
    setCloseDlg(false);
    setReason(0);
    setFilter('active');
    setCo(null);
    setCoAfter(null);
    setFailNext(false);
    setToast('');
    setNotifsRead(false);

    if (k === 'new') {
      setScreen('welcome');
      setRid('r1');
      setCountry('IN');
      setFree(5);
      setPlan(0);
      setPlanOn(false);
      setKyc('none');
      setReqs({});
      setOrder([]);
    } else if (k === 'out') {
      setScreen('req');
      setRid('r1');
      setCountry('IN');
      setFree(0);
      setPlan(0);
      setPlanOn(false);
      setKyc('verified');
      setReqs(baseReqs);
      setOrder(['r1', 'r2', 'r3', 'r4', 'r5']);
    } else if (k === 'plan') {
      setScreen('billing');
      setRid('r1');
      setCountry('IN');
      setFree(0);
      setPlan(27);
      setPlanOn(true);
      setKyc('verified');
      setReqs(baseReqs);
      setOrder(['r1', 'r2', 'r3', 'r4', 'r5']);
    } else if (k === 'abroad') {
      setScreen('billing');
      setRid('r1');
      setCountry('INTL');
      setMethod('paypal');
      setFree(0);
      setPlan(0);
      setPlanOn(false);
      setKyc('verified');
      setReqs(baseReqs);
      setOrder(['r1', 'r2', 'r3', 'r4', 'r5']);
    } else {
      setScreen('home');
      setRid('r1');
      setCountry('IN');
      setFree(4);
      setPlan(0);
      setPlanOn(false);
      setKyc('verified');
      setReqs(baseReqs);
      setOrder(['r1', 'r2', 'r3', 'r4', 'r5']);
    }
  };

  const updateReq = (id: string, patch: Partial<ClientReqItem>, toastMsg?: string) => {
    setReqs((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
    if (toastMsg !== undefined) setToast(toastMsg);
  };

  const updatePartner = (
    reqId: string,
    pid: string,
    st: PartnerReply['st'],
    toastMsg?: string,
    spendCredit = false
  ) => {
    setReqs((prev) => {
      const target = prev[reqId];
      if (!target) return prev;
      return {
        ...prev,
        [reqId]: {
          ...target,
          partners: target.partners.map((p) => (p.id === pid ? { ...p, st } : p)),
        },
      };
    });
    if (spendCredit) {
      if (free > 0) setFree((f) => f - 1);
      else if (plan > 0) setPlan((pl) => pl - 1);
    }
    if (toastMsg !== undefined) setToast(toastMsg);
  };

  const go = (target: ClientScreen, extraRid?: string) => {
    setScreen(target);
    if (extraRid) setRid(extraRid);
    setEditing(false);
    setCloseDlg(false);
    setToast('');
    setMenuOpen(false);
  };

  const india = country === 'IN';
  const credits = free + plan;

  const C = {
    info: { background: 'var(--bbg)', color: 'var(--btx)' },
    ok: { background: 'var(--gbg)', color: 'var(--gtx)' },
    amber: { background: 'var(--abg)', color: 'var(--atx)' },
    red: { background: 'var(--rbg)', color: 'var(--rtx)' },
    grey: { background: 'var(--sf3)', color: 'var(--tx2)' },
  };

  const statusOf = (r: ClientReqItem) => {
    const conn = r.partners.filter((p) => p.st === 'connected').length;
    const intr = r.partners.length;
    if (r.status === 'closed') return { l: 'Closed', cs: C.grey };
    if (r.status === 'held') return { l: 'Being checked', cs: C.amber };
    if (r.status === 'rejected') return { l: 'Needs changes', cs: C.red };
    if (r.status === 'nomatch') return { l: 'No partner yet', cs: C.amber };
    if (conn) return { l: 'Connected', cs: C.ok };
    if (intr) return { l: `${intr} interested`, cs: C.ok };
    return { l: 'Finding · ~15 min', cs: C.info };
  };

  const sampleDraft = (t: string) => {
    const low = t.toLowerCase();
    if (low.includes('gst')) {
      return {
        title: 'Monthly GST filing and books for 3 entities',
        sector: 'Finance, Legal & HR Advisory',
        cat: 'Accounting, GST & Virtual CFO',
        sub: 'Statutory Audit, GST & ROC Compliance',
        loc: 'Bengaluru',
        timeline: 'Within 2-4 Weeks',
        budget: 'Quotes invited',
        spec: t,
      };
    }
    if (low.includes('fit') || low.includes('office')) {
      return {
        title: 'Office fit-out, 4,000 sq ft',
        sector: 'Construction, Interiors & EPC',
        cat: 'Commercial & Office Interiors',
        sub: 'Turnkey Office & Retail Fit-Outs',
        loc: 'Gurugram',
        timeline: 'Within 2-4 Weeks',
        budget: 'Quotes invited',
        spec: t,
      };
    }
    if (low.includes('bet')) {
      return {
        title: 'Promotion for a betting app',
        sector: 'Design, Branding & Digital Growth',
        cat: 'Performance Marketing & SEO',
        sub: 'Meta, Google Ads & B2B Lead Generation',
        loc: 'Bengaluru',
        timeline: 'Immediate (Within 7 Days)',
        budget: 'Quotes invited',
        spec: t,
      };
    }
    return {
      title: '10,000 printed 3-ply corrugated boxes',
      sector: 'Manufacturing & Industrial Supply',
      cat: 'Industrial Packaging & Raw Materials',
      sub: 'Corrugated, Flexible & Custom Packaging',
      loc: 'Pune',
      timeline: 'Within 2-4 Weeks',
      budget: 'Quotes invited',
      spec: t,
    };
  };

  const handleMakeDraft = () => {
    const t = (ask || '').trim();
    if (t.length < 20) {
      setAskErr(true);
      setDrafted(false);
    } else {
      setAskErr(false);
      setDrafted(true);
      setDraft(sampleDraft(t));
    }
  };

  const handlePostDraft = async (customDraft?: any) => {
    const d = customDraft || draft;
    if (!d) return;
    const id = 'n' + seq;
    const held = String(d.spec || '').toLowerCase().includes('bet');
    const code = 'XPO-REQ-' + seq;
    const newReq: ClientReqItem = {
      ...d,
      code,
      timeline: d.timeline || 'Within 2-4 Weeks',
      posted: 'posted just now',
      status: held ? 'held' : 'finding',
      wave: held ? 0 : 1,
      partners: [],
    };
    setReqs((prev) => ({ ...prev, [id]: newReq }));
    setOrder((prev) => [id, ...prev]);
    setSeq((s) => s + 1);
    setDrafted(false);
    setAsk('');
    setRid(id);
    setScreen('req');
    setToast(
      held
        ? 'Posted · being checked before partners see it'
        : `Posted ${code} · offered to 3 matching partners`
    );

    // Sync to backend /api/leads non-blockingly
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newReq.title,
        description: newReq.spec,
        sectorName: newReq.sector,
        categoryName: newReq.cat,
        subcategoryName: newReq.sub,
        city: newReq.loc,
        urgency: newReq.timeline,
        budgetDisplay: newReq.budget,
      }),
    }).catch(() => {});
  };

  const unread = notifsRead ? 0 : order.length ? 3 : 0;
  const newCount = order.filter((id) => reqs[id]?.partners.some((p) => p.st === 'locked')).length;
  const curScreen = screen === 'req' ? 'requests' : screen;

  const isActiveReq = (id: string) => reqs[id] && reqs[id].status !== 'closed';
  const listedIds = order.filter((id) =>
    filter === 'all' ? true : filter === 'active' ? isActiveReq(id) : !isActiveReq(id)
  );

  const r = reqs[rid];
  const reasons = ['Found a partner on XPO', 'Found someone elsewhere', 'No longer needed'];
  const WH = [
    'Urgent (24-48 Hours)',
    'Immediate (Within 7 Days)',
    'Within 2-4 Weeks',
    'Flexible / Ongoing Retainer',
  ];

  // Connected partners across all requests
  const connectedPartners: { i: string; n: string; sub: string; ph: string }[] = [];
  for (const id of order) {
    const reqItem = reqs[id];
    if (!reqItem) continue;
    for (const p of reqItem.partners) {
      if (p.st === 'connected') {
        connectedPartners.push({
          i: p.real.charAt(0),
          n: `${p.real} · ${p.city}`,
          sub: `${reqItem.title} · ${reqItem.code}`,
          ph: p.phone,
        });
      }
    }
  }
  if (connectedPartners.length === 0) {
    connectedPartners.push({
      i: 'S',
      n: 'Srujan Digital · Hyderabad',
      sub: 'Company website developer · 28 Oct',
      ph: '+91 98480 31207',
    });
  }

  const activeMethod = india ? method : 'paypal';
  const methodName = {
    upi: 'Razorpay UPI AutoPay',
    card: 'Razorpay card',
    paypal: 'PayPal',
  }[activeMethod];

  const ledger: { a: string; c: string; d: string }[] = [];
  if (planOn) ledger.push({ a: `Client Plan started · ${methodName}`, c: '+30 plan views', d: '2 Nov, 16:10' });
  if (order.length) ledger.push({ a: 'Unlocked Klo Tech · XPO-REQ-39114', c: '−1 free view', d: '28 Oct, 15:06' });
  ledger.push({ a: 'Starter views granted', c: '+5 free views', d: '28 Oct, 14:58' });

  const kycMap: Record<
    typeof kyc,
    [string, React.CSSProperties, string, string]
  > = {
    none: ['Not verified', C.grey, 'Upload one business document to get the badge.', 'Get verified'],
    pending: ['In review', C.amber, "Submitted today. We'll notify you.", 'In review'],
    verified: [
      'Verified',
      C.ok,
      'GST certificate checked on 29 Oct. The badge shows on all your requests.',
      'Verified',
    ],
    rejected: [
      'Needs a new document',
      C.red,
      'Note: "GST number doesn\'t match the legal name."',
      'Action needed',
    ],
  };
  const kycInfo = kycMap[kyc];

  const crumbs: Record<ClientScreen, string> = {
    welcome: 'Welcome',
    home: 'Home',
    requests: 'My requests',
    req: `My requests  /  ${r ? r.code : ''}`,
    notifs: 'Notifications',
    conn: 'Connected partners',
    billing: 'Account  /  Plan & billing',
    profile: 'Account  /  Profile',
    verify: 'Account  /  Verification',
    help: 'Account  /  Help & privacy',
    account: 'Account',
  };

  // Notifications & Alerts items (combines Desktop notifications & Mobile rich grouped alerts)
  const alertItems = [
    {
      g: 'today',
      t: '2 partners are interested',
      d: 'XPO-REQ-40971 · E-commerce website for a 5-store retail chain',
      time: '10:46',
      glyph: '2',
      ic: C.ok,
      unread: true,
      cta: 'Review',
      primary: true,
      rid: 'r1',
    },
    {
      g: 'today',
      t: 'Your request is being checked',
      d: 'XPO-REQ-41190 · Marketing campaign · usually within 2 hours',
      time: '09:13',
      glyph: 'i',
      ic: C.info,
      unread: true,
      cta: '',
      primary: false,
      rid: 'r3',
    },
    {
      g: 'earlier',
      t: 'No partner was free for XPO-REQ-40655',
      d: '50 kW rooftop solar · Choose whether to offer across India',
      time: 'Yesterday',
      glyph: '!',
      ic: C.amber,
      unread: true,
      cta: 'Choose next step',
      primary: false,
      rid: 'r4',
    },
    {
      g: 'earlier',
      t: 'Klo Tech accepted your connection',
      d: 'Numbers shared · XPO-REQ-39114 (Company website developer)',
      time: '28 Oct',
      glyph: '✓',
      ic: C.ok,
      unread: false,
      cta: 'Call or message',
      primary: false,
      rid: 'r5',
    },
  ].filter((n) => reqs[n.rid]);

  const filteredAlerts =
    alertFilter === 'act' ? alertItems.filter((a) => Boolean(a.cta)) : alertItems;

  // Dynamic simulation events for Prototype Controls
  const waitingPartner = r?.partners.find((p) => p.st === 'waiting');

  return (
    <div
      className={`xt ${dark ? 'dark' : ''} shell`}
      style={{
        fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', system-ui, sans-serif",
        color: 'var(--tx)',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* LEFT SIDEBAR (Desktop) */}
      <aside
        className="side"
        style={{
          background: 'var(--sf)',
          borderRight: '1px solid var(--ln)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <button
          type="button"
          onClick={() => go('home')}
          aria-label="XPO home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 44,
            padding: '0 8px',
            border: 0,
            background: 'none',
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          <img
            src="/xpo-logo.png"
            alt="XPO India"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
        </button>

        <button
          type="button"
          className="btn b1"
          onClick={() => {
            go('home');
            setDrafted(false);
          }}
          style={{ width: '100%' }}
        >
          New requirement
        </button>

        <nav aria-label="Client" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            type="button"
            className="nav"
            aria-current={curScreen === 'home' ? 'page' : 'false'}
            onClick={() => go('home')}
            style={
              curScreen === 'home'
                ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                : { background: 'transparent', color: 'var(--tx2)' }
            }
          >
            <span>Home</span>
          </button>

          <button
            type="button"
            className="nav"
            aria-current={curScreen === 'requests' ? 'page' : 'false'}
            onClick={() => go('requests')}
            style={
              curScreen === 'requests'
                ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                : { background: 'transparent', color: 'var(--tx2)' }
            }
          >
            <span>My requests</span>
            {newCount > 0 && (
              <span
                className="chip"
                style={{ minHeight: 22, padding: '0 8px', background: '#C8102E', color: '#fff' }}
              >
                {newCount} new
              </span>
            )}
          </button>

          <button
            type="button"
            className="nav"
            aria-current={curScreen === 'conn' ? 'page' : 'false'}
            onClick={() => go('conn')}
            style={
              curScreen === 'conn'
                ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                : { background: 'transparent', color: 'var(--tx2)' }
            }
          >
            <span>Connected</span>
          </button>

          <button
            type="button"
            className="nav"
            aria-current={curScreen === 'notifs' ? 'page' : 'false'}
            onClick={() => go('notifs')}
            style={
              curScreen === 'notifs'
                ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                : { background: 'transparent', color: 'var(--tx2)' }
            }
          >
            <span>Alerts</span>
            {unread > 0 && (
              <span
                className="chip"
                style={{ minHeight: 22, padding: '0 8px', background: '#C8102E', color: '#fff' }}
              >
                {unread}
              </span>
            )}
          </button>

          <button
            type="button"
            className="nav"
            aria-current={
              ['billing', 'profile', 'verify', 'help', 'account'].includes(curScreen)
                ? 'page'
                : 'false'
            }
            onClick={() => go('billing')}
            style={
              ['billing', 'profile', 'verify', 'help', 'account'].includes(curScreen)
                ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                : { background: 'transparent', color: 'var(--tx2)' }
            }
          >
            <span>Account &amp; Plan</span>
          </button>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--ln)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)' }}>
            {planOn ? `${plan} of 30 plan views` : `${free} of 5 free views`}
          </div>
          <div className="bar">
            <div
              style={{
                height: '100%',
                background: '#C8102E',
                width: `${(planOn ? plan / 30 : free / 5) * 100}%`,
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {planOn
              ? 'Client Plan · renews 2 Dec'
              : free > 0
              ? 'Posting is always free'
              : 'Get the Client Plan for 30 a month'}
          </span>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="col">
        {/* TOP HEADER */}
        <header className="top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img
              className="only-sm"
              src="/xpo-logo.png"
              alt="XPO India"
              style={{ height: 22, width: 'auto' }}
            />
            <span className="crumb">{crumbs[screen]}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <button
              type="button"
              className="pill hide-sm"
              onClick={() => setSheet('compose')}
              title="Open Quick Post Composer (with Voice Input)"
            >
              Quick Post / Voice
            </button>

            <button
              type="button"
              className="pill hide-sm"
              onClick={() => go('billing')}
              aria-label={`Plan and credits: ${planOn ? `${plan} plan views` : `${free} free views`}`}
            >
              {planOn ? `${plan} plan views` : `${free} free views`}
            </button>

            <button
              type="button"
              className="ib hide-sm"
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              onClick={() => go('notifs')}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              </svg>
              {unread > 0 && <span className="dot">{unread}</span>}
            </button>

            <button
              type="button"
              className="av"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((m) => !m)}
            >
              PA
            </button>

            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 35 }}
                />
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
                    <b style={{ fontSize: 15 }}>Pavan</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      Test Traders · {india ? 'Hyderabad, India' : 'Dubai, UAE'}
                    </span>
                  </div>

                  <button type="button" role="menuitem" className="mi" onClick={() => go('profile')}>
                    <span>Profile</span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('verify')}>
                    <span>Verification</span>
                    <span className="chip" style={kycInfo[1]}>
                      {kycInfo[3]}
                    </span>
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('billing')}>
                    <span>Plan &amp; billing</span>
                    {planOn && (
                      <span className="chip" style={C.ok}>
                        Plan active
                      </span>
                    )}
                  </button>
                  <button type="button" role="menuitem" className="mi" onClick={() => go('help')}>
                    <span>Help &amp; privacy</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mi"
                    onClick={() => {
                      setDark((d) => !d);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                  </button>
                  <Link
                    href="/login"
                    role="menuitem"
                    className="mi"
                    style={{
                      color: 'var(--rtx)',
                      borderTop: '1px solid var(--ln)',
                      borderRadius: '0 0 10px 10px',
                      marginTop: 6,
                    }}
                  >
                    <span>Sign out</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main
          style={{
            width: '100%',
            maxWidth: 1120,
            padding: '28px clamp(16px, 4vw, 48px) 140px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* TOAST BANNER */}
          {toast && (
            <div
              role="status"
              style={{
                position: 'fixed',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 88,
                zIndex: 45,
                boxShadow: '0 16px 32px -16px rgba(0,0,0,.45)',
                background: 'var(--inv)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 14px 12px 16px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <span>{toast}</span>
              <button
                type="button"
                onClick={() => setToast('')}
                style={{
                  background: 'none',
                  border: 0,
                  color: '#9FC1FF',
                  font: "700 13.5px 'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. FIRST VISIT / WELCOME */}
          {screen === 'welcome' && (
            <section
              className="card"
              style={{
                padding: 'clamp(24px, 4vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                maxWidth: 720,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="lbl" style={{ color: 'var(--rtx)' }}>
                  Step 1 of 2 · about 30 seconds
                </span>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>Welcome to XPO, Pavan</h1>
                <span style={{ fontSize: 15.5, lineHeight: '24px', color: 'var(--tx2)' }}>
                  Partners see this when they reply.
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                <label className="fld">
                  Company name
                  <input className="inp" defaultValue="Test Traders" />
                </label>
                <label className="fld">
                  City
                  <select className="inp" defaultValue="Hyderabad">
                    <option>Hyderabad</option>
                    <option>Mumbai</option>
                    <option>Bengaluru</option>
                    <option>Pune</option>
                    <option>Delhi NCR</option>
                    <option>Chennai</option>
                  </select>
                </label>
                <label className="fld" style={{ gridColumn: '1 / -1' }}>
                  What does your business do?
                  <input className="inp" placeholder="e.g. Retail chain with 5 stores" />
                </label>
                <div className="fld" style={{ gridColumn: '1 / -1' }}>
                  <span>Where is your business registered?</span>
                  <div
                    role="radiogroup"
                    aria-label="Country"
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
                      aria-checked={india}
                      onClick={() => {
                        setCountry('IN');
                        setMethod('upi');
                      }}
                      style={
                        india
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
                      aria-checked={!india}
                      onClick={() => {
                        setCountry('INTL');
                        setMethod('paypal');
                      }}
                      style={
                        !india
                          ? { background: 'var(--inv)', color: '#fff' }
                          : { background: 'transparent', color: 'var(--tx2)' }
                      }
                    >
                      Outside India
                    </button>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--tx2)' }}>
                    {india ? '₹ + GST · Razorpay or PayPal' : 'US$ · PayPal'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    setScreen('home');
                    setToast('Profile saved · now post your first requirement');
                  }}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* 2. HOME / NEW REQUIREMENT */}
          {screen === 'home' && (
            <>
              <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {order.length ? 'What do you need, Pavan?' : 'Post your first requirement'}
                </h1>
                <span style={{ color: 'var(--tx2)', fontSize: 15 }}>
                  One sentence is enough. Posting is free.
                </span>
              </section>

              {/* Action Alert Banner (from Mobile Core Loop when partners are interested) */}
              {reqs.r1 && reqs.r1.partners.some((p) => p.st === 'locked') && (
                <button
                  type="button"
                  className="act"
                  onClick={() => go('req', 'r1')}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'var(--gbg)',
                      color: 'var(--gtx)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      flex: '0 0 40px',
                    }}
                  >
                    {reqs.r1.partners.length}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    <b style={{ fontSize: 15 }}>Partners are interested</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      {reqs.r1.title} · review and connect
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ fontSize: 20, color: 'var(--tx2)' }}>
                    ›
                  </span>
                </button>
              )}

              <section
                className="card"
                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="ask" className="lbl">
                    Your requirement
                  </label>
                  <button
                    type="button"
                    className="chipb"
                    onClick={() => {
                      setAsk(
                        '10,000 printed 3-ply corrugated boxes delivered to Pune in 2 weeks, budget around ₹1.2L'
                      );
                      setAskErr(false);
                    }}
                    title="Speak instead of typing"
                  >
                    🎙️ Voice Dictation
                  </button>
                </div>
                <textarea
                  id="ask"
                  rows={3}
                  value={ask}
                  onChange={(e) => {
                    setAsk(e.target.value);
                    setAskErr(false);
                  }}
                  aria-describedby="ask-help"
                  placeholder="What do you need, where, by when — and budget if you know it"
                  style={{
                    resize: 'vertical',
                    border: `1.5px solid ${askErr ? '#C8102E' : 'var(--ln2)'}`,
                    borderRadius: 12,
                    padding: 14,
                    font: "500 16px 'Plus Jakarta Sans', sans-serif",
                    lineHeight: '24px',
                    background: 'var(--sf)',
                    color: 'var(--tx)',
                  }}
                />
                {askErr && (
                  <span
                    id="ask-help"
                    role="alert"
                    style={{ fontSize: 13, color: 'var(--rtx)' }}
                  >
                    Add a little more: what you need, where, and by when.
                  </span>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>Examples:</span>
                    <button
                      type="button"
                      className="chipb"
                      onClick={() => {
                        setAsk('10,000 printed 3-ply corrugated boxes delivered to Pune in 2 weeks');
                        setAskErr(false);
                      }}
                    >
                      Corrugated boxes, Pune
                    </button>
                    <button
                      type="button"
                      className="chipb"
                      onClick={() => {
                        setAsk('Monthly GST filing and books for 3 entities in Bengaluru');
                        setAskErr(false);
                      }}
                    >
                      GST filing, 3 entities
                    </button>
                    <button
                      type="button"
                      className="chipb"
                      onClick={() => {
                        setAsk('Office fit-out for 4,000 sq ft in Gurugram, start next month');
                        setAskErr(false);
                      }}
                    >
                      Office fit-out, Gurugram
                    </button>
                  </div>
                  <button type="button" className="btn b1" onClick={handleMakeDraft}>
                    Continue
                  </button>
                </div>
              </section>

              {/* STEP 2: CHECK BEFORE POSTING */}
              {drafted && draft && (
                <section
                  className="card"
                  aria-label="Check your requirement"
                  style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    borderColor: 'var(--rln)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span className="lbl" style={{ color: 'var(--rtx)' }}>
                      Step 2 · check before posting
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 16,
                    }}
                  >
                    <label className="fld" style={{ gridColumn: '1 / -1' }}>
                      Requirement headline
                      <input
                        className="inp"
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      />
                    </label>
                    <label className="fld">
                      Sector
                      <select
                        className="inp"
                        value={draft.sector}
                        onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                      >
                        <option>{draft.sector}</option>
                        <option>Technology &amp; Software</option>
                        <option>Manufacturing &amp; Industrial Supply</option>
                        <option>Finance, Legal &amp; HR Advisory</option>
                        <option>Construction, Interiors &amp; EPC</option>
                        <option>Design, Branding &amp; Digital Growth</option>
                      </select>
                    </label>
                    <label className="fld">
                      Category
                      <select
                        className="inp"
                        value={draft.cat}
                        onChange={(e) => setDraft({ ...draft, cat: e.target.value })}
                      >
                        <option>{draft.cat}</option>
                      </select>
                    </label>
                    <label className="fld">
                      Subcategory
                      <select
                        className="inp"
                        value={draft.sub}
                        onChange={(e) => setDraft({ ...draft, sub: e.target.value })}
                      >
                        <option>{draft.sub}</option>
                      </select>
                    </label>
                    <label className="fld">
                      Work / delivery location
                      <input
                        className="inp"
                        value={draft.loc}
                        onChange={(e) => setDraft({ ...draft, loc: e.target.value })}
                      />
                    </label>
                    <label className="fld">
                      Timeline
                      <select
                        className="inp"
                        value={draft.timeline}
                        onChange={(e) => setDraft({ ...draft, timeline: e.target.value })}
                      >
                        <option>Urgent (24-48 Hours)</option>
                        <option>Immediate (Within 7 Days)</option>
                        <option>Within 2-4 Weeks</option>
                        <option>Flexible / Ongoing Retainer</option>
                      </select>
                    </label>
                    <label className="fld">
                      Estimated budget (optional)
                      <input
                        className="inp"
                        value={draft.budget}
                        onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                      />
                    </label>
                    <label className="fld" style={{ gridColumn: '1 / -1' }}>
                      Scope &amp; specifications
                      <textarea
                        className="inp"
                        rows={3}
                        value={draft.spec}
                        onChange={(e) => setDraft({ ...draft, spec: e.target.value })}
                        style={{ padding: '12px 14px', lineHeight: '22px' }}
                      />
                      <span style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--tx2)' }}>
                        No phone numbers, please.
                      </span>
                    </label>
                    <div className="fld" style={{ gridColumn: '1 / -1' }}>
                      <span>Drawings or specs (optional)</span>
                      <button
                        type="button"
                        className="btn b2"
                        style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}
                        onClick={() => setToast('File attachment ready')}
                      >
                        Attach PDF, image or CAD
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                      Goes to matching partners in {draft.cat}.
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="btn b2"
                        onClick={() => setDrafted(false)}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className="btn b1"
                        onClick={() => handlePostDraft()}
                      >
                        Post free
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* RECENT REQUESTS */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Recent requests</h2>
                  <button
                    type="button"
                    className="btn bl"
                    onClick={() => go('requests')}
                  >
                    See all
                  </button>
                </div>

                {order.length === 0 ? (
                  <div
                    className="card"
                    style={{
                      padding: 28,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <b style={{ fontSize: 16 }}>No requests yet</b>
                    <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                      Partners usually reply within 15 minutes.
                    </span>
                  </div>
                ) : (
                  order.slice(0, 3).map((id) => {
                    const item = reqs[id];
                    const st = statusOf(item);
                    return (
                      <button
                        key={id}
                        type="button"
                        className="rowb"
                        onClick={() => go('req', id)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            minWidth: 0,
                          }}
                        >
                          <span className="mono" style={{ color: 'var(--tx2)' }}>
                            {item.code}
                          </span>
                          <b style={{ fontSize: 16 }}>{item.title}</b>
                          <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                            {item.loc} · {item.timeline} · {item.posted}
                          </span>
                        </div>
                        <span className="chip" style={st.cs}>
                          {st.l}
                        </span>
                      </button>
                    );
                  })
                )}
              </section>
            </>
          )}

          {/* 3. MY REQUESTS LIST */}
          {screen === 'requests' && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>My requests</h1>
                <div
                  role="tablist"
                  aria-label="Filter"
                  style={{
                    display: 'inline-flex',
                    gap: 4,
                    padding: 4,
                    background: 'var(--sf3)',
                    borderRadius: 12,
                  }}
                >
                  {(
                    [
                      ['active', 'Active'],
                      ['closed', 'Closed'],
                      ['all', 'All'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      className="seg"
                      aria-selected={filter === key}
                      onClick={() => setFilter(key)}
                      style={
                        filter === key
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
              </div>

              {listedIds.length === 0 ? (
                <div className="card" style={{ padding: 24, fontSize: 14.5, color: 'var(--tx2)' }}>
                  Nothing here.
                </div>
              ) : (
                listedIds.map((id) => {
                  const item = reqs[id];
                  const st = statusOf(item);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="rowb"
                      onClick={() => go('req', id)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          minWidth: 0,
                        }}
                      >
                        <span className="mono" style={{ color: 'var(--tx2)' }}>
                          {item.code}
                        </span>
                        <b style={{ fontSize: 16 }}>{item.title}</b>
                        <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                          {item.loc} · {item.timeline} · {item.posted}
                        </span>
                      </div>
                      <span className="chip" style={st.cs}>
                        {st.l}
                      </span>
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* 4. REQUEST DETAIL */}
          {screen === 'req' && r && (
            <>
              <button
                type="button"
                className="btn bl"
                onClick={() => go('requests')}
                style={{ alignSelf: 'flex-start', color: 'var(--tx2)', padding: 0 }}
              >
                ← My requests
              </button>

              <section
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minWidth: 0,
                    flex: '1 1 440px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ color: 'var(--tx2)' }}>
                      {r.code} · {r.posted}
                    </span>
                    <span className="chip" style={statusOf(r).cs}>
                      {statusOf(r).l}
                    </span>
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {r.title}
                  </h1>
                  <span style={{ fontSize: 14.5, color: 'var(--tx2)' }}>
                    {r.cat} › {r.sub} · {r.loc} · {r.timeline} · {r.budget}
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      lineHeight: '22px',
                      color: 'var(--tx2)',
                      maxWidth: 760,
                    }}
                  >
                    {r.spec}
                  </span>
                </div>

                {!['closed', 'held'].includes(r.status) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => {
                        setEditing((e) => !e);
                        setCloseDlg(false);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => {
                        setCloseDlg(true);
                        setEditing(false);
                      }}
                    >
                      Close request
                    </button>
                  </div>
                )}

                {r.status === 'closed' && (
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => {
                      setDraft({ ...r });
                      setDrafted(true);
                      setScreen('home');
                      setToast('Copied into a new draft — check and post');
                    }}
                  >
                    Post again
                  </button>
                )}
              </section>

              {/* Inline Edit Request Card */}
              {editing && (
                <section
                  className="card"
                  style={{
                    padding: 20,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14,
                    borderColor: 'var(--tx)',
                  }}
                >
                  <label className="fld" style={{ gridColumn: '1 / -1' }}>
                    Headline
                    <input
                      className="inp"
                      value={r.title}
                      onChange={(e) => updateReq(rid, { title: e.target.value })}
                    />
                  </label>
                  <label className="fld">
                    Location
                    <input
                      className="inp"
                      value={r.loc}
                      onChange={(e) => updateReq(rid, { loc: e.target.value })}
                    />
                  </label>
                  <label className="fld">
                    Timeline
                    <select
                      className="inp"
                      value={r.timeline}
                      onChange={(e) => updateReq(rid, { timeline: e.target.value })}
                    >
                      <option>{r.timeline}</option>
                      <option>Urgent (24-48 Hours)</option>
                      <option>Immediate (Within 7 Days)</option>
                      <option>Within 2-4 Weeks</option>
                      <option>Flexible / Ongoing Retainer</option>
                    </select>
                  </label>
                  <label className="fld">
                    Budget
                    <input
                      className="inp"
                      value={r.budget}
                      onChange={(e) => updateReq(rid, { budget: e.target.value })}
                    />
                  </label>
                  <span
                    style={{
                      gridColumn: '1 / -1',
                      fontSize: 13,
                      color: 'var(--atx)',
                      background: 'var(--abg)',
                      padding: '10px 12px',
                      borderRadius: 10,
                    }}
                  >
                    Partners who replied will see the change.
                  </span>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn b3"
                      onClick={() => {
                        const wasRej = r.status === 'rejected';
                        if (wasRej) updateReq(rid, { status: 'held' });
                        setEditing(false);
                        setToast(
                          wasRej
                            ? 'Resubmitted · being checked again'
                            : 'Saved · partners who replied can see the change'
                        );
                      }}
                    >
                      Save changes
                    </button>
                  </div>
                </section>
              )}

              {/* Close Request Dialog */}
              {closeDlg && (
                <section
                  className="card"
                  role="dialog"
                  aria-label="Close request"
                  style={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    borderColor: 'var(--tx)',
                  }}
                >
                  <b style={{ fontSize: 17 }}>Close this request?</b>
                  <span style={{ fontSize: 14, color: 'var(--tx2)' }}>
                    New partners stop receiving it.
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Reason"
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {reasons.map((label, idx) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        className="opt"
                        aria-checked={reason === idx}
                        onClick={() => setReason(idx)}
                        style={
                          reason === idx
                            ? {
                                background: 'var(--inv)',
                                color: '#fff',
                                border: '1.5px solid var(--tx)',
                              }
                            : {
                                background: 'var(--sf)',
                                color: 'var(--tx)',
                                border: '1.5px solid var(--ln2)',
                              }
                        }
                      >
                        <span>{label}</span>
                        <span aria-hidden="true">{reason === idx ? '●' : '○'}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => setCloseDlg(false)}
                    >
                      Keep open
                    </button>
                    <button
                      type="button"
                      className="btn b3"
                      onClick={() => {
                        updateReq(
                          rid,
                          { status: 'closed', closedReason: reasons[reason] },
                          'Request closed · partners have been told'
                        );
                        setCloseDlg(false);
                      }}
                    >
                      Close request
                    </button>
                  </div>
                </section>
              )}

              {/* 4-Stage Progress Bar */}
              {(() => {
                const conn = r.partners.some((p) => p.st === 'connected');
                const n = r.partners.length;
                const ph =
                  r.status === 'held' || r.status === 'rejected'
                    ? 0
                    : conn || r.status === 'closed'
                    ? 3
                    : n > 0
                    ? 2
                    : 1;
                const stepDefs = [
                  ['Posted', r.posted.replace('posted ', '')],
                  ['Finding partners', r.status === 'held' ? 'after review' : 'waves of 3, 5 min each'],
                  [n ? `${n} interested` : 'Interested', n ? 'choose whom to unlock' : 'usually within 15 min'],
                  ['Connected', conn ? 'numbers shared' : 'after they accept'],
                ];
                const lineMap: Record<string, string> = {
                  held: 'Waiting for review.',
                  rejected: 'Edit and resubmit to try again.',
                  nomatch: `No yes after ${r.wave} waves.`,
                  finding: 'Sent to 3 partners. More follow every 5 minutes.',
                  closed: `Closed · ${r.closedReason || ''}`,
                };
                const statusLine = conn
                  ? "Connected. Close the request when you're done."
                  : lineMap[r.status] || '';

                return (
                  <section
                    className="card"
                    aria-label="Progress"
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                        gap: 8,
                      }}
                    >
                      {stepDefs.map(([t, d], i) => (
                        <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div
                            style={{
                              height: 6,
                              borderRadius: 99,
                              background:
                                i < ph ? 'var(--inv)' : i === ph ? '#C8102E' : 'var(--ln)',
                            }}
                          />
                          <b
                            style={{
                              fontSize: 13.5,
                              color: i <= ph ? 'var(--tx)' : 'var(--tx2)',
                            }}
                          >
                            {t}
                          </b>
                          <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{d}</span>
                        </div>
                      ))}
                    </div>
                    {statusLine && (
                      <span style={{ fontSize: 14, lineHeight: '21px', color: 'var(--tx2)' }}>
                        {statusLine}
                      </span>
                    )}
                  </section>
                );
              })()}

              {/* Moderation / Edge-case Banners */}
              {r.status === 'held' && (
                <section
                  className="card"
                  style={{
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    borderColor: 'var(--aln)',
                  }}
                >
                  <b style={{ fontSize: 17 }}>Being checked by XPO</b>
                  <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                    A reviewer checks some posts first. We&apos;ll notify you.
                  </span>
                </section>
              )}

              {r.status === 'rejected' && (
                <section
                  className="card"
                  style={{
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    borderColor: 'var(--rln)',
                  }}
                >
                  <b style={{ fontSize: 17 }}>This request needs changes</b>
                  <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                    Note: &quot;Betting and gambling services can&apos;t be listed.&quot; Edit and resubmit.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn b1"
                      onClick={() => setEditing(true)}
                    >
                      Edit and resubmit
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => setCloseDlg(true)}
                    >
                      Close
                    </button>
                  </div>
                </section>
              )}

              {r.status === 'nomatch' && (
                <section
                  className="card"
                  style={{
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    borderColor: 'var(--aln)',
                  }}
                >
                  <b style={{ fontSize: 17 }}>No partner is free for this yet</b>
                  <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                    All matching partners in {r.loc} were offered it.
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      className="btn b1"
                      onClick={() =>
                        updateReq(
                          rid,
                          {
                            status: 'finding',
                            loc: `${r.loc} + All-India`,
                            wave: r.wave + 1,
                          },
                          'Now offered to partners across India'
                        )
                      }
                    >
                      Offer it across India
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() =>
                        updateReq(
                          rid,
                          { status: 'finding', wave: r.wave + 1 },
                          "We'll keep offering it as partners become free"
                        )
                      }
                    >
                      Keep looking here
                    </button>
                    <button
                      type="button"
                      className="btn b2"
                      onClick={() => setEditing(true)}
                    >
                      Edit details
                    </button>
                  </div>
                </section>
              )}

              {/* Interested Partners Section */}
              {(r.partners.length > 0 || r.status === 'finding' || r.status === 'interested') && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 8,
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                      {r.partners.length
                        ? `Interested partners · ${r.partners.length} of 3`
                        : 'Interested partners'}
                    </h2>
                    <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                      Numbers shared after they accept
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {r.partners.map((p) => {
                      const unl = p.st !== 'locked';
                      return (
                        <article
                          key={p.id}
                          className="card"
                          style={{
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            borderColor:
                              p.st === 'connected'
                                ? 'var(--gln)'
                                : p.st === 'waiting'
                                ? 'var(--aln)'
                                : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 12,
                                background: p.st === 'connected' ? 'var(--gbg)' : 'var(--sf3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                color: 'var(--tx2)',
                              }}
                            >
                              {p.real.charAt(0)}
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                minWidth: 0,
                              }}
                            >
                              <b style={{ fontSize: 16 }}>
                                {unl ? `${p.real} · ${p.city}` : p.masked}
                              </b>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: p.verified ? '#1D7A45' : 'var(--tx2)',
                                }}
                              >
                                {p.verified
                                  ? `Verified · ${unl ? 'GST checked' : 'serves Pan-India'}`
                                  : 'Phone verified'}
                              </span>
                            </div>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              fontSize: 14.5,
                              lineHeight: '22px',
                              color: 'var(--tx2)',
                            }}
                          >
                            {p.pitch}
                          </p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {p.tags.map((t) => (
                              <span
                                key={t}
                                className="chip"
                                style={{ background: 'var(--sf3)', color: 'var(--tx2)' }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {unl && (
                            <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                              {p.details}
                            </span>
                          )}

                          {p.st === 'locked' && (
                            credits > 0 ? (
                              <div
                                style={{
                                  marginTop: 'auto',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn b3"
                                  onClick={() =>
                                    updatePartner(
                                      rid,
                                      p.id,
                                      'waiting',
                                      `Profile unlocked · connection request sent to ${p.real}`,
                                      true
                                    )
                                  }
                                >
                                  Unlock &amp; connect
                                </button>
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    color: 'var(--tx2)',
                                    textAlign: 'center',
                                  }}
                                >
                                  {free > 0
                                    ? `Uses 1 of your ${free} free views`
                                    : `Uses 1 of your ${plan} plan views`}
                                </span>
                              </div>
                            ) : (
                              <div
                                style={{
                                  marginTop: 'auto',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn b1"
                                  onClick={() => {
                                    setCo('choose');
                                    setCoAfter({ rid, pid: p.id });
                                  }}
                                >
                                  Get Client Plan to unlock
                                </button>
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    color: 'var(--tx2)',
                                    textAlign: 'center',
                                  }}
                                >
                                  You&apos;ve used your 5 free views ·{' '}
                                  {india ? '₹299 / month + GST' : '$9.99 / month'}
                                </span>
                              </div>
                            )
                          )}

                          {p.st === 'waiting' && (
                            <>
                              <span
                                className="chip"
                                style={{
                                  background: 'var(--abg)',
                                  color: 'var(--atx)',
                                  alignSelf: 'flex-start',
                                  marginTop: 'auto',
                                }}
                              >
                                Waiting for {p.real} to accept
                              </span>
                              <button
                                type="button"
                                className="btn bl"
                                onClick={() =>
                                  updatePartner(
                                    rid,
                                    p.id,
                                    'unlocked',
                                    'Request withdrawn · profile stays unlocked'
                                  )
                                }
                                style={{ alignSelf: 'flex-start', padding: 0 }}
                              >
                                Withdraw request
                              </button>
                            </>
                          )}

                          {p.st === 'connected' && (
                            <>
                              <span
                                className="chip"
                                style={{
                                  background: 'var(--gbg)',
                                  color: 'var(--gtx)',
                                  alignSelf: 'flex-start',
                                  marginTop: 'auto',
                                }}
                              >
                                Connected · {p.phone}
                              </span>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: 8,
                                }}
                              >
                                <a
                                  href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn b3"
                                >
                                  Message
                                </a>
                                <a href={`tel:${p.phone}`} className="btn b2">
                                  Call
                                </a>
                              </div>
                            </>
                          )}

                          {p.st === 'unlocked' && (
                            <button
                              type="button"
                              className="btn b3"
                              onClick={() =>
                                updatePartner(
                                  rid,
                                  p.id,
                                  'waiting',
                                  `Connection request sent to ${p.real} · no extra view used`
                                )
                              }
                              style={{ marginTop: 'auto' }}
                            >
                              Ask to connect · free
                            </button>
                          )}

                          {p.st === 'declined' && (
                            <>
                              <span
                                className="chip"
                                style={{
                                  background: 'var(--sf3)',
                                  color: 'var(--tx2)',
                                  alignSelf: 'flex-start',
                                }}
                              >
                                {p.real} can&apos;t take this on
                              </span>
                              <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                                Their profile stays unlocked for you.
                              </span>
                            </>
                          )}
                        </article>
                      );
                    })}

                    {r.status !== 'closed' && r.partners.length < 3 && (
                      <article
                        style={{
                          border: '1.5px dashed var(--ln2)',
                          borderRadius: 16,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          justifyContent: 'center',
                          minHeight: 160,
                        }}
                      >
                        <b style={{ fontSize: 15 }}>
                          {r.partners.length
                            ? `Slot ${r.partners.length + 1} open`
                            : 'Waiting for the first yes'}
                        </b>
                        <span
                          style={{
                            fontSize: 14,
                            lineHeight: '21px',
                            color: 'var(--tx2)',
                          }}
                        >
                          We&apos;ll notify you when someone says yes.
                        </span>
                      </article>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {/* 5. NOTIFICATIONS / ALERTS (Unified Desktop & Mobile Grouped Alerts) */}
          {screen === 'notifs' && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Notifications &amp; Alerts</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div role="group" aria-label="Show" style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="fc"
                      aria-pressed={alertFilter === 'all'}
                      onClick={() => setAlertFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="fc"
                      aria-pressed={alertFilter === 'act'}
                      onClick={() => setAlertFilter('act')}
                    >
                      Needs action · {alertItems.filter((a) => Boolean(a.cta)).length}
                    </button>
                  </div>
                  {unread > 0 && (
                    <button
                      type="button"
                      className="btn bl"
                      onClick={() => setNotifsRead(true)}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {(['today', 'earlier'] as const).map((grpKey) => {
                const items = filteredAlerts.filter((a) => a.g === grpKey);
                if (!items.length) return null;
                return (
                  <div
                    key={grpKey}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    <h2 className="grp">{grpKey === 'today' ? 'Today' : 'Earlier'}</h2>
                    <div className="alw">
                      {items.map((a, idx) => {
                        const isUnread = a.unread && !notifsRead;
                        return (
                          <div
                            key={idx}
                            className="al"
                            onClick={() => {
                              setNotifsRead(true);
                              go('req', a.rid);
                            }}
                            style={{
                              background: isUnread ? 'var(--rbg2)' : 'var(--sf)',
                            }}
                          >
                            <span className="alic" style={a.ic}>
                              {a.glyph}
                            </span>
                            <span
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
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
                                <b
                                  style={{
                                    fontSize: 14.5,
                                    fontWeight: isUnread ? 800 : 600,
                                  }}
                                >
                                  {a.t}
                                </b>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--tx2)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {a.time}
                                </span>
                              </span>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  lineHeight: '19px',
                                  color: 'var(--tx2)',
                                }}
                              >
                                {a.d}
                              </span>
                              {a.cta && (
                                <button
                                  type="button"
                                  className="alb"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotifsRead(true);
                                    go('req', a.rid);
                                  }}
                                  style={
                                    a.primary
                                      ? { background: '#C8102E', color: '#fff' }
                                      : { background: 'var(--sf3)', color: 'var(--tx)' }
                                  }
                                >
                                  {a.cta}
                                </button>
                              )}
                            </span>
                            {isUnread && <span className="udot" aria-label="Unread" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 6. CONNECTED PARTNERS DIRECTORY */}
          {screen === 'conn' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Connected partners</h1>
                <span style={{ fontSize: 14, color: 'var(--tx2)' }}>
                  Numbers appear here only after both sides agree.
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 14,
                }}
              >
                {connectedPartners.map((c, idx) => (
                  <article key={idx} className="cn">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--sf3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flex: '0 0 44px',
                        }}
                      >
                        {c.i}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          minWidth: 0,
                        }}
                      >
                        <b style={{ fontSize: 15.5 }}>{c.n}</b>
                        <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{c.sub}</span>
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
                      {c.ph}
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <a
                        href={`https://wa.me/${c.ph.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn b3"
                        style={{ minHeight: 44, fontSize: 14 }}
                      >
                        Message
                      </a>
                      <a
                        href={`tel:${c.ph}`}
                        className="btn b2"
                        style={{ minHeight: 44, fontSize: 14 }}
                      >
                        Call
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* 7. ACCOUNT — PLAN & BILLING */}
          {screen === 'billing' && (
            <>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Account</h1>
              <div
                role="tablist"
                aria-label="Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify', 'Verification'],
                    ['billing', 'Plan & billing'],
                    ['help', 'Help & privacy'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={screen === key}
                    onClick={() => go(key)}
                    style={
                      screen === key
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
                    gap: 12,
                  }}
                >
                  <span className="lbl">Partner profile views</span>
                  <b style={{ fontSize: 32 }}>
                    {planOn
                      ? `${plan} of 30 plan views left`
                      : `${free} of 5 free views left`}
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
                        width: `${(planOn ? plan / 30 : free / 5) * 100}%`,
                      }}
                    />
                  </span>
                  <span style={{ fontSize: 14, lineHeight: '21px', color: 'var(--tx2)' }}>
                    Used only when you unlock a partner.
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
                  <span className="lbl">XPO Client Plan</span>
                  {planOn ? (
                    <>
                      <b style={{ fontSize: 22 }}>Active · renews 2 Dec 2026</b>
                      <span style={{ fontSize: 14, color: 'var(--tx2)' }}>
                        {india
                          ? '₹299 + 18% GST (₹352.82) a month'
                          : '$9.99 a month'}{' '}
                        · paid with {methodName}
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn b2"
                          onClick={() => setCo('choose')}
                        >
                          Change payment method
                        </button>
                        <button
                          type="button"
                          className="btn bl"
                          onClick={() => {
                            setPlanOn(false);
                            setToast('Plan cancellation scheduled for period end');
                          }}
                        >
                          Cancel plan
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <b style={{ fontSize: 32 }}>
                        {india ? '₹299 / month + GST' : '$9.99 / month'}
                      </b>
                      <span style={{ fontSize: 14, lineHeight: '21px' }}>
                        30 views a month · cancel any time
                      </span>
                      <button
                        type="button"
                        className="btn b1"
                        onClick={() => {
                          setCo('choose');
                          setCoAfter(null);
                        }}
                      >
                        Get Client Plan
                      </button>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                        {india
                          ? 'Razorpay (UPI AutoPay, cards) or PayPal · GST invoice'
                          : 'Billed in US$ through PayPal'}
                      </span>
                    </>
                  )}
                </section>
              </div>

              <section className="card" style={{ overflowX: 'auto' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    minWidth: 560,
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
                  {ledger.map((l, idx) => (
                    <React.Fragment key={idx}>
                      <div
                        style={{
                          padding: '12px 18px',
                          borderTop: '1px solid var(--ln)',
                          fontSize: 14,
                        }}
                      >
                        {l.a}
                      </div>
                      <div
                        style={{
                          padding: '12px 18px',
                          borderTop: '1px solid var(--ln)',
                          fontSize: 14,
                        }}
                      >
                        {l.c}
                      </div>
                      <div
                        style={{
                          padding: '12px 18px',
                          borderTop: '1px solid var(--ln)',
                          fontSize: 14,
                        }}
                      >
                        {l.d}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {planOn && (
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
                    <b>Invoice XPO-INV-2611-0042</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                      {india
                        ? `₹352.82 incl. GST ₹53.82 · 2 Nov 2026 · ${methodName}`
                        : '$9.99 · 2 Nov 2026 · PayPal'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => setToast('Invoice XPO-INV-2611-0042 downloaded')}
                  >
                    Download PDF
                  </button>
                </section>
              )}
            </>
          )}

          {/* 8. ACCOUNT — PROFILE */}
          {screen === 'profile' && (
            <>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Account</h1>
              <div
                role="tablist"
                aria-label="Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify', 'Verification'],
                    ['billing', 'Plan & billing'],
                    ['help', 'Help & privacy'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={screen === key}
                    onClick={() => go(key)}
                    style={
                      screen === key
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
                  Your name
                  <input className="inp" defaultValue="Pavan" />
                </label>
                <label className="fld">
                  Mobile number
                  <input className="inp" value="+91 63015 94552" readOnly />
                </label>
                <label className="fld">
                  Company name
                  <input className="inp" defaultValue="Test Traders" />
                </label>
                <label className="fld">
                  City
                  <select className="inp" defaultValue="Hyderabad">
                    <option>Hyderabad</option>
                    <option>Mumbai</option>
                    <option>Bengaluru</option>
                    <option>Pune</option>
                    <option>Delhi NCR</option>
                  </select>
                </label>
                <div className="fld" style={{ gridColumn: '1 / -1' }}>
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
                      aria-checked={india}
                      onClick={() => {
                        setCountry('IN');
                        setMethod('upi');
                      }}
                      style={
                        india
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
                      aria-checked={!india}
                      onClick={() => {
                        setCountry('INTL');
                        setMethod('paypal');
                      }}
                      style={
                        !india
                          ? { background: 'var(--inv)', color: '#fff' }
                          : { background: 'transparent', color: 'var(--tx2)' }
                      }
                    >
                      Outside India
                    </button>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--tx2)' }}>
                    {india ? '₹ + GST · Razorpay or PayPal' : 'US$ · PayPal'}
                  </span>
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
                    onClick={() => setToast('Profile saved')}
                  >
                    Save changes
                  </button>
                </div>
              </section>
            </>
          )}

          {/* 9. ACCOUNT — VERIFICATION */}
          {screen === 'verify' && (
            <>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Account</h1>
              <div
                role="tablist"
                aria-label="Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify', 'Verification'],
                    ['billing', 'Plan & billing'],
                    ['help', 'Help & privacy'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={screen === key}
                    onClick={() => go(key)}
                    style={
                      screen === key
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
                  <b style={{ fontSize: 17 }}>Verified badge</b>
                  <span className="chip" style={kycInfo[1]}>
                    {kycInfo[0]}
                  </span>
                </div>
                <span style={{ fontSize: 14, lineHeight: '21px', color: 'var(--tx2)' }}>
                  {kycInfo[2]}
                </span>
                {(kyc === 'none' || kyc === 'rejected') && (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <label className="fld">
                        Document type
                        <select className="inp">
                          <option>GST Registration Certificate</option>
                          <option>CIN / LLP / MSME Udyam</option>
                          <option>Trade License / EIN</option>
                          <option>PAN / Government ID</option>
                        </select>
                      </label>
                      <label className="fld">
                        Registration / ID number
                        <input className="inp" placeholder="e.g. 36ABCDE1234F1Z5" />
                      </label>
                      <label className="fld" style={{ gridColumn: '1 / -1' }}>
                        Registered legal name
                        <input className="inp" defaultValue="Test Traders" />
                      </label>
                      <div className="fld" style={{ gridColumn: '1 / -1' }}>
                        <span>Document (PDF or image)</span>
                        <button
                          type="button"
                          className="btn b2"
                          style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}
                          onClick={() => setToast('Document selected')}
                        >
                          Choose file
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn b1"
                      onClick={() => {
                        setKyc('pending');
                        setToast('Submitted for review');
                      }}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      Submit for review
                    </button>
                  </>
                )}
              </section>
            </>
          )}

          {/* 10. ACCOUNT — HELP & PRIVACY */}
          {screen === 'help' && (
            <>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Account</h1>
              <div
                role="tablist"
                aria-label="Account"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  padding: 4,
                  background: 'var(--sf3)',
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                {(
                  [
                    ['profile', 'Profile'],
                    ['verify', 'Verification'],
                    ['billing', 'Plan & billing'],
                    ['help', 'Help & privacy'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="seg"
                    aria-selected={screen === key}
                    onClick={() => go(key)}
                    style={
                      screen === key
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
                      <option>Something isn&apos;t working</option>
                      <option>A partner asked for payment outside XPO</option>
                      <option>Fake or misleading profile</option>
                      <option>Contact shared without consent</option>
                      <option>Spam or harassment</option>
                    </select>
                  </label>
                  <label className="fld">
                    Details
                    <textarea className="inp" rows={4} style={{ padding: '12px 14px' }} />
                  </label>
                  <button
                    type="button"
                    className="btn b3"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => setToast('Report sent to XPO Trust & Safety')}
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
                  <b style={{ fontSize: 17 }}>Your data &amp; notifications</b>
                  <span style={{ fontSize: 14, lineHeight: '21px', color: 'var(--tx2)' }}>
                    Correct or erase your data, or configure WhatsApp &amp; quiet hours.
                  </span>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => setNotifPrefsOpen((o) => !o)}
                  >
                    Notification preferences (WhatsApp &amp; Quiet hours)
                  </button>
                  {notifPrefsOpen && (
                    <div
                      style={{
                        border: '1px solid var(--ln)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
                        <span>App notifications</span>
                        <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: '#C8102E' }} />
                      </label>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
                        <span>Messages on WhatsApp</span>
                        <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: '#C8102E' }} />
                      </label>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
                        <span>Quiet hours · 21:00–08:00</span>
                        <input type="checkbox" style={{ width: 20, height: 20, accentColor: '#C8102E' }} />
                      </label>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => setToast('Preparing your DPDP data archive...')}
                  >
                    Download my data
                  </button>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => setToast('Correction request opened')}
                  >
                    Ask for a correction
                  </button>
                  <button
                    type="button"
                    className="btn b2"
                    style={{ color: 'var(--rtx)' }}
                    onClick={() => setToast('Account deletion confirmation required')}
                  >
                    Delete my account…
                  </button>
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM TAB BAR (from Board 1 & Board 2 — with elevated Post FAB) */}
      <nav aria-label="Main" className="tabbar">
        <button
          type="button"
          className="tb"
          aria-current={screen === 'home' ? 'page' : 'false'}
          onClick={() => go('home')}
          style={{ color: screen === 'home' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              screen === 'home' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
          </span>
          <span>Home</span>
        </button>

        <button
          type="button"
          className="tb"
          aria-current={['requests', 'req'].includes(screen) ? 'page' : 'false'}
          onClick={() => go('requests')}
          style={{ color: ['requests', 'req'].includes(screen) ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              ['requests', 'req'].includes(screen)
                ? { background: 'var(--rbg)', color: '#C8102E' }
                : undefined
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </span>
          <span>Requests</span>
        </button>

        <div className="fabwrap">
          <button
            type="button"
            className="fab"
            aria-label="Post a requirement"
            aria-haspopup="dialog"
            onClick={() => setSheet('compose')}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <span aria-hidden="true">Post</span>
        </div>

        <button
          type="button"
          className="tb"
          aria-current={screen === 'conn' ? 'page' : 'false'}
          onClick={() => go('conn')}
          style={{ color: screen === 'conn' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              screen === 'conn' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
            </svg>
          </span>
          <span>Connected</span>
        </button>

        <button
          type="button"
          className="tb"
          aria-current={screen === 'notifs' ? 'page' : 'false'}
          onClick={() => go('notifs')}
          style={{ color: screen === 'notifs' ? '#C8102E' : 'var(--tx2)' }}
        >
          <span
            className="tpill"
            style={
              screen === 'notifs' ? { background: 'var(--rbg)', color: '#C8102E' } : undefined
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="dot" style={{ top: -4, right: 4 }}>
                {unread}
              </span>
            )}
          </span>
          <span>Alerts</span>
        </button>
      </nav>

      {/* QUICK-POST / MOBILE 3-STEP BOTTOM SHEET COMPOSER (Board 2) */}
      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet('')} />
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
            <span className="grab" aria-hidden="true" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              {sheet === 'review' && (
                <button
                  type="button"
                  className="ib"
                  aria-label="Back to editing"
                  onClick={() => setSheet('compose')}
                  style={{ marginLeft: -10 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              <b id="sh-t" style={{ fontSize: 19, flex: 1 }}>
                {sheet === 'compose'
                  ? 'New requirement'
                  : sheet === 'review'
                  ? 'Check before posting'
                  : 'Posted'}
              </b>
              <button
                type="button"
                className="ib"
                aria-label="Close"
                onClick={() => setSheet('')}
                style={{ marginRight: -10 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((idx) => {
                const cur = sheet === 'compose' ? 0 : sheet === 'review' ? 1 : 2;
                return (
                  <span
                    key={idx}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: idx <= cur ? 'var(--inv)' : 'var(--ln)',
                    }}
                  />
                );
              })}
            </div>

            {sheet === 'compose' && (
              <>
                <label htmlFor="sh-in" style={{ fontSize: 14, color: 'var(--tx2)' }}>
                  One sentence is enough: what, where, by when. Budget if you know it.
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    id="sh-in"
                    className="shin"
                    value={sheetText}
                    onChange={(e) => setSheetText(e.target.value)}
                    placeholder="e.g. 10,000 printed boxes in Pune within a month"
                  />
                  <button
                    type="button"
                    className="micb"
                    aria-label="Speak instead of typing"
                    onClick={() =>
                      setSheetText(
                        '10,000 printed corrugated boxes in Pune, need within a month, budget around 1.2 lakh'
                      )
                    }
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                    </svg>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx2)' }}>
                    Popular
                  </span>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    {[
                      'Packaging boxes',
                      'Website for my shop',
                      'GST filing',
                      'Logo design',
                      'Rooftop solar',
                    ].map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        className="idea"
                        onClick={() => setSheetText(`${idea} — `)}
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn b1"
                  disabled={!sheetText.trim()}
                  onClick={() => {
                    if (sheetText.trim()) setSheet('review');
                  }}
                  style={{
                    marginTop: 4,
                    opacity: sheetText.trim() ? 1 : 0.45,
                  }}
                >
                  Continue
                </button>
                <span style={{ fontSize: 12.5, color: 'var(--tx2)', textAlign: 'center' }}>
                  Posting is free · no commission
                </span>
              </>
            )}

            {sheet === 'review' && (
              <>
                <div className="rv">
                  <span className="rk">Title</span>
                  <b style={{ fontSize: 16 }}>
                    {sampleDraft(sheetText).title}
                  </b>
                </div>
                <div className="rv">
                  <span className="rk">Category</span>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {sampleDraft(sheetText).cat} › {sampleDraft(sheetText).sub}
                  </span>
                </div>
                <div className="rv">
                  <span className="rk">Where</span>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {sampleDraft(sheetText).loc} · partners who deliver here
                  </span>
                </div>
                <div className="rv" style={{ gap: 8 }}>
                  <span className="rk" id="when-l">
                    When
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="when-l"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                  >
                    {WH.map((w, idx) => (
                      <button
                        key={w}
                        type="button"
                        role="radio"
                        className="idea"
                        aria-checked={sheetWhen === idx}
                        onClick={() => setSheetWhen(idx)}
                        style={
                          sheetWhen === idx
                            ? {
                                background: 'var(--inv)',
                                color: '#fff',
                                borderColor: 'var(--tx)',
                              }
                            : undefined
                        }
                      >
                        {w.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="rv" style={{ borderBottom: 0 }}>
                  <span className="rk">Budget · optional</span>
                  <input
                    className="shbud"
                    value={sheetBudget}
                    onChange={(e) => setSheetBudget(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    const d = sampleDraft(sheetText);
                    handlePostDraft({
                      ...d,
                      timeline: WH[sheetWhen],
                      budget: sheetBudget,
                    });
                    setSheet('done');
                  }}
                >
                  Post free
                </button>
              </>
            )}

            {sheet === 'done' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'center',
                    padding: '8px 0 4px',
                  }}
                >
                  <span
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--gbg)',
                      color: 'var(--gtx)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <span className="mono" style={{ color: 'var(--tx2)' }}>
                    XPO-REQ-{seq - 1}
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      lineHeight: '21px',
                      color: 'var(--tx2)',
                      maxWidth: 300,
                    }}
                  >
                    Sent to 3 matching partners. We&apos;ll notify you when someone is interested — usually within 15 minutes.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    setSheet('');
                    setSheetText('');
                  }}
                >
                  Track this request
                </button>
                <button
                  type="button"
                  className="btn b2"
                  onClick={() => {
                    setSheet('');
                    setSheetText('');
                  }}
                >
                  Done
                </button>
              </>
            )}
          </section>
        </>
      )}

      {/* CHECKOUT SHEET MODAL */}
      {co && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(21,23,28,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
            zIndex: 50,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Get Client Plan"
            className="card"
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
            {co === 'choose' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 20 }}>XPO Client Plan</b>
                  <button
                    type="button"
                    className="btn bl"
                    onClick={() => setCo(null)}
                    aria-label="Close"
                  >
                    Close
                  </button>
                </div>
                <span style={{ fontSize: 14, color: 'var(--tx2)' }}>
                  30 views a month. Cancel any time.
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
                      aria-checked={india}
                      onClick={() => {
                        setCountry('IN');
                        setMethod('upi');
                      }}
                      style={
                        india
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
                      aria-checked={!india}
                      onClick={() => {
                        setCountry('INTL');
                        setMethod('paypal');
                      }}
                      style={
                        !india
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
                  {(india
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
                      aria-checked={activeMethod === mKey}
                      onClick={() => setMethod(mKey)}
                      style={
                        activeMethod === mKey
                          ? { background: 'var(--sf)', border: '2px solid var(--tx)' }
                          : { background: 'var(--sf)', border: '1.5px solid var(--ln2)' }
                      }
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <b style={{ fontSize: 15 }}>{mLabel}</b>
                        <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{mSub}</span>
                      </span>
                      <span aria-hidden="true" style={{ fontWeight: 800 }}>
                        {activeMethod === mKey ? '●' : '○'}
                      </span>
                    </button>
                  ))}
                </div>

                {!india && (
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                    PayPal only, in US$.
                  </span>
                )}

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
                    <span>Plan, monthly</span>
                    <span>{india ? '₹299.00' : '$9.99'}</span>
                  </div>
                  {india && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST 18%</span>
                      <span>₹53.82</span>
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
                    <span>{india ? '₹352.82' : '$9.99'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn b1"
                  onClick={() => setCo('processing')}
                >
                  Pay {india ? '₹352.82' : '$9.99'} with{' '}
                  {{ upi: 'UPI', card: 'card', paypal: 'PayPal' }[activeMethod]}
                </button>
              </>
            )}

            {co === 'processing' && (
              <>
                <b style={{ fontSize: 20 }}>Confirming your payment…</b>
                <span style={{ fontSize: 14.5, color: 'var(--tx2)' }}>
                  Approve it in{' '}
                  {
                    {
                      upi: 'your UPI app',
                      card: "your bank's page",
                      paypal: 'the PayPal window',
                    }[activeMethod]
                  }
                  .
                </span>
                <button
                  type="button"
                  className="btn b3"
                  onClick={() => {
                    if (failNext) {
                      setCo('failed');
                      setFailNext(false);
                    } else {
                      setCo('success');
                      setPlanOn(true);
                      setPlan(30);
                    }
                  }}
                >
                  Continue (prototype)
                </button>
              </>
            )}

            {co === 'success' && (
              <>
                <span
                  className="chip"
                  style={{
                    background: 'var(--gbg)',
                    color: 'var(--gtx)',
                    alignSelf: 'flex-start',
                  }}
                >
                  Payment confirmed
                </span>
                <b style={{ fontSize: 22 }}>Client Plan is active</b>
                <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                  30 views until 2 Dec. Invoice emailed.
                </span>
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    if (coAfter) {
                      updatePartner(
                        coAfter.rid,
                        coAfter.pid,
                        'waiting',
                        'Unlocked · connection request sent'
                      );
                      setPlan(29);
                      setRid(coAfter.rid);
                      setScreen('req');
                      setCoAfter(null);
                    }
                    setCo(null);
                  }}
                >
                  {coAfter ? 'Unlock the partner now' : 'Done'}
                </button>
              </>
            )}

            {co === 'failed' && (
              <>
                <span
                  className="chip"
                  style={{
                    background: 'var(--rbg)',
                    color: 'var(--rtx)',
                    alignSelf: 'flex-start',
                  }}
                >
                  Payment didn&apos;t go through
                </span>
                <b style={{ fontSize: 20 }}>
                  {activeMethod === 'upi'
                    ? 'Your bank declined the UPI mandate'
                    : activeMethod === 'paypal'
                    ? "PayPal couldn't complete the payment"
                    : 'Your card was declined'}
                </b>
                <span style={{ fontSize: 14.5, lineHeight: '22px', color: 'var(--tx2)' }}>
                  Nothing was charged.
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn b1"
                    onClick={() => setCo('processing')}
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => setCo('choose')}
                  >
                    Use another method
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* PROTOTYPE CONTROLS DRAWER (Verbatim from End-to-End UX.html) */}
      <section
        aria-label="Prototype controls"
        className="proto"
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
          onClick={() => setPanel((p) => !p)}
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
          <span>Prototype controls</span>
          <span>{panel ? '−' : '+'}</span>
        </button>

        {panel && (
          <>
            <span style={{ color: '#B9BCC4' }}>Jump to a situation</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(
                [
                  ['active', 'Active client'],
                  ['new', 'First visit'],
                  ['out', 'Out of free views'],
                  ['plan', 'Plan active'],
                  ['abroad', 'Overseas client'],
                ] as const
              ).map(([sKey, sLabel]) => (
                <button
                  key={sKey}
                  type="button"
                  className="ctl"
                  onClick={() => applyScene(sKey)}
                >
                  {sLabel}
                </button>
              ))}
              <button
                type="button"
                className="ctl"
                onClick={() => setSheet('compose')}
              >
                Mobile Post Sheet
              </button>
            </div>

            <span style={{ color: '#B9BCC4' }}>Act as the other side</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {waitingPartner && (
                <>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() =>
                      updatePartner(
                        rid,
                        waitingPartner.id,
                        'connected',
                        `${waitingPartner.real} accepted · numbers shared both ways`
                      )
                    }
                  >
                    Partner accepts
                  </button>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() =>
                      updatePartner(
                        rid,
                        waitingPartner.id,
                        'declined',
                        `${waitingPartner.real} can't take this on`
                      )
                    }
                  >
                    Partner declines
                  </button>
                </>
              )}

              {reqs.r2 && reqs.r2.status === 'finding' && reqs.r2.partners.length === 0 && (
                <button
                  type="button"
                  className="ctl"
                  onClick={() => {
                    updateReq(
                      'r2',
                      {
                        status: 'interested',
                        partners: [
                          {
                            id: 'p9',
                            real: 'Shree Packaging',
                            masked: 'Manufacturer · Pune',
                            city: 'Pune',
                            verified: true,
                            pitch:
                              '"5-ply and 3-ply lines in Chakan; 10,000 printed boxes in 9 days."',
                            tags: ['Offset print', 'Replied in 3 min'],
                            details: '11 years · ISO 9001 · GST verified',
                            phone: '+91 99870 44556',
                            st: 'locked',
                          },
                        ],
                      },
                      'Shree Packaging is interested in XPO-REQ-41208'
                    );
                    setNotifsRead(false);
                  }}
                >
                  A partner says yes to the boxes request
                </button>
              )}

              {reqs.r3 && reqs.r3.status === 'held' && (
                <>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() =>
                      updateReq(
                        'r3',
                        { status: 'finding', wave: 1 },
                        'XPO-REQ-41190 approved · now finding partners'
                      )
                    }
                  >
                    Admin approves held request
                  </button>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() =>
                      updateReq('r3', { status: 'rejected' }, 'XPO-REQ-41190 needs changes')
                    }
                  >
                    Admin asks for changes
                  </button>
                </>
              )}

              {kyc === 'pending' && (
                <>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() => {
                      setKyc('verified');
                      setToast("You're verified");
                    }}
                  >
                    Admin verifies KYC
                  </button>
                  <button
                    type="button"
                    className="ctl"
                    onClick={() => setKyc('rejected')}
                  >
                    Admin rejects KYC
                  </button>
                </>
              )}

              <button
                type="button"
                className="ctl"
                onClick={() => setFailNext((f) => !f)}
              >
                {failNext ? 'Next payment: will fail ✓' : 'Make next payment fail'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <Link
                href="/absorber/opportunities"
                style={{ color: '#9FC1FF', fontWeight: 700, textDecoration: 'none' }}
              >
                Partner app →
              </Link>
              <Link
                href="/admin/dashboard"
                style={{ color: '#9FC1FF', fontWeight: 700, textDecoration: 'none' }}
              >
                Superadmin →
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
