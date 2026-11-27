'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Real content & test identities matching the reference prototype
interface PartnerReplyLite {
  id?: string;
  name?: string;
  sub?: string;
  pitch?: string;
  tags?: string[];
  st?: string;
  phone?: string;
  verified?: boolean;
}

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
  partners?: PartnerReplyLite[];
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
  clientName?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  needsConsent?: boolean;
}

// Map a live ClientReqItem (from /api/marketplace/state) to the local card model.
function mapLiveReq(key: string, r: any): ClientReq | null {
  if (!r) return null;
  const status: ClientReq['status'] =
    r.status === 'interested' ? 'interested' : r.status === 'finding' ? 'finding' : 'checking';
  const partners: PartnerReplyLite[] = Array.isArray(r.partners)
    ? r.partners.map((p: any) => ({
        id: p.id,
        name: p.real || p.name || p.partnerName || 'Verified partner',
        sub: p.masked || [p.cat, p.city].filter(Boolean).join(' · '),
        pitch: p.pitch,
        tags: Array.isArray(p.tags) ? p.tags : [],
        st: p.st || p.status,
        phone: p.phone,
        verified: !!p.verified,
      }))
    : [];
  return {
    id: r.code || key,
    key,
    cat: r.cat || r.sector || 'General',
    status,
    title: r.title || (r.spec ? String(r.spec).slice(0, 60) : 'Untitled requirement'),
    summary: r.spec || '',
    city: r.loc || '—',
    when: r.timeline || '—',
    budget: r.budget || 'Quotes invited',
    time: r.posted || '',
    n: partners.length,
    partners,
  };
}

