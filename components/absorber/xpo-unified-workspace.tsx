'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Real content & test identities matching the reference prototype
interface ClientReq {
  id: string;
  key: string;
  cat: string;
  status: 'interested' | 'finding' | 'checking';
  title: string;
  summary: string;
  city: string;
  when: string;
  budget: string;
  time: string;
  n?: number;
}

export interface MyReply {
  quote: string;
  timeline: string;
  pitch: string;
  repliedAt: string;
  updatedAt?: string;
}

export interface LeadItem {
  id: string;
  key: string;
  cat: string;
  badge: string;
  state: 'new' | 'sent' | 'connected';
  statusText?: string;
  title: string;
  desc: string;
  city: string;
  when: string;
  budget: string;
  time: string;
  tags: string[];
  myReply?: MyReply;
}

const INITIAL_CREQS: ClientReq[] = [
  {
    id: 'XPO-REQ-40971',
    key: 'r1',
    cat: 'Web & Mobile Development',
    status: 'interested',
    title: 'E-commerce website for a 5-store retail chain',
    summary: 'Product catalogue for 5 stores, UPI checkout, store pickup, and stock sync with billing.',
    city: 'Hyderabad',
    when: 'Within 2-4 Weeks',
    budget: '₹2,00,000',
    time: 'Today, 10:42',
    n: 2,
  },
  {
    id: 'XPO-REQ-41208',
    key: 'r2',
    cat: 'Industrial Packaging & Raw Materials',
    status: 'finding',
    title: '10,000 printed 3-ply corrugated boxes',
    summary: '3-ply, 12×10×8 in, two-colour logo print, delivered to a Pune warehouse.',
    city: 'Pune',
    when: 'Within 2-4 Weeks',
    budget: 'Quotes invited',
    time: 'Today, 11:05',
  },
  {
    id: 'XPO-REQ-41190',
    key: 'r3',
    cat: 'Performance Marketing & SEO',
    status: 'checking',
    title: 'Marketing for a fantasy sports and betting app',
    summary: 'Campaign launch across Meta and Google for an app.',
    city: 'Bengaluru',
    when: 'Immediate (Within 7 Days)',
    budget: '₹5,00,000',
    time: 'Today, 09:12',
  },
];

const INITIAL_LEADS: LeadItem[] = [
  {
    id: 'XPO-REQ-41208',
    key: 'l1',
    cat: 'Packaging & Printing',
    badge: 'WAVE 1 · NEW',
    state: 'new',
    title: '10,000 printed 3-ply corrugated boxes',
    desc: '3-ply corrugated mailer boxes (12×9×4 in), single-colour black logo on the top flap. Delivery to a Kukatpally warehouse, Hyderabad within 2 weeks.',
    city: 'Hyderabad',
    when: 'Within 2 weeks',
    budget: 'Open to quotes',
    time: '2 min ago',
    tags: ['matched'],
  },
  {
    id: 'XPO-REQ-41302',
    key: 'l2',
    cat: 'Web & Mobile Development',
    badge: 'MATCHED TO YOU',
    state: 'new',
    title: 'Custom ERP & inventory sync for 12 pharmaceutical depots',
    desc: 'Web & mobile inventory portal connecting 12 state depots with batch-expiry tracking, a GST e-invoicing API, and Tally Prime sync.',
    city: 'Mumbai',
    when: 'Within a month',
    budget: '₹5L – ₹12L',
    time: '18 min ago',
    tags: ['matched'],
  },
  {
    id: 'XPO-REQ-41299',
    key: 'l3',
    cat: 'Web & Mobile Development',
    badge: 'Overseas · USD',
    state: 'sent',
    statusText: 'Reply sent · waiting on client',
    title: 'Shopify Plus migration & headless storefront for a D2C apparel brand',
    desc: 'Magento to Shopify Plus with a bilingual EN/AR RTL storefront, multi-currency checkout (AED/SAR/USD), and ERP webhook integration.',
    city: 'Dubai, UAE',
    when: 'Right away (urgent)',
    budget: '$8,000 – $15,000',
    time: '1 hr ago',
    tags: ['matched', 'overseas'],
    myReply: {
      quote: '$9,500 fixed',
      timeline: '3 weeks',
      pitch: 'Certified Shopify Plus agency with 8+ years experience in headless commerce and bilingual EN/AR RTL storefronts. We guarantee sub-1s page load times, multi-currency checkout, and seamless webhook integration with your existing ERP.',
      repliedAt: '1 hr ago',
    },
  },
  {
    id: 'XPO-REQ-39114',
    key: 'l4',
    cat: 'Web & Mobile Development',
    badge: 'Connected',
    state: 'connected',
    statusText: 'Connected with Pavan',
    title: 'Company website developer',
    desc: 'Corporate B2B catalogue website with fast mobile load times, WhatsApp lead capture, and product inquiry forms.',
    city: 'Hyderabad',
    when: 'Completed',
    budget: '₹1.2L',
    time: '12 days ago',
    tags: ['all'],
    myReply: {
      quote: '₹1,20,000',
      timeline: '2 weeks',
      pitch: 'Delivered 40+ corporate B2B websites with instant WhatsApp lead generation, mobile-optimized responsive design, and CMS catalog.',
      repliedAt: '12 days ago',
    },
  },
];

const SUPPORT_PHONE = '+91 40 4917 2200';
const WHATSAPP_BOT_URL = 'https://wa.me/914049172200?text=' + encodeURIComponent('Hi XPO India, I am testing the XPO WhatsApp Chatbot automation for client requirements and partner lead matching.');