// Map a live PartnerOpportunity to the local lead model.
function mapLiveOpp(o: any): LeadItem {
  const state: LeadItem['state'] =
    o.myReplyStatus === 'connected'
      ? 'connected'
      : o.myReplyStatus === 'sent_waiting' || o.myReplyStatus === 'client_requested'
        ? 'sent'
        : 'new';
  const tags: string[] = ['matched'];
  if (o.isOverseas) tags.push('overseas');
  const statusText =
    o.myReplyStatus === 'connected'
      ? 'Connected with ' + (o.clientName || 'client')
      : o.myReplyStatus === 'client_requested'
        ? 'Client requested your contact'
        : o.myReplyStatus === 'sent_waiting'
          ? 'Reply sent · waiting on client'
          : undefined;
  return {
    id: o.ref || o.id,
    key: o.id,
    cat: o.cat || 'General',
    badge: o.waveBadge || (o.matched ? 'MATCHED TO YOU' : 'NEW'),
    state,
    statusText,
    title: o.title || 'Opportunity',
    desc: o.brief || '',
    city: o.loc || '—',
    when: o.when || '—',
    budget: o.budget || '—',
    time: o.posted || '',
    tags,
    myReply: o.myPitch
      ? {
          quote: o.myQuote || '',
          timeline: o.myTimeline || '',
          pitch: o.myPitch,
          repliedAt: o.repliedAt || '',
        }
      : undefined,
    clientName: o.clientName,
    clientCompany: o.clientCompany,
    clientPhone: o.clientPhone,
    clientEmail: o.clientEmail,
    needsConsent: o.myReplyStatus === 'client_requested',
  };
}

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

  // Live balances (hydrated from shared marketplace state)
  const [clientViews, setClientViews] = useState<number>(0);
  const [partnerReplies, setPartnerReplies] = useState<number>(0);

  // Live data (hydrated from /api/marketplace/state)
  const [creqs, setCreqs] = useState<ClientReq[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);

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
  }, [theme]);

  // Shared marketplace state (synced with Superadmin + WhatsApp simulator).
  // Hydrated on mount and re-fetched after every mutating action so the web
  // portal reflects the same live state as the other portals. The render is
  // being migrated onto this; for now it backs id resolution and future wiring.
  const liveStateRef = useRef<Record<string, any> | null>(null);
  const rehydrateMarketplace = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/state', { cache: 'no-store' });
      const json = await res.json();
      if (json?.success && json?.data) {
        const data = json.data as Record<string, any>;
        liveStateRef.current = data;

        // Client requirements (ordered) -> cards
        const cl = data.client || {};
        const order: string[] = Array.isArray(cl.order) ? cl.order : [];
        const reqsRec: Record<string, any> = cl.reqs || {};
        const keys = order.length ? order : Object.keys(reqsRec);
        const mappedReqs = keys
          .map((k) => mapLiveReq(k, reqsRec[k]))
          .filter((r): r is ClientReq => r !== null);
        setCreqs(mappedReqs);
        setCReqKey((prev) =>
          mappedReqs.some((r) => r.key === prev) ? prev : mappedReqs[0]?.key || prev,
        );

        // Partner opportunities -> leads
        const opps: any[] = (data.partner && data.partner.opportunities) || [];
        const mappedLeads = opps.map(mapLiveOpp);
        setLeads(mappedLeads);
        setPLeadKey((prev) =>
          mappedLeads.some((l) => l.key === prev) ? prev : mappedLeads[0]?.key || prev,
        );

        // Balances
        if (typeof cl.free === 'number') {
          setClientViews(cl.free + (cl.planOn && typeof cl.plan === 'number' ? cl.plan : 0));
        }
        if (data.partner && typeof data.partner.credits === 'number') {
          setPartnerReplies(data.partner.credits);
        }
      }
    } catch {
      // Non-fatal: the portal shows its empty state if sync is unreachable.
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    void rehydrateMarketplace();
  }, [rehydrateMarketplace]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? '' : cur));
    }, 2800);
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

  // Alerts are derived from the live marketplace state.
  type AlertItem = { t: string; d: string; action: () => void };
  const clientAlerts: AlertItem[] = creqs
    .filter((r) => (r.n || 0) > 0)
    .slice(0, 6)
    .map((r) => ({
      t: r.n + ' verified partner' + (r.n === 1 ? '' : 's') + ' replied',
      d: r.title,
      action: () => {
        setCReqKey(r.key);
        setCs('req');
        setMenu('none');
      },
    }));
  const partnerAlerts: AlertItem[] = [
    ...leads
      .filter((l) => l.needsConsent)
      .map((l) => ({
        t: 'Action needed · Contact requested',
        d: (l.clientName || 'A client') + ' wants to connect on: ' + l.title,
        action: () => {
          setPLeadKey(l.key);
          setPs('lead');
          setMenu('none');
        },
      })),
    ...leads
      .filter((l) => l.state === 'new' && !l.needsConsent)
      .slice(0, 6)
      .map((l) => ({
        t: 'New lead matched',
        d: l.title + ' (' + l.city + ')',
        action: () => {
          setPLeadKey(l.key);
          setPs('lead');
          setMenu('none');
        },
      })),
  ];
  const ALERTS: Record<'client' | 'partner', AlertItem[]> = {
    client: clientAlerts,
    partner: partnerAlerts,
  };

  // Helper chips and badges
  const renderStatusPill = (status: ClientReq['status'], n = 0) => {
    if (status === 'interested')
      return <span className="chip c-g">{n > 0 ? n + ' interested' : 'Interested'}</span>;
    if (status === 'finding') return <span className="chip c-b">Finding partners…</span>;
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
    const act =
      r.n && r.n > 0 ? 'Review ' + r.n + ' repl' + (r.n === 1 ? 'y' : 'ies') : 'Open details';
    return (
      <button
        key={r.key}
        className={"card req" + (attn ? ' attn' : '')}
        onClick={() => {
          setCReqKey(r.key);
          setCs('req');
        }}
      >
        <div className="head">
          <span className="mono mute3">{r.id}</span>
          <span className="chip">{r.cat}</span>
          <span className="sp" />
          {renderStatusPill(r.status, r.n)}
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
        <div className="card">
          <h2 style={{ fontSize: '20px' }}>What do you need?</h2>
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
                const rawMessage = composeText;
                const code = 'XPO-REQ-' + Math.floor(40000 + Math.random() * 5000);
                const reqKey = 'r' + Date.now();
                const newReq: ClientReq = {
                  id: code,
                  key: reqKey,
                  cat: 'General Trade',
                  status: 'finding',
                  title: rawMessage.split('\n')[0].slice(0, 60),
                  summary: rawMessage,
                  city: 'Hyderabad',
                  when: 'Within 2-4 Weeks',
                  budget: 'Quotes invited',
                  time: 'Just now',
                };
                setCreqs([newReq, ...creqs]);
                setComposeText('');
                showToast('Requirement posted — matching verified partners in 5-minute waves.');
                // Persist to the shared marketplace state so the requirement is
                // visible to Superadmin and surfaces in the Partner Wave-1 feed.
                // The server parses category/city/budget/timeline from rawMessage.
                await postMarketplaceAction('client.post_requirement', {
                  key: reqKey,
                  rawMessage,
                  requirement: {
                    code,
                    title: newReq.title,
                    sector: '',
                    cat: newReq.cat,
                    sub: '',
                    loc: newReq.city,
                    timeline: newReq.when,
                    budget: newReq.budget,
                    spec: rawMessage,
                    posted: 'just now',
                    status: 'finding',
                    wave: 1,
                    partners: [],
                  },
                });
                await rehydrateMarketplace();
              }}
            >
              Continue
            </button>
            <span className="mute3" style={{ fontSize: '12.5px' }}>
              Goes out in 5-minute waves to verified partners · zero commission
            </span>
          </div>
        </div>

        {!hydrated && creqs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--mute, #8A8F98)' }}>
            Loading your requirements…
          </div>
        )}

        {hydrated && creqs.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>No requirements yet</h3>
            <span className="mute" style={{ fontSize: '13px' }}>
              Describe what you need above and XPO will match it to verified partners in 5-minute waves.
            </span>
          </div>
        )}

        {creqs.length > 0 && attnReq && (
          <div>
            <span className="lbl" style={{ margin: '4px 2px' }}>
              Needs you
            </span>
            {renderClientReqCard(attnReq, true)}
          </div>
        )}

        {creqs.length > 1 && (
          <>
            <span className="lbl" style={{ margin: '8px 2px 0' }}>
              Recent requests
            </span>
            {creqs.slice(1).map((r) => renderClientReqCard(r, false))}
          </>
        )}
      </>
    );
  };

  const renderClientReqDetail = () => {
    const r = creqs.find((x) => x.key === cReqKey) || creqs[0];
    if (!r) {
      return (
        <>
          <button
            className="btn ghost sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setCs('reqs')}
          >
            ← My requests
          </button>
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="mute">This requirement is no longer available.</span>
          </div>
        </>
      );
    }
    const partners = r.partners || [];
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
            {renderStatusPill(r.status, r.n)}
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

        <div className="card">
          <span className="lbl">
            {partners.length > 0
              ? partners.length + ' verified partner' + (partners.length === 1 ? '' : 's') + ' replied'
              : 'Replies'}
          </span>

          {partners.length === 0 && (
            <div
              className="row"
              style={{ background: 'var(--sf2)', padding: '12px 14px', borderRadius: '10px' }}
            >
              <span className="mute" style={{ fontSize: '13px' }}>
                No replies yet — XPO is matching verified partners in 5-minute waves. You&apos;ll be
                alerted here as quotes arrive.
              </span>
            </div>
          )}

          {partners.map((p, i) => {
            const pid = p.id || 'p' + (i + 1);
            const ini = (p.name || 'P')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const requested = p.st === 'waiting' || p.st === 'unlocked' || p.st === 'connected';
            return (
              <div className="rep" key={pid}>
                <div className="row">
                  <span className="av">{ini}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ fontSize: '15px' }}>{p.name}</b>
                    {p.verified && (
                      <span className="chip c-g" style={{ marginLeft: 6 }}>
                        Verified
                      </span>
                    )}
                    <br />
                    <span className="mute" style={{ fontSize: '12.5px' }}>
                      {p.sub}
                    </span>
                  </span>
                  {requested ? (
                    <span className="chip c-a">{p.st === 'connected' ? 'Connected' : 'Request sent'}</span>
                  ) : (
                    <button
                      className="btn red sm"
                      onClick={async () => {
                        setClientViews((v) => Math.max(0, v - 1));
                        showToast(
                          'Request sent. The direct phone & WhatsApp is shared once they accept.',
                        );
                        await postMarketplaceAction('client.update_partner_status', {
                          key: r.key,
                          partnerId: pid,
                          status: 'requested',
                        });
                        await rehydrateMarketplace();
                      }}
                    >
                      Connect · 1 view
                    </button>
                  )}
                </div>
                {p.pitch && <span style={{ fontSize: '13.5px' }}>{p.pitch}</span>}
                {p.tags && p.tags.length > 0 && (
                  <div className="row">
                    {p.tags.map((t, ti) => (
                      <span className="chip" key={ti}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {requested && p.st !== 'connected' && (
                  <div
                    className="row"
                    style={{ background: 'var(--sf2)', padding: '10px 12px', borderRadius: '10px' }}
                  >
                    <span style={{ fontSize: '13px' }}>
                      Waiting for {p.name} to accept and share direct phone &amp; WhatsApp.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const clientConnections = () => {
    const out: { r: ClientReq; p: PartnerReplyLite }[] = [];
    creqs.forEach((r) =>
      (r.partners || []).forEach((p) => {
        if (p.st === 'connected' || p.st === 'unlocked') out.push({ r, p });
      }),
    );
    return out;
  };

  const renderClientConn = () => {
    const connections = clientConnections();
    return (
      <>
        <span className="lbl" style={{ margin: '2px' }}>
          Connected partners ({connections.length})
        </span>
        {connections.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="mute" style={{ fontSize: '13px' }}>
              No connections yet. When you unlock a partner and they accept, they appear here with
              direct contact.
            </span>
          </div>
        )}
        {connections.map(({ r, p }, i) => {
          const waHref = p.phone
            ? 'https://wa.me/' + p.phone.replace(/\D/g, '')
            : WHATSAPP_BOT_URL;
          const telHref = 'tel:' + (p.phone || SUPPORT_PHONE);
          return (
            <div key={(p.id || 'p') + i} className="card">
              <div className="row">
                <span className="sq">✓</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: '15px' }}>{p.name}</b>
                  <br />
                  <span className="mute" style={{ fontSize: '12.5px' }}>
                    Verified partner · {r.title}
                  </span>
                </span>
              </div>
              <div className="row">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn ink sm"
                  style={{ textDecoration: 'none' }}
                >
                  Message on WhatsApp
                </a>
                <a href={telHref} className="btn sm" style={{ textDecoration: 'none' }}>
                  Call
                </a>
              </div>
            </div>
          );
        })}
      </>
    );
  };

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
          <b>{clientConnections().length}</b>
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

        {/* Attention banner when a client has requested this partner's contact */}
        {(() => {
          const pending = leads.find((l) => l.needsConsent);
          if (!pending) return null;
            const who = pending.clientName
              ? pending.clientCompany
                ? pending.clientName + ' (' + pending.clientCompany + ')'
                : pending.clientName
              : 'A client';
            return (
              <div className="card attn">
                <div className="head" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className="chip c-r">Action needed</span>
                  <span className="sp" />
                  <span className="mono mute3">{pending.id}</span>
                </div>
                <b style={{ fontSize: '15px' }}>{who} used 1 view to see your details</b>
                <span className="mute" style={{ fontSize: '13.5px' }}>
                  Confirm to share your phone &amp; WhatsApp and unlock their direct number.
                </span>
                <div className="row">
                  <button
                    className="btn red sm"
                    onClick={async () => {
                      showToast('Contact shared. You are now connected with ' + who + '.');
                      await postMarketplaceAction('partner.respond_connection', {
                        oppId: pending.key,
                        ref: pending.id,
                        decision: 'accepted',
                      });
                      await rehydrateMarketplace();
                    }}
                  >
                    Accept &amp; share contact
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => {
                      setPLeadKey(pending.key);
                      setPs('lead');
                    }}
                  >
                    Review request
                  </button>
                </div>
              </div>
            );
          })()}

        {filteredList.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            {!hydrated ? (
              <span className="mute">Loading matched leads…</span>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>No matched leads yet</h3>
                <span className="mute" style={{ fontSize: '13px' }}>
                  New requirements in your categories will appear here in 5-minute waves.
                </span>
              </>
            )}
          </div>
        )}

        {filteredList.map(renderLeadCard)}
      </>
    );
  };

  const renderPartnerLeadDetail = () => {
    const l = leads.find((x) => x.key === pLeadKey) || leads[0];
    if (!l) {
      return (
        <>
          <button
            className="btn ghost sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setPs('reqs')}
          >
            ← All requests
          </button>
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="mute">This lead is no longer available.</span>
          </div>
        </>
      );
    }
    const isSentOrConnected = l.state === 'sent' || l.state === 'connected' || !!l.myReply;

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
                  await postMarketplaceAction('partner.submit_reply', {
                    oppId: l.key,
                    ref: l.id,
                    pitch: replyText || 'Interested in delivering this requirement with full QA.',
                    timeline: partnerNewTimeline,
                    quote: partnerNewQuote,
                  });
                  await rehydrateMarketplace();
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
        {list.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="mute" style={{ fontSize: '13px' }}>
              No connections yet. When a client accepts a reply and shares their contact, they appear
              here.
            </span>
          </div>
        )}
        {list.map((l) => {
          const name = l.clientName
            ? l.clientCompany
              ? l.clientName + ' · ' + l.clientCompany
              : l.clientName
            : 'Connected client';
          const waHref = l.clientPhone
            ? 'https://wa.me/' + l.clientPhone.replace(/\D/g, '')
            : WHATSAPP_BOT_URL;
          const telHref = 'tel:' + (l.clientPhone || SUPPORT_PHONE);
          return (
            <div key={l.key} className="card">
              <div className="row">
                <span className="sq">✓</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: '15px' }}>{name}</b>
                  <br />
                  <span className="mute" style={{ fontSize: '12.5px' }}>
                    {l.title} · {l.budget}
                  </span>
                </span>
                <span className="chip c-g">{l.when}</span>
              </div>
              <div className="row">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn ink sm"
                  style={{ textDecoration: 'none' }}
                >
                  Message on WhatsApp
                </a>
                <a href={telHref} className="btn sm" style={{ textDecoration: 'none' }}>
                  Call
                </a>
              </div>
            </div>
          );
        })}
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
    { k: 'conn', l: 'Connected', i: 'link' as const, n: clientConnections().length },
  ];

  const partnerNav = [
    { k: 'reqs', l: 'Requests', i: 'inbox' as const, n: leads.filter((l) => l.state === 'new').length },
    { k: 'replies', l: 'Replies', i: 'chat' as const, n: leads.filter((l) => l.state === 'sent' || l.state === 'connected').length },
    { k: 'conn', l: 'Connected', i: 'link' as const, n: leads.filter((l) => l.state === 'connected').length },
    { k: 'cats', l: 'Categories', i: 'tag' as const },
  ];

  const who =
    role === 'client'
      ? { name: 'Your account', biz: 'XPO buyer', ini: 'B' }
      : { name: 'Your business', biz: 'XPO partner', ini: 'P' };
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
      if (ps === 'reqs') return 'Requests matched to you';
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
        </div>

        <span className="sp" />

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
              {ALERTS[role].length === 0 ? (
                <div className="al" style={{ cursor: 'default' }}>
                  <span className="t">No alerts yet</span>
                  <span>You&apos;re all caught up.</span>
                </div>
              ) : (
                ALERTS[role].map((a, i) => (
                  <button key={i} className="al" onClick={a.action}>
                    <span className="t">{a.t}</span>
                    <span>{a.d}</span>
                  </button>
                ))
              )}
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
              <button
                className="mrow"
                onClick={() => {
                  const next = role === 'client' ? 'partner' : 'client';
                  setRole(next);
                  if (next === 'client') setCs('home');
                  else setPs('reqs');
                  setMenu('none');
                  showToast('Switched to the ' + next + ' view.');
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {icons.switchRole}
                  Switch to {role === 'client' ? 'partner' : 'client'} view
                </span>
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