async function postMarketplaceAction(action: string, payload: Record<string, any> = {}) {
  try {
    const res = await fetch('/api/marketplace/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function XpoUnifiedWorkspace({
  initialRole = 'partner',
  initialScreen,
  initialOppId,
}: {
  initialRole?: 'client' | 'partner';
  initialScreen?: string;
  initialOppId?: string;
}) {
  const [role, setRole] = useState<'client' | 'partner'>(initialRole);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [rev, setRev] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [menu, setMenu] = useState<'none' | 'alerts' | 'profile' | 'whatsappDemo'>('none');

  // Client sub-screens: 'home' | 'reqs' | 'req' | 'conn' | 'plan'
  const [cs, setCs] = useState<string>(initialRole === 'client' && initialScreen ? initialScreen : 'home');
  // Partner sub-screens: 'reqs' | 'lead' | 'replies' | 'conn' | 'cats' | 'plan'
  const [ps, setPs] = useState<string>(
    initialRole === 'partner' && initialScreen ? (initialScreen === 'feed' ? 'reqs' : initialScreen === 'opp' ? 'lead' : initialScreen) : 'reqs'
  );
  const [pfilter, setPfilter] = useState<'matched' | 'all' | 'overseas'>('matched');
  const [pLeadKey, setPLeadKey] = useState<string>(initialOppId || 'l1');
  const [cReqKey, setCReqKey] = useState<string>('r1');

  // Demo identities
  const [clientViews, setClientViews] = useState<number>(4);
  const [partnerReplies, setPartnerReplies] = useState<number>(3);

  // Dynamic state
  const [creqs, setCreqs] = useState<ClientReq[]>(INITIAL_CREQS);
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [r1Requested, setR1Requested] = useState<boolean>(false);
  const [r1ReplySent, setR1ReplySent] = useState<boolean>(false);

  // New compose text
  const [composeText, setComposeText] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [partnerNewQuote, setPartnerNewQuote] = useState<string>('₹1,80,000');
  const [partnerNewTimeline, setPartnerNewTimeline] = useState<string>('Within 2 weeks');
  const [isEditingReply, setIsEditingReply] = useState<boolean>(false);
  const [editQuoteVal, setEditQuoteVal] = useState<string>('');
  const [editTimelineVal, setEditTimelineVal] = useState<string>('');
  const [editPitchVal, setEditPitchVal] = useState<string>('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (rev) {
      document.body.classList.add('rev');
    } else {
      document.body.classList.remove('rev');
    }
  }, [theme, rev]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? '' : cur));
    }, 2800);
  };

  // Switch role handler
  const handleRoleSwitch = (newRole: 'client' | 'partner') => {
    setMenu('none');
    setRole(newRole);
  };

  // Nav icons (SVG inline paths)
  const icons = {
    home: (
      <svg viewBox="0 0 24 24">
        <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    list: (
      <svg viewBox="0 0 24 24">
        <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 24 24">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
    ),
    inbox: (
      <svg viewBox="0 0 24 24">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    tag: (
      <svg viewBox="0 0 24 24">
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7" cy="7" r="1" />
      </svg>
    ),
    switchRole: (
      <svg viewBox="0 0 24 24">
        <path d="M16 3l4 4-4 4" />
        <path d="M20 7H4" />
        <path d="M8 21l-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    ),
  };

  const ALERTS = {
    client: [
      { t: 'Klo Tech replied', d: 'Sent a quote on: E-commerce website for a 5-store retail chain', action: () => { setCs('req'); setMenu('none'); } },
      { t: 'Wave 2 matched', d: '1 more verified partner is looking at your Pune box requirement', action: () => { setCs('reqs'); setMenu('none'); } },
    ],
    partner: [
      { t: 'Action needed · Contact unlocked', d: 'Test Traders (Pavan) used 1 view to see your details.', action: () => { setPs('reqs'); setMenu('none'); } },
      { t: 'New lead matched', d: '10,000 printed 3-ply corrugated boxes (Hyderabad)', action: () => { setPLeadKey('l1'); setPs('lead'); setMenu('none'); } },
    ],
  };

  // Helper chips and badges
  const renderStatusPill = (status: ClientReq['status']) => {
    if (status === 'interested') return <span className="chip c-g">2 interested</span>;
    if (status === 'finding') return <span className="chip c-b">Finding · ~15 min</span>;
    if (status === 'checking') return <span className="chip c-a">Being checked</span>;
    return null;
  };

  const renderLeadBadge = (l: LeadItem) => {
    let colorClass = 'c-a';
    if (l.state === 'connected') colorClass = 'c-g';
    else if (l.badge.includes('Overseas')) colorClass = 'c-b';
    else if (l.badge.includes('NEW')) colorClass = 'c-r';
    return <span className={"chip " + colorClass}>{l.badge}</span>;
  };

  const renderLeadStatus = (l: LeadItem) => {
    if (l.state === 'sent') return <span className="chip c-a">Reply sent</span>;
    if (l.state === 'connected') return <span className="chip c-g">Connected</span>;
    return null;
  };

  // ----------------------------------------------------
  // CLIENT VIEW COMPONENTS
  // ----------------------------------------------------
  const renderClientReqCard = (r: ClientReq, attn: boolean) => {
    const act = r.status === 'interested' ? 'Review 2 replies' : 'Open details';
    return (
      <button
        key={r.key}
        className={"card req" + (attn ? ' attn' : '')}
        onClick={() => {
          if (r.key === 'r1') setCs('req');
          else {
            setCs('reqs');
            showToast('Opened ' + r.id);
          }
        }}
      >
        <div className="head">
          <span className="mono mute3">{r.id}</span>
          <span className="chip">{r.cat}</span>
          <span className="sp" />
          {renderStatusPill(r.status)}
        </div>
        <h3>{r.title}</h3>
        <span className="mute" style={{ fontSize: '13px' }}>
          {r.summary}
        </span>
        <div className="meta">
          <span className="chip">📍 {r.city}</span>
          <span className="chip">⏱ {r.when}</span>
          <span className="chip">💰 {r.budget}</span>
        </div>
        <div className="foot">
          <span className="mono mute3">{r.time}</span>
          <span className="sp" />
          <span className={"btn sm " + (attn ? 'red' : 'ghost')} style={{ pointerEvents: 'none' }}>
            {act} →
          </span>
        </div>
      </button>
    );
  };

  const renderClientHome = () => {
    const examples = ['Corrugated boxes, Pune', 'GST filing, 3 entities', 'Office fit-out in Gurugram'];
    const attnReq = creqs[0];

    return (
      <>
        <div className="card" data-anno="compose">
          <div className="anno">
            <span className="pin">Your real compose box, given room</span>
            <span className="tip">
              <b>Kept:</b> &quot;What do you need, Pavan?&quot;, the examples and the 5-minute-wave note. <b>Removed:</b> the Mobile-App promo bar and the broken counters.
            </span>
          </div>
          <h2 style={{ fontSize: '20px' }}>What do you need, Pavan?</h2>
          <textarea
            className="inp"
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            placeholder="Describe what you need…"
          />
          <div className="row">
            {examples.map((ex) => (
              <button key={ex} className="ex" onClick={() => setComposeText(ex)}>
                {ex}
              </button>
            ))}
          </div>
          <div className="row">
            <button
              className="btn red"
              onClick={async () => {
                if (composeText.trim().length < 4) {
                  showToast('Please type a requirement description');
                  return;
                }
                const newReq: ClientReq = {
                  id: 'XPO-REQ-' + Math.floor(40000 + Math.random() * 5000),
                  key: 'r' + Date.now(),
                  cat: 'General Trade',
                  status: 'finding',
                  title: composeText.split('\n')[0].slice(0, 60),
                  summary: composeText,
                  city: 'Hyderabad',
                  when: 'Within 2-4 Weeks',
                  budget: 'Quotes invited',
                  time: 'Just now',
                };
                setCreqs([newReq, ...creqs]);
                setComposeText('');
                showToast('Requirement posted — matching verified partners in 5-minute waves.');
                await postMarketplaceAction('post_requirement', { requirement: newReq });
              }}
            >
              Continue
            </button>
            <span className="mute3" style={{ fontSize: '12.5px' }}>
              Goes out in 5-minute waves to verified partners · zero commission
            </span>
          </div>
        </div>

        <div data-anno="attn">
          <div className="anno">
            <span className="pin">No duplicate banner</span>
            <span className="tip">
              <b>Fixed:</b> the live &quot;Action needed&quot; banner and the identical request card were both on screen. Now it is one item at the top of your list.
            </span>
          </div>
          <span className="lbl" style={{ margin: '4px 2px' }}>
            Needs you
          </span>
          {renderClientReqCard(attnReq, true)}
        </div>

        <span className="lbl" style={{ margin: '8px 2px 0' }}>
          Recent requests
        </span>
        {creqs.slice(1).map((r) => renderClientReqCard(r, false))}
      </>
    );
  };

  const renderClientReqDetail = () => {
    const r = creqs[0];
    return (
      <>
        <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setCs('reqs')}>
          ← My requests
        </button>
        <div className="card">
          <div className="head" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="mono mute3">{r.id}</span>
            <span className="chip">{r.cat}</span>
            <span className="sp" />
            {renderStatusPill(r.status)}
          </div>
          <h2 style={{ fontSize: '20px' }}>{r.title}</h2>
          <span className="mute" style={{ fontSize: '13.5px' }}>
            {r.summary}
          </span>
          <div className="meta row">
            <span className="chip">📍 {r.city}</span>
            <span className="chip">⏱ {r.when}</span>
            <span className="chip">💰 {r.budget}</span>
            <span className="chip">{r.time}</span>
          </div>
        </div>

        <div className="card" data-anno="replies">
          <div className="anno">
            <span className="pin">Replies inline, no flipping</span>
            <span className="tip">
              <b>Kept:</b> partner quotes, time, pitch and the &quot;Connect · 1 view&quot; action. <b>Fixed:</b> replies sit directly below the request; unlocking doesn’t bounce you to another screen.
            </span>
          </div>
          <span className="lbl">2 verified partners replied</span>

          {/* Partner 1: Klo Tech */}
          <div className="rep">
            <div className="row">
              <span className="av">KT</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <b style={{ fontSize: '15px' }}>Klo Tech</b>
                <br />
                <span className="mute" style={{ fontSize: '12.5px' }}>
                  Web & Mobile Development · Hyderabad
                </span>
              </span>
              {r1Requested ? (
                <span className="chip c-a">Request sent</span>
              ) : (
                <button
                  className="btn red sm"
                  onClick={async () => {
                    setR1Requested(true);
                    setClientViews((v) => Math.max(0, v - 1));
                    showToast('Request sent. The direct phone & WhatsApp is shared once they accept.');
                    await postMarketplaceAction('client_connect_request', { partner: 'Klo Tech' });
                  }}
                >
                  Connect · 1 view
                </button>
              )}
            </div>
            <span style={{ fontSize: '13.5px' }}>
              &quot;We built e-commerce platforms for 3 retail chains with multi-store inventory sync. Can demo our POS bridge tomorrow.&quot;
            </span>
            <div className="row">
              <span className="chip">Quote: ₹1,80,000</span>
              <span className="chip">⏱ 3 weeks</span>
            </div>
            {r1Requested && (
              <div className="row" style={{ background: 'var(--sf2)', padding: '10px 12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px' }}>
                  Waiting for Klo Tech to accept and share direct phone &amp; WhatsApp.
                </span>
              </div>
            )}
          </div>

          {/* Partner 2: DevSprint Studio */}
          <div className="rep">
            <div className="row">
              <span className="av">DS</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <b style={{ fontSize: '15px' }}>DevSprint Studio</b>
                <br />
                <span className="mute" style={{ fontSize: '12.5px' }}>
                  Web & Mobile Development · Bengaluru
                </span>
              </span>
              <button
                className="btn sm"
                onClick={() => showToast('Another partner reply. Connect uses 1 view.')}
              >
                Connect · 1 view
              </button>
            </div>
            <span style={{ fontSize: '13.5px' }}>
              &quot;Custom Shopify/WooCommerce build with automated stock sync across 5 locations. Delivered in 4 weeks.&quot;
            </span>
            <div className="row">
              <span className="chip">Quote: ₹2,20,000</span>
              <span className="chip">⏱ 4 weeks</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderClientConn = () => (
    <>
      <span className="lbl" style={{ margin: '2px' }}>
        Connected partners (1)
      </span>
      <div className="card">
        <div className="row">
          <span className="sq">✓</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <b style={{ fontSize: '15px' }}>Company website developer</b>
            <br />
            <span className="mute" style={{ fontSize: '12.5px' }}>
              Verified partner · Completed · ₹1.2L
            </span>
          </span>
        </div>
        <div className="row">
          <a
            href={WHATSAPP_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ink sm"
            style={{ textDecoration: 'none' }}
          >
            Message on WhatsApp
          </a>
          <a href={"tel:" + SUPPORT_PHONE} className="btn sm" style={{ textDecoration: 'none' }}>
            Call
          </a>
        </div>
      </div>
    </>
  );

  const renderClientPlan = () => (
    <>
      <div className="kpis">
        <div className="kpi">
          <b>{clientViews}</b>
          <span>Free views left</span>
        </div>
        <div className="kpi">
          <b>{creqs.length}</b>
          <span>Active requests</span>
        </div>
        <div className="kpi">
          <b>1</b>
          <span>Connections</span>
        </div>
      </div>
      <div className="card">
        <span className="lbl">How views work</span>
        <span className="mute" style={{ fontSize: '13.5px' }}>
          Posting a requirement is free and XPO takes no commission. Each time you unlock a partner to connect, it uses one view. You have {clientViews} free views left.
        </span>
        <button className="btn red" style={{ alignSelf: 'flex-start' }} onClick={() => showToast('Upgrade flow — adds more connection views to your account.')}>
          Get more views
        </button>
      </div>
      <div className="card flat">
        <span className="lbl">Need a hand?</span>
        <span className="mute" style={{ fontSize: '13.5px' }}>
          Support: {SUPPORT_PHONE} · Instant WhatsApp Bot available 24/7
        </span>
      </div>
    </>
  );

  // ----------------------------------------------------
  // PARTNER VIEW COMPONENTS
  // ----------------------------------------------------
  const renderLeadCard = (l: LeadItem) => {
    const act = l.state === 'new' ? 'View & send reply' : 'Review my reply';
    return (
      <button
        key={l.key}
        className="card req"
        onClick={() => {
          setPLeadKey(l.key);
          setIsEditingReply(false);
          setPs('lead');
        }}
      >
        <div className="head">
          <span className="mono mute3">{l.id}</span>
          {renderLeadBadge(l)}
          <span className="sp" />
          {renderLeadStatus(l)}
        </div>
        <h3>{l.title}</h3>
        <span className="mute" style={{ fontSize: '13px' }}>
          {l.desc}
        </span>
        <div className="meta">
          <span className="chip">{l.cat}</span>
          <span className="chip">📍 {l.city}</span>
          <span className="chip">⏱ {l.when}</span>
          <span className="chip">💰 {l.budget}</span>
        </div>
        {l.myReply && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginTop: '7px',
              marginBottom: '3px',
              alignItems: 'center',
            }}
          >
            <span className="chip c-g" style={{ fontWeight: 700 }}>
              💰 Your Quote: {l.myReply.quote}
            </span>
            <span className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx2)' }}>
              ⏱ {l.myReply.timeline}
            </span>
            <span className="mute3" style={{ fontSize: '12px' }}>
              Replied {l.myReply.repliedAt}
            </span>
          </div>
        )}
        <div className="foot">
          <span className="mono mute3">{l.time}</span>
          <span className="sp" />
          <span className={"btn sm " + (l.state === 'new' ? 'red' : 'ghost')} style={{ pointerEvents: 'none' }}>
            {act} →
          </span>
        </div>
      </button>
    );
  };

  const renderPartnerLeads = () => {
    const count = {
      matched: leads.filter((l) => l.tags.includes('matched')).length,
      all: leads.length,
      overseas: leads.filter((l) => l.tags.includes('overseas')).length,
    };

    const filteredList = leads.filter((l) => {
      if (pfilter === 'all') return true;
      if (pfilter === 'overseas') return l.tags.includes('overseas');
      return l.tags.includes('matched');
    });

    const tabs: Array<['matched' | 'all' | 'overseas', string, number]> = [
      ['matched', 'Matched', count.matched],
      ['all', 'All requests', count.all],
      ['overseas', 'Overseas USD', count.overseas],
    ];

    return (
      <>
        <p className="mute" style={{ fontSize: '13.5px', margin: '0 2px 4px' }}>
          Sent in 5-minute waves to verified partners in your categories. Zero commission on deals.
        </p>

        <div data-anno="tabs">
          <div className="anno left">
            <span className="pin">Real filters, counts fixed</span>
            <span className="tip">
              <b>Kept:</b> the Matched / All requests / Overseas USD filters. <b>Fixed:</b> the live counts match the list, and duplicate buttons are consolidated.
            </span>
          </div>
          <div className="tabs">
            {tabs.map(([tabKey, label, cnt]) => (
              <button
                key={tabKey}
                className="tb"
                aria-selected={pfilter === tabKey}
                onClick={() => setPfilter(tabKey)}
              >
                {label} ({cnt})
              </button>
            ))}
          </div>
        </div>

        {/* Attention banner if consent not given */}
        {!consentGiven && (
          <div data-anno="attn">
            <div className="anno">
              <span className="pin">Live banner, kept — shown once</span>
              <span className="tip">
                <b>Word-for-word from the app:</b> &quot;Test Traders (Pavan) used 1 view to see your details.&quot; Sits cleanly at the top of the feed without duplicate stacked banners.
              </span>
            </div>
            <div className="card attn">
              <div className="head" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="chip c-r">Action needed</span>
                <span className="sp" />
                <span className="mono mute3">XPO-REQ-40971</span>
              </div>
              <b style={{ fontSize: '15px' }}>Test Traders (Pavan) used 1 view to see your details</b>
              <span className="mute" style={{ fontSize: '13.5px' }}>
                Confirm to share your phone &amp; WhatsApp and unlock their direct number.
              </span>
              <div className="row">
                <button
                  className="btn red sm"
                  onClick={async () => {
                    setConsentGiven(true);
                    showToast('Contact shared. You are connected with Test Traders (Pavan).');
                    await postMarketplaceAction('partner_consent_share', { client: 'Test Traders (Pavan)' });
                  }}
                >
                  Accept &amp; share contact
                </button>
                <button
                  className="btn sm"
                  onClick={() => {
                    setRole('client');
                    setCs('req');
                  }}
                >
                  Review request
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredList.map(renderLeadCard)}
      </>
    );
  };

  const renderPartnerLeadDetail = () => {
    const l = leads.find((x) => x.key === pLeadKey) || leads[0];
    const isSentOrConnected = r1ReplySent || l.state === 'sent' || l.state === 'connected' || !!l.myReply;

    return (
      <>
        <button
          className="btn ghost sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            setIsEditingReply(false);
            setPs('reqs');
          }}
        >
          ← All requests
        </button>
        <div className="card">
          <div className="head" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="mono mute3">{l.id}</span>
            {renderLeadBadge(l)}
            <span className="sp" />
            {renderLeadStatus(l)}
          </div>
          <h2 style={{ fontSize: '19px' }}>{l.title}</h2>
          <span className="mute" style={{ fontSize: '13.5px' }}>
            {l.desc}
          </span>
          <div className="meta row">
            <span className="chip">{l.cat}</span>
            <span className="chip">📍 {l.city}</span>
            <span className="chip">⏱ {l.when}</span>
            <span className="chip">💰 {l.budget}</span>
            <span className="chip">{l.time}</span>
          </div>
        </div>

        {isSentOrConnected ? (
          <div className="card" style={{ border: '1.5px solid var(--g)', background: 'var(--sf)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="chip c-g" style={{ fontWeight: 700 }}>
                  {l.state === 'connected' ? '🤝 Connected with Client' : '✓ Reply Sent · Awaiting Client'}
                </span>
                <span className="mute3" style={{ fontSize: '12px' }}>
                  Submitted: {l.myReply?.repliedAt || 'Recently'}
                </span>
              </div>
              {!isEditingReply && (
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    setIsEditingReply(true);
                    setEditQuoteVal(l.myReply?.quote || '₹1,80,000');
                    setEditTimelineVal(l.myReply?.timeline || 'Within 2 weeks');
                    setEditPitchVal(l.myReply?.pitch || replyText || '');
                  }}
                >
                  ✏️ Edit reply &amp; quote
                </button>
              )}
            </div>

            {isEditingReply ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <span className="lbl" style={{ margin: 0 }}>Edit Your Quote &amp; Delivery Timeline</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Quoted Amount / Pricing
                    </label>
                    <input
                      className="inp"
                      value={editQuoteVal}
                      onChange={(e) => setEditQuoteVal(e.target.value)}
                      placeholder="e.g. ₹1,80,000 or $9,500"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Delivery Timeline
                    </label>
                    <input
                      className="inp"
                      value={editTimelineVal}
                      onChange={(e) => setEditTimelineVal(e.target.value)}
                      placeholder="e.g. 2-3 weeks"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Proposal Pitch &amp; Capability Note
                  </label>
                  <textarea
                    className="inp"
                    rows={3}
                    value={editPitchVal}
                    onChange={(e) => setEditPitchVal(e.target.value)}
                    placeholder="Update your proposal note to the client..."
                  />
                </div>
                <div className="row" style={{ marginTop: '4px' }}>
                  <button
                    className="btn red sm"
                    onClick={() => {
                      const updatedReply: MyReply = {
                        quote: editQuoteVal || l.myReply?.quote || '₹1,80,000',
                        timeline: editTimelineVal || l.myReply?.timeline || 'Within 2 weeks',
                        pitch: editPitchVal || l.myReply?.pitch || '',
                        repliedAt: l.myReply?.repliedAt || 'Recently',
                        updatedAt: 'Just now',
                      };
                      setLeads((prev) =>
                        prev.map((item) => (item.key === l.key ? { ...item, myReply: updatedReply } : item))
                      );
                      setIsEditingReply(false);
                      showToast('Your quote and pitch were updated successfully!');
                    }}
                  >
                    Save changes
                  </button>
                  <button
                    className="btn ghost sm"
                    onClick={() => setIsEditingReply(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px',
                    marginTop: '10px',
                  }}
                >
                  <div style={{ padding: '10px 12px', background: 'var(--sf2)', borderRadius: '8px', border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Your Quoted Price
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--g)', marginTop: '2px' }}>
                      {l.myReply?.quote || '₹1,80,000'}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--sf2)', borderRadius: '8px', border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Delivery Commitment
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tx)', marginTop: '2px' }}>
                      ⏱ {l.myReply?.timeline || 'Within 2 weeks'}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--sf2)', borderRadius: '8px', border: '1px solid var(--ln)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Wave Placement
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--btx)', marginTop: '4px' }}>
                      Wave 1 Active (1 of 3)
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span className="lbl" style={{ margin: '0 0 4px 0' }}>Your Pitch &amp; Proposal Note</span>
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--sf2)',
                      borderRadius: '8px',
                      border: '1px solid var(--ln)',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      color: 'var(--tx)',
                    }}
                  >
                    {l.myReply?.pitch || (
                      <span className="mute3">Standard interest confirmed. Ready to share complete commercial breakdown upon contact unlock.</span>
                    )}
                  </div>
                  {l.myReply?.updatedAt && (
                    <span className="mute3" style={{ fontSize: '11.5px', marginTop: '3px', display: 'inline-block' }}>
                      Last edited: {l.myReply.updatedAt}
                    </span>
                  )}
                </div>

                <div className="row" style={{ marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    className="btn sm ghost"
                    onClick={() => {
                      setIsEditingReply(true);
                      setEditQuoteVal(l.myReply?.quote || '₹1,80,000');
                      setEditTimelineVal(l.myReply?.timeline || 'Within 2 weeks');
                      setEditPitchVal(l.myReply?.pitch || replyText || '');
                    }}
                  >
                    ✏️ Edit quote &amp; pitch
                  </button>

                  <a
                    href={'https://wa.me/914049172200?text=' + encodeURIComponent('Hi XPO, following up on my reply for requirement ' + l.id + ' (' + l.title + '). My quote is ' + (l.myReply?.quote || 'submitted') + '.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn sm"
                    style={{ textDecoration: 'none', background: '#075E54', color: '#fff' }}
                  >
                    💬 Follow up on WhatsApp
                  </a>

                  <button
                    className="btn sm ghost"
                    onClick={() => {
                      const summary = `XPO Lead: ${l.id} - ${l.title}\nMy Quote: ${l.myReply?.quote || '₹1,80,000'}\nTimeline: ${l.myReply?.timeline || '2 weeks'}\nPitch: ${l.myReply?.pitch || ''}`;
                      navigator.clipboard?.writeText(summary);
                      showToast('Proposal details copied to clipboard!');
                    }}
                  >
                    📋 Copy proposal
                  </button>

                  <span className="sp" />

                  <button
                    className="btn sm ghost"
                    style={{ color: 'var(--r)' }}
                    onClick={() => {
                      if (confirm('Are you sure you want to withdraw your reply for ' + l.id + '?')) {
                        setLeads((prev) =>
                          prev.map((item) =>
                            item.key === l.key
                              ? { ...item, state: 'new', statusText: undefined, myReply: undefined }
                              : item
                          )
                        );
                        setPartnerReplies((r) => r + 1);
                        showToast('Reply withdrawn. 1 credit restored.');
                        setPs('reqs');
                      }
                    }}
                  >
                    Withdraw reply
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="card" data-anno="reply">
            <div className="anno">
              <span className="pin">One action per lead</span>
              <span className="tip">
                <b>Structured reply:</b> Specify your quote amount, delivery timeline, and pitch note.
              </span>
            </div>
            <span className="lbl">Send Your Structured Proposal</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Your Quoted Price / Estimate
                </label>
                <input
                  className="inp"
                  value={partnerNewQuote}
                  onChange={(e) => setPartnerNewQuote(e.target.value)}
                  placeholder="e.g. ₹1,80,000 or $9,000"
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Estimated Delivery Timeline
                </label>
                <input
                  className="inp"
                  value={partnerNewTimeline}
                  onChange={(e) => setPartnerNewTimeline(e.target.value)}
                  placeholder="e.g. Within 2 weeks"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11.5px', color: 'var(--tx2)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                Pitch &amp; Capability Note
              </label>
              <textarea
                className="inp"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Why your firm is the best fit for this requirement..."
              />
            </div>
            <div className="row" style={{ marginTop: '10px' }}>
              <button
                className="btn red"
                onClick={async () => {
                  setR1ReplySent(true);
                  setPartnerReplies((r) => Math.max(0, r - 1));
                  const newReplyData: MyReply = {
                    quote: partnerNewQuote || '₹1,80,000',
                    timeline: partnerNewTimeline || 'Within 2 weeks',
                    pitch: replyText || 'Interested in this requirement. Ready to discuss technical specs and deliverables.',
                    repliedAt: 'Just now',
                  };
                  setLeads((prev) =>
                    prev.map((item) =>
                      item.key === l.key
                        ? {
                            ...item,
                            state: 'sent',
                            statusText: 'Reply sent · waiting on client',
                            myReply: newReplyData,
                          }
                        : item
                    )
                  );
                  showToast('Reply sent to client! You can review or edit it anytime.');
                  await postMarketplaceAction('partner_send_reply', {
                    leadId: l.id,
                    quote: partnerNewQuote,
                    timeline: partnerNewTimeline,
                    text: replyText,
                  });
                }}
              >
                Send reply · 1 free
              </button>
              <span className="mute3" style={{ fontSize: '12.5px' }}>
                {partnerReplies} free replies left
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderPartnerReplies = () => {
    const list = leads.filter((l) => l.state === 'sent' || l.state === 'connected');
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 0 8px 0' }}>
          <span className="lbl" style={{ margin: 0 }}>
            My replies ({list.length})
          </span>
          <span className="mute3" style={{ fontSize: '12px' }}>
            Click any lead to review or edit your submitted quote
          </span>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--sf2)', borderRadius: '8px', border: '1px solid var(--ln)', marginBottom: '10px', fontSize: '12.5px', color: 'var(--tx2)' }}>
          💡 <b>Review your proposals:</b> Tap any lead below to inspect your quoted pricing, delivery timeline, and pitch note, or make edits before the client unlocks.
        </div>
        {list.length ? list.map(renderLeadCard) : <div className="empty">No replies yet.</div>}
      </>
    );
  };

  const renderPartnerConn = () => {
    const list = leads.filter((l) => l.state === 'connected');
    return (
      <>
        <span className="lbl" style={{ margin: '2px' }}>
          Connected clients ({list.length})
        </span>
        {list.map((l) => (
          <div key={l.key} className="card">
            <div className="row">
              <span className="sq">✓</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <b style={{ fontSize: '15px' }}>Pavan · Test Traders</b>
                <br />
                <span className="mute" style={{ fontSize: '12.5px' }}>
                  {l.title} · {l.budget}
                </span>
              </span>
              <span className="chip c-g">{l.when}</span>
            </div>
            <div className="row">
              <a
                href={WHATSAPP_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn ink sm"
                style={{ textDecoration: 'none' }}
              >
                Message on WhatsApp
              </a>
              <a href={"tel:" + SUPPORT_PHONE} className="btn sm" style={{ textDecoration: 'none' }}>
                Call
              </a>
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderPartnerCats = () => (
    <>
      <div className="card">
        <div className="row">
          <span className="lbl">Categories you receive leads for (5)</span>
          <span className="sp" />
          <button className="btn sm" onClick={() => showToast('Edit categories — choose which sectors send you leads.')}>
            Edit
          </button>
        </div>
        <div className="row">
          <span className="chip c-g">Web &amp; Mobile Development</span>
          <span className="chip">+ 4 more categories</span>
        </div>
        <span className="mute3" style={{ fontSize: '12.5px' }}>
          Leads are matched to you only in these categories.
        </span>
      </div>
      <div className="card flat">
        <span className="lbl">Need a hand?</span>
        <span className="mute" style={{ fontSize: '13.5px' }}>
          Support: {SUPPORT_PHONE} · Instant WhatsApp Bot available 24/7
        </span>
      </div>
    </>
  );

  const renderPartnerPlan = () => (
    <>
      <div className="kpis">
        <div className="kpi">
          <b>{partnerReplies}</b>
          <span>Free replies left</span>
        </div>
        <div className="kpi">
          <b>{leads.filter((l) => l.state === 'new').length}</b>
          <span>New matched</span>
        </div>
        <div className="kpi">
          <b>{leads.filter((l) => l.state === 'connected').length}</b>
          <span>Connected</span>
        </div>
      </div>
      <div className="card">
        <span className="lbl">How replies work</span>
        <span className="mute" style={{ fontSize: '13.5px' }}>
          You get matched leads in your categories for free, with zero commission on deals. Each reply you send uses one free reply. You have {partnerReplies} free replies left.
        </span>
        <button className="btn red" style={{ alignSelf: 'flex-start' }} onClick={() => showToast('Upgrade flow — adds more lead replies to your account.')}>
          Get more replies
        </button>
      </div>
      <div className="card flat">
        <span className="lbl">Need a hand?</span>
        <span className="mute" style={{ fontSize: '13.5px' }}>
          Support: {SUPPORT_PHONE} · Instant WhatsApp Bot available 24/7
        </span>
      </div>
    </>
  );

  // Active current navigation items
  const clientNav = [
    { k: 'home', l: 'Home', i: 'home' as const },
    { k: 'reqs', l: 'My requests', i: 'list' as const, n: creqs.length },
    { k: 'conn', l: 'Connected', i: 'link' as const, n: 1 },
  ];

  const partnerNav = [
    { k: 'reqs', l: 'Requests', i: 'inbox' as const, n: leads.filter((l) => l.state === 'new').length },
    { k: 'replies', l: 'Replies', i: 'chat' as const, n: leads.filter((l) => l.state === 'sent' || l.state === 'connected').length },
    { k: 'conn', l: 'Connected', i: 'link' as const, n: leads.filter((l) => l.state === 'connected').length },
    { k: 'cats', l: 'Categories', i: 'tag' as const },
  ];

  const who = role === 'client' ? { name: 'Pavan', biz: 'Test Traders', ini: 'PA' } : { name: 'Klo Tech', biz: 'Web & Mobile Development', ini: 'KT' };
  const navItems = role === 'client' ? clientNav : partnerNav;
  const currentScreen = role === 'client' ? cs : ps;

  const getPageTitle = () => {
    if (role === 'client') {
      if (cs === 'home') return 'Home';
      if (cs === 'reqs') return 'My requests';
      if (cs === 'req') return 'Request';
      if (cs === 'conn') return 'Connected';
      return 'Plan & billing';
    } else {
      if (ps === 'reqs') return 'Requests matched to Klo Tech';
      if (ps === 'lead') return 'Request';
      if (ps === 'replies') return 'My replies';
      if (ps === 'conn') return 'Connected';
      if (ps === 'cats') return 'My categories';
      return 'Plan & billing';
    }
  };

  return (
    <div className={"xpo-unified-workspace-container" + (theme === 'dark' ? ' dark' : '')} data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: `
:root{
  --red:#C8102E;--red2:#A50D26;--ink:#15171C;--bg:#F6F6F4;--sf:#FFFFFF;--sf2:#F1F1EE;--sf3:#E9E9E5;--tx:#15171C;--tx2:#565B63;--tx3:#8A8F98;
  --ln:#E7E7E2;--ln2:#D6D6D0;--g:#1D7A45;--gbg:#E7F3EC;--gtx:#14532D;--b:#1F5FBF;--bbg:#EAF0FB;--btx:#1E3A8A;--a:#8A5A00;--abg:#FBF1DC;--atx:#7A4A00;--rbg:#FDECEE;--rtx:#8E0B20;
  --f:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
  --shadow:0 1px 2px rgba(20,23,28,.04),0 6px 20px -12px rgba(20,23,28,.14);--shadow2:0 18px 44px -14px rgba(20,23,28,.4);color-scheme:light}
[data-theme=dark]{--ink:#F1F2F4;--bg:#0D0F12;--sf:#16181D;--sf2:#1E2127;--sf3:#262a31;--tx:#F1F2F4;--tx2:#B4B8C0;--tx3:#848992;--ln:#262a31;--ln2:#363b43;--gbg:#15331F;--gtx:#8FD9A8;--bbg:#172442;--btx:#A9C2F5;--abg:#3A2C0C;--atx:#F3C77A;--rbg:#3D141B;--rtx:#F6A3AF;--shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -14px rgba(0,0,0,.7);--shadow2:0 22px 50px -16px rgba(0,0,0,.75);color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--tx);font-family:var(--f);font-size:14.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
button{font:inherit;cursor:pointer;color:inherit}
h1,h2,h3,h4{margin:0;letter-spacing:-.02em}
:focus-visible{outline:3px solid var(--b);outline-offset:2px;border-radius:7px}
.mono{font-family:var(--mono);font-size:11.5px}
.mute{color:var(--tx2)}.mute3{color:var(--tx3)}
.sp{flex:1}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border-radius:12px;font-weight:700;font-size:14px;border:1.5px solid var(--ln2);background:var(--sf);color:var(--tx);white-space:nowrap;transition:.12s}
.btn:hover{background:var(--sf2)}
.btn.red{background:var(--red);border-color:var(--red);color:#fff}.btn.red:hover{background:var(--red2)}
.btn.ink{background:var(--ink);border-color:var(--ink);color:#fff}
[data-theme=dark] .btn.ink{background:#EDEEF0;border-color:#EDEEF0;color:#15171C}
.btn.sm{min-height:34px;padding:0 12px;font-size:13px;border-radius:10px}
.btn.ghost{border-color:transparent;background:transparent}
.btn.full{width:100%}
.chip{display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;background:var(--sf2);color:var(--tx2)}
.c-g{background:var(--gbg);color:var(--gtx)}.c-b{background:var(--bbg);color:var(--btx)}.c-a{background:var(--abg);color:var(--atx)}.c-r{background:var(--rbg);color:var(--rtx)}
.card{background:var(--sf);border:1px solid var(--ln);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow)}
.card.flat{box-shadow:none}
.lbl{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--tx3)}
.inp{width:100%;min-height:46px;border-radius:12px;border:1.5px solid var(--ln2);background:var(--sf);padding:10px 14px;font-size:15px;color:var(--tx);font-family:inherit}
textarea.inp{resize:vertical;min-height:92px;line-height:1.5}
.inp:focus{outline:none;border-color:var(--ink)}
.av{width:34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex:0 0 34px}
[data-theme=dark] .av{background:#EDEEF0;color:#15171C}

/* ===== sim chrome ===== */
.bar{position:sticky;top:0;z-index:50;background:#0F1115;color:#E6E7EA;display:flex;align-items:center;gap:12px;padding:9px 16px;border-bottom:1px solid #22252C;flex-wrap:wrap}
.bar .brand{display:flex;align-items:center;gap:9px;font-weight:800}
.bar .brand img{height:20px}
.bar .brand span{font-size:11px;font-weight:700;background:#2A2E35;padding:2px 8px;border-radius:999px}
.seg{display:flex;background:#1A1D23;border:1px solid #2E323A;border-radius:11px;padding:3px}
.seg button{border:0;background:none;color:#B9BDC6;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;min-height:36px;display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;gap:1px}
.seg button small{font-weight:600;font-size:10.5px;color:#7C818B}
.seg button[aria-pressed=true]{background:#E6E7EA;color:#0F1115}
.seg button[aria-pressed=true] small{color:var(--red)}
.sbtn{border:1px solid #2E323A;background:#1A1D23;color:#E6E7EA;border-radius:10px;min-height:36px;padding:0 13px;font-weight:700;font-size:12.5px;display:flex;align-items:center;gap:8px}
.sbtn:hover{background:#252931}
.sbtn.hot{background:#E6E7EA;color:#0F1115;border-color:#E6E7EA}
.sbtn .dot{width:8px;height:8px;border-radius:50%;background:#FF6b7d}
.sbtn.hot .dot{background:#39d98a}

/* ===== app shell ===== */
.app{display:grid;grid-template-columns:248px 1fr;min-height:calc(100vh - 56px)}
.side{background:var(--sf);border-right:1px solid var(--ln);display:flex;flex-direction:column;padding:16px 14px;gap:4px;position:sticky;top:56px;height:calc(100vh - 56px)}
.side .lg{height:44px;display:flex;align-items:center;padding:0 8px;margin-bottom:10px}
.side .lg img{height:24px}
.side .lg .rolechip{margin-left:10px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--red);background:var(--rbg);padding:3px 8px;border-radius:7px}
.nv{display:flex;align-items:center;gap:12px;border:0;background:none;border-radius:11px;padding:0 13px;min-height:44px;font-weight:600;font-size:14.5px;color:var(--tx2);text-align:left;width:100%}
.nv:hover{background:var(--sf2);color:var(--tx)}
.nv[aria-current=page]{background:var(--ink);color:#fff}
[data-theme=dark] .nv[aria-current=page]{background:#EDEEF0;color:#15171C}
.nv svg{width:19px;height:19px;flex:0 0 19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.nv .n{margin-left:auto;background:var(--red);color:#fff;border-radius:999px;font-size:11px;font-weight:800;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.nv[aria-current=page] .n{background:#fff;color:var(--red)}
.side .foot{margin-top:auto;border-top:1px solid var(--ln);padding-top:12px;display:flex;align-items:center;gap:10px}
.side .foot .av{flex:0 0 34px}
.side .foot b{display:block;font-size:13.5px}.side .foot span{font-size:11.5px;color:var(--tx3)}

.main{min-width:0;display:flex;flex-direction:column;position:relative}
.top{height:66px;border-bottom:1px solid var(--ln);background:var(--sf);display:flex;align-items:center;gap:12px;padding:0 24px;position:sticky;top:56px;z-index:40}
.top h1{font-size:19px;font-weight:800}
.page{padding:26px 28px 90px;max-width:880px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.mtab{display:none}
.hbtn{width:42px;height:42px;border-radius:12px;border:1.5px solid var(--ln2);background:var(--sf);display:inline-flex;align-items:center;justify-content:center;position:relative}
.hbtn:hover{background:var(--sf2)}
.hbtn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.hn{position:absolute;top:-5px;right:-5px;background:var(--red);color:#fff;border-radius:999px;font-size:10.5px;font-weight:800;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 0 0 2px var(--sf)}
.avbtn{border:0;padding:0;background:none}
.backdrop{position:fixed;inset:0;z-index:35;border:0;background:transparent}
.pop{position:absolute;top:72px;right:24px;z-index:45;width:320px;max-width:calc(100vw - 32px);background:var(--sf);border:1px solid var(--ln);border-radius:16px;box-shadow:var(--shadow2);padding:10px;display:flex;flex-direction:column;gap:4px;animation:pop .12s ease-out}
@keyframes pop{from{opacity:0;transform:translateY(-6px)}}
.pop .ph{display:flex;align-items:center;gap:11px;padding:8px 10px 10px;border-bottom:1px solid var(--ln);margin-bottom:4px}
.pop .ph b{display:block;font-size:14.5px}.pop .ph span{font-size:12px;color:var(--tx3)}
.al{display:flex;flex-direction:column;gap:3px;text-align:left;border:0;background:none;border-radius:11px;padding:10px;width:100%;cursor:pointer}
.al:hover{background:var(--sf2)}
.al .t{font-size:11px;color:var(--tx3);font-weight:700}
.al span{font-size:13.5px;color:var(--tx);line-height:1.4}
.mrow{display:flex;align-items:center;gap:10px;border:0;background:none;border-radius:11px;padding:11px 10px;width:100%;text-align:left;font-size:14px;font-weight:600;color:var(--tx);cursor:pointer}
.mrow:hover{background:var(--sf2)}
.mrow svg{width:18px;height:18px;flex:0 0 18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.7}
.mrow .sp{margin-left:auto}
.planbox{margin:2px 4px 6px;padding:12px;border-radius:12px;background:var(--sf2);display:flex;flex-direction:column;gap:8px}
.planbox .row2{display:flex;align-items:center;gap:8px}
.sw{position:relative;width:42px;height:25px;border-radius:999px;background:var(--ln2);border:0;flex:0 0 42px;padding:0;margin-left:auto}
.sw::after{content:'';position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:50%;background:#fff;transition:left .15s}
.sw[aria-checked=true]{background:var(--g)}.sw[aria-checked=true]::after{left:20px}

.req{display:flex;flex-direction:column;gap:10px;cursor:pointer;text-align:left;font:inherit}
.req .head{display:flex;align-items:center;gap:10px}
.req h3{font-size:16px;font-weight:700}
.req .meta{display:flex;gap:8px;flex-wrap:wrap}
.req .foot{display:flex;align-items:center;gap:10px;border-top:1px solid var(--ln);padding-top:10px;margin-top:2px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kpi{background:var(--sf);border:1px solid var(--ln);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow)}
.kpi b{display:block;font-size:24px;letter-spacing:-.02em}.kpi span{font-size:12.5px;color:var(--tx2)}
.tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--ln);padding-bottom:2px}
.tb{border:0;background:none;min-height:40px;padding:0 12px;border-bottom:2.5px solid transparent;font-weight:700;font-size:13.5px;color:var(--tx2)}
.tb[aria-selected=true]{color:var(--tx);border-bottom-color:var(--red)}
.attn{border-color:color-mix(in srgb,var(--red) 35%,transparent);background:linear-gradient(0deg,var(--sf),var(--sf));box-shadow:0 0 0 3px color-mix(in srgb,var(--red) 10%,transparent),var(--shadow)}
.rep{display:flex;flex-direction:column;gap:10px;border:1px solid var(--ln);border-radius:14px;padding:14px}
.sq{width:40px;height:40px;border-radius:11px;background:var(--sf2);display:inline-flex;align-items:center;justify-content:center;font-weight:800;flex:0 0 40px}
.empty{border:1.5px dashed var(--ln2);border-radius:16px;padding:30px;text-align:center;color:var(--tx2);display:flex;flex-direction:column;gap:6px;align-items:center}
.ex{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;border-radius:999px;border:1.5px solid var(--ln2);background:var(--sf);font-weight:600;font-size:12.5px;color:var(--tx)}
.ex:hover{border-color:var(--ink)}
.toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 16px;border-radius:12px;font-weight:600;z-index:80;box-shadow:var(--shadow2);font-size:13.5px}
[data-theme=dark] .toast{background:#EDEEF0;color:#15171C}

/* review mode */
.revbtn{position:fixed;right:18px;bottom:18px;z-index:70;background:var(--ink);color:#fff;border:0;border-radius:999px;min-height:48px;padding:0 18px;font-weight:700;font-size:13.5px;box-shadow:var(--shadow2);display:flex;align-items:center;gap:8px}
[data-theme=dark] .revbtn{background:#fff;color:#15171C}
.revbtn .dot{width:9px;height:9px;border-radius:50%;background:#FF6b7d}
body.rev .revbtn .dot{background:#39d98a}
.anno{display:none}
body.rev .anno{display:flex;position:absolute;top:8px;right:8px;z-index:20;flex-direction:column;max-width:262px;pointer-events:none}
body.rev .anno.left{right:auto;left:8px;align-items:flex-start}
body.rev .anno.left .pin{align-self:flex-start}
body.rev [data-anno]{position:relative;outline:2px dashed color-mix(in srgb,var(--red) 55%,transparent);outline-offset:5px;border-radius:14px}
.anno .pin{align-self:flex-end;background:var(--red);color:#fff;font-size:11.5px;font-weight:800;border-radius:8px;padding:4px 9px}
.anno .tip{margin-top:6px;background:var(--ink);color:#fff;border-radius:11px;padding:10px 12px;font-size:12.3px;line-height:1.45;box-shadow:var(--shadow2)}
[data-theme=dark] .anno .tip{background:#2A2E35}
.anno .tip b{color:#FF9AA8}

@media (max-width:820px){
  .app{grid-template-columns:1fr}
  .bar{padding:7px 10px;gap:7px;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;position:sticky;top:0;z-index:50}
  .bar::-webkit-scrollbar{display:none}
  .bar .brand span{display:none}
  .seg button{padding:4px 8px;min-height:30px;font-size:11.5px}
  .seg button small{display:none}
  .sbtn{min-height:30px;padding:0 9px;font-size:11px;white-space:nowrap;flex-shrink:0}
  .side{display:none !important}
  .top{top:46px;height:52px;padding:0 14px}
  .top h1{font-size:16.5px}
  .page{padding:14px 14px calc(80px + env(safe-area-inset-bottom, 16px));gap:12px}
  .card{padding:14px;border-radius:14px;gap:10px}
  .req .head{flex-wrap:wrap;gap:6px}
  .req .meta{gap:6px}
  .chip{min-height:22px;padding:0 8px;font-size:11px}
  .mtab{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--sf);border-top:1px solid var(--ln);justify-content:space-around;padding:5px 4px calc(6px + env(safe-area-inset-bottom, 0px))}
  .mtab button{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:700;color:var(--tx3);min-width:55px;min-height:46px;justify-content:center;position:relative}
  .mtab button svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .mtab button[aria-current=page]{color:var(--red)}
  .mtab .n{position:absolute;top:2px;right:8px;background:var(--red);color:#fff;border-radius:999px;font-size:9.5px;min-width:15px;height:15px;display:flex;align-items:center;justify-content:center;padding:0 3px}
  .kpis{grid-template-columns:1fr 1fr 1fr;gap:8px}
  .kpi{padding:10px 12px}
  .kpi b{font-size:18px}
  .kpi span{font-size:11px}
  .revbtn{bottom:70px;right:12px;min-height:40px;padding:0 14px;font-size:12px}
  body.rev .anno{position:static;max-width:none;margin:-4px 0 10px}
}` }} />

      {/* Top Chrome Bar */}
      <header className="bar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/xpo-logo.png" alt="XPO India" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          <span>Redesign</span>
        </div>

        <div className="seg" role="group" aria-label="View as">
          <button
            aria-pressed={role === 'client'}
            onClick={() => handleRoleSwitch('client')}
          >
            Client
            <small>Pavan · Test Traders</small>
          </button>
          <button
            aria-pressed={role === 'partner'}
            onClick={() => handleRoleSwitch('partner')}
          >
            Partner
            <small>Klo Tech</small>
          </button>
        </div>

        <a
          href={WHATSAPP_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sbtn"
          style={{ textDecoration: 'none', background: '#25D366', color: '#0F1115', borderColor: '#25D366' }}
          title="Direct Dummy XPO WhatsApp Chatbot"
        >
          💬 XPO WhatsApp Bot
        </a>

        <span className="sp" />

        <button
          className={"sbtn " + (rev ? 'hot' : '')}
          aria-pressed={rev}
          onClick={() => setRev(!rev)}
        >
          <span className="dot" />
          {rev ? 'Hide changes' : 'Show what changed'}
        </button>

        <button
          className="sbtn"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      {/* Main App Layout */}
      <div className="app">
        {/* Sidebar */}
        <aside className="side">
          <div className="lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/xpo-logo.png" alt="XPO India" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
            <span className="rolechip">{role}</span>
          </div>

          {navItems.map((item) => {
            const isCurrent =
              currentScreen === item.k ||
              (item.k === 'reqs' && (currentScreen === 'req' || currentScreen === 'lead'));
            return (
              <button
                key={item.k}
                className="nv"
                aria-current={isCurrent ? 'page' : 'false'}
                onClick={() => {
                  setMenu('none');
                  if (role === 'client') setCs(item.k);
                  else setPs(item.k);
                }}
              >
                {icons[item.i]}
                <span>{item.l}</span>
                {item.n ? <span className="n">{item.n}</span> : null}
              </button>
            );
          })}

          <div className="foot" data-anno="side">
            <div className="anno">
              <span className="pin">One clean nav</span>
              <span className="tip">
                <b>Removed from the live app:</b> the duplicate top + bottom nav bars, the stray &quot;PA&quot; or &quot;2 KT&quot; tags, and clutter. One unified sidebar.
              </span>
            </div>
            <span className="av">{who.ini}</span>
            <span style={{ minWidth: 0 }}>
              <b>{who.name}</b>
              <span>{who.biz}</span>
            </span>
          </div>
        </aside>

        {/* Content Area */}
        <div className="main">
          <div className="top">
            <h1>{getPageTitle()}</h1>
            <span className="sp" />

            <div data-anno="hdr">
              <div className="anno left">
                <span className="pin">Alerts on header, Plan in profile</span>
                <span className="tip">
                  <b>Relocated:</b> the alerts bell and your plan details sit right in the header and profile menu.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  href={role === 'partner' ? '/simulator/partner' : '/simulator/client'}
                  className="btn ghost sm"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    padding: '4px 9px',
                    background: 'var(--sf2)',
                    border: '1px solid var(--ln)',
                    borderRadius: '6px',
                    color: 'var(--tx)',
                    fontWeight: 600,
                  }}
                  title={role === 'partner' ? 'Open Partner WhatsApp Bot Simulator & State Programmer' : 'Open Client WhatsApp Bot Simulator & State Programmer'}
                >
                  🤖 {role === 'partner' ? 'Partner Bot Sim' : 'Client Bot Sim'}
                </Link>

                {role === 'client' && (
                  <button className="btn red sm" onClick={() => setCs('home')}>
                    + New requirement
                  </button>
                )}

                <button
                  className="hbtn"
                  aria-label="Alerts"
                  onClick={() => setMenu(menu === 'alerts' ? 'none' : 'alerts')}
                >
                  {icons.bell}
                  <span className="hn">2</span>
                </button>

                <button
                  className="avbtn"
                  aria-label="Profile and plan"
                  onClick={() => setMenu(menu === 'profile' ? 'none' : 'profile')}
                >
                  <span className="av" title={who.name}>
                    {who.ini}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Menus & Dropdowns */}
          {menu !== 'none' && (
            <button className="backdrop" aria-label="Close" onClick={() => setMenu('none')} />
          )}

          {menu === 'alerts' && (
            <div className="pop" role="menu" aria-label="Alerts">
              <div className="ph">
                <b>Alerts</b>
                <span className="sp" />
                <span className="chip">{ALERTS[role].length}</span>
              </div>
              {ALERTS[role].map((a, i) => (
                <button key={i} className="al" onClick={a.action}>
                  <span className="t">{a.t}</span>
                  <span>{a.d}</span>
                </button>
              ))}
            </div>
          )}

          {menu === 'profile' && (
            <div className="pop" role="menu" aria-label="Profile">
              <div className="ph">
                <span className="av">{who.ini}</span>
                <span style={{ minWidth: 0 }}>
                  <b>{who.name}</b>
                  <span>{who.biz}</span>
                </span>
              </div>
              <div className="planbox">
                <span className="lbl">Plan &amp; billing</span>
                <b style={{ fontSize: '14px' }}>
                  {role === 'client' ? clientViews + ' free views left' : partnerReplies + ' free replies left'}
                </b>
                <button
                  className="btn sm"
                  onClick={() => {
                    setMenu('none');
                    if (role === 'client') setCs('plan');
                    else setPs('plan');
                  }}
                >
                  Manage plan
                </button>
              </div>
              <Link
                href="/simulator/partner"
                className="mrow"
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={() => setMenu('none')}
              >
                🤖 Partner Bot Simulator &amp; State Lab
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--tx3)' }}>
                  Supplier
                </span>
              </Link>
              <Link
                href="/simulator/client"
                className="mrow"
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={() => setMenu('none')}
              >
                🤖 Client Bot Simulator &amp; State Lab
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--tx3)' }}>
                  Buyer
                </span>
              </Link>
              <button
                className="mrow"
                onClick={() => showToast('Need a hand? Call support at ' + SUPPORT_PHONE)}
              >
                Need a hand?
                <span className="sp mono" style={{ marginLeft: 'auto', color: 'var(--tx3)' }}>
                  {SUPPORT_PHONE}
                </span>
              </button>
              <button
                className="mrow"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                Dark mode
                <span className="sw sp" role="switch" aria-checked={theme === 'dark'} />
              </button>
              <button className="mrow" onClick={() => showToast('Test session reset.')}>
                Sign out
              </button>
            </div>
          )}

          {/* Page Body */}
          <div className="page">
            {role === 'client' ? (
              cs === 'home' ? (
                renderClientHome()
              ) : cs === 'reqs' ? (
                <>
                  <span className="lbl" style={{ margin: '2px' }}>
                    My requests ({creqs.length})
                  </span>
                  {creqs.map((r) => renderClientReqCard(r, r.status === 'interested'))}
                </>
              ) : cs === 'req' ? (
                renderClientReqDetail()
              ) : cs === 'conn' ? (
                renderClientConn()
              ) : (
                renderClientPlan()
              )
            ) : ps === 'reqs' ? (
              renderPartnerLeads()
            ) : ps === 'lead' ? (
              renderPartnerLeadDetail()
            ) : ps === 'replies' ? (
              renderPartnerReplies()
            ) : ps === 'conn' ? (
              renderPartnerConn()
            ) : ps === 'cats' ? (
              renderPartnerCats()
            ) : (
              renderPartnerPlan()
            )}
          </div>

          {/* Mobile Bottom Tab Bar */}
          <nav className="mtab" aria-label="Tabs">
            {navItems.map((item) => {
              const isCurrent =
                currentScreen === item.k ||
                (item.k === 'reqs' && (currentScreen === 'req' || currentScreen === 'lead'));
              return (
                <button
                  key={item.k}
                  aria-current={isCurrent ? 'page' : 'false'}
                  onClick={() => {
                    if (role === 'client') setCs(item.k);
                    else setPs(item.k);
                  }}
                >
                  {icons[item.i]}
                  {item.l}
                  {item.n ? <span className="n">{item.n}</span> : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
