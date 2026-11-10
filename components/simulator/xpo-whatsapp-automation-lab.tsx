'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  fetchMarketplaceState,
  postMarketplaceAction,
  subscribeMarketplaceSync,
  type SharedMarketplaceState,
} from '@/lib/marketplace/sync-client';

export type WaStateId =
  | 'NEW_CONTACT'
  | 'ROLE_SELECTION'
  | 'CLIENT_ONBOARDING'
  | 'PARTNER_ONBOARDING'
  | 'ACTIVE'
  | 'CLIENT_POST_REQ_CATEGORY'
  | 'CLIENT_POST_REQ_SPECS'
  | 'CLIENT_POST_REQ_LOCATION'
  | 'CLIENT_POST_REQ_TIMELINE'
  | 'CLIENT_POST_REQ_BUDGET'
  | 'CLIENT_POST_REQ_CONFIRM'
  | 'OFFER_SENT'
  | 'CLAIM_CONFIRMED'
  | 'PARTNER_VIEW_UNLOCKED'
  | 'CONNECTION_PENDING'
  | 'CONNECTED'
  | 'RENEWAL_REQUIRED'
  | 'PAUSED_OR_OPTED_OUT'
  | 'SUPPORT_REVIEW';

export interface SimChatMessage {
  id: string;
  persona: 'client' | 'partner';
  sender: 'user' | 'bot' | 'system';
  header?: string;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  templateName?: string;
  buttons?: {
    id: string;
    label: string;
    tone?: 'primary' | 'danger' | 'default';
  }[];
}

export interface WebhookLogEntry {
  id: string;
  ts: string;
  direction: 'INBOUND_WEBHOOK' | 'OUTBOUND_META_API' | 'STATE_TRANSITION' | 'FIRESTORE_SYNC';
  summary: string;
  stateFrom?: WaStateId;
  stateTo?: WaStateId;
  payload: Record<string, any>;
}

const ALL_18_STATES: { id: WaStateId; group: string; label: string; desc: string }[] = [
  { id: 'NEW_CONTACT', group: 'Onboarding', label: '1. NEW_CONTACT', desc: 'First inbound message or CRM invite tap' },
  { id: 'ROLE_SELECTION', group: 'Onboarding', label: '2. ROLE_SELECTION', desc: 'Choosing Client (Buyer) or Partner (Supplier)' },
  { id: 'CLIENT_ONBOARDING', group: 'Onboarding', label: '3. CLIENT_ONBOARDING', desc: 'Collecting missing Client name, company & city' },
  { id: 'PARTNER_ONBOARDING', group: 'Onboarding', label: '4. PARTNER_ONBOARDING', desc: 'Collecting Partner categories, city & GST/capabilities' },
  { id: 'ACTIVE', group: 'Core Ready', label: '5. ACTIVE', desc: 'Onboarded & ready for natural language or menu commands' },
  { id: 'CLIENT_POST_REQ_CATEGORY', group: 'Requirement Intake', label: '6. REQ_CATEGORY', desc: 'Resolving 4-tier taxonomy sector & category' },
  { id: 'CLIENT_POST_REQ_SPECS', group: 'Requirement Intake', label: '7. REQ_SPECS', desc: 'Capturing requirement specifications / voice note' },
  { id: 'CLIENT_POST_REQ_LOCATION', group: 'Requirement Intake', label: '8. REQ_LOCATION', desc: 'Capturing delivery city / work location' },
  { id: 'CLIENT_POST_REQ_TIMELINE', group: 'Requirement Intake', label: '9. REQ_TIMELINE', desc: 'Capturing urgency / delivery timeline' },
  { id: 'CLIENT_POST_REQ_BUDGET', group: 'Requirement Intake', label: '10. REQ_BUDGET', desc: 'Capturing estimated budget or inviting quotes' },
  { id: 'CLIENT_POST_REQ_CONFIRM', group: 'Requirement Intake', label: '11. REQ_CONFIRM', desc: 'Client confirms structured draft before Wave 1 dispatch' },
  { id: 'OFFER_SENT', group: '5-Min Wave Engine', label: '12. OFFER_SENT', desc: '5-minute Wave offer delivered to 3 matched Partners' },
  { id: 'CLAIM_CONFIRMED', group: '5-Min Wave Engine', label: '13. CLAIM_CONFIRMED', desc: 'Partner accepted & submitted quote (1 reply credit used)' },
  { id: 'PARTNER_VIEW_UNLOCKED', group: 'Mutual Handshake', label: '14. VIEW_UNLOCKED', desc: 'Client spent 1 view credit to unlock Partner profile' },
  { id: 'CONNECTION_PENDING', group: 'Mutual Handshake', label: '15. CONNECTION_PENDING', desc: 'Awaiting Partner mutual consent to share direct contact' },
  { id: 'CONNECTED', group: 'Mutual Handshake', label: '16. CONNECTED', desc: 'Mutual consent complete — direct phone & WhatsApp shared' },
  { id: 'RENEWAL_REQUIRED', group: 'Billing & Safety', label: '17. RENEWAL_REQUIRED', desc: 'Free quota exhausted — UPI AutoPay / PayPal link sent' },
  { id: 'PAUSED_OR_OPTED_OUT', group: 'Billing & Safety', label: '18a. PAUSED_OPT_OUT', desc: 'User replied STOP — all outbound alerts suppressed' },
  { id: 'SUPPORT_REVIEW', group: 'Billing & Safety', label: '18b. SUPPORT_REVIEW', desc: 'Bot paused — escalated to human coordinator queue' },
];

export function XpoWhatsAppAutomationLab({
  compact = false,
  onOpenMobileSimulator,
}: {
  compact?: boolean;
  onOpenMobileSimulator?: (role: 'client' | 'partner') => void;
}) {
  const [liveState, setLiveState] = useState<SharedMarketplaceState | null>(null);
  const [viewMode, setViewMode] = useState<'dual' | 'client' | 'partner'>(compact ? 'dual' : 'dual');
  const [clientWaState, setClientWaState] = useState<WaStateId>('ACTIVE');
  const [partnerWaState, setPartnerWaState] = useState<WaStateId>('OFFER_SENT');
  const [activeStep, setActiveStep] = useState<number>(1);

  // 5-Minute Wave Timer state (300 seconds = 5:00)
  const [waveSeconds, setWaveSeconds] = useState<number>(284);
  const [waveRunning, setWaveRunning] = useState<boolean>(true);
  const [currentWave, setCurrentWave] = useState<number>(1);
  const [activeReqCode, setActiveReqCode] = useState<string>('XPO-REQ-41208');
  const [activeReqTitle, setActiveReqTitle] = useState<string>('10,000 printed 3-ply corrugated boxes');

  const [clientInput, setClientInput] = useState<string>('');
  const [partnerInput, setPartnerInput] = useState<string>('');
  const [pendingDraft, setPendingDraft] = useState<{
    code: string;
    title: string;
    cat: string;
    city: string;
    timeline: string;
    budget: string;
    spec: string;
    held?: boolean;
  } | null>(null);

  const [messages, setMessages] = useState<SimChatMessage[]>(() => [
    // Initial Client WhatsApp History
    {
      id: 'c-1',
      persona: 'client',
      sender: 'bot',
      header: 'Welcome back to XPO India ✓',
      templateName: 'client_welcome_active',
      text: 'Hello *Pavan* (*Test Traders*, Hyderabad)!\n\n• Posting B2B requirements is *100% Free*\n• Remaining Free Partner Views: *4*\n\nType your requirement in one sentence (English, Hindi, or Hinglish) or tap an option below:',
      time: '10:40 AM',
      status: 'read',
      buttons: [
        { id: 'c_sample_boxes', label: '📦 Post: 10,000 Corrugated Boxes (Pune)', tone: 'primary' },
        { id: 'c_sample_erp', label: '💻 Post: Custom ERP for 12 Depots', tone: 'default' },
        { id: 'c_check_status', label: '📊 Check My Active Requirements', tone: 'default' },
      ],
    },
    // Initial Partner WhatsApp History
    {
      id: 'p-1',
      persona: 'partner',
      sender: 'bot',
      header: '⚡ NEW WAVE 1 LEAD · 5 MIN WINDOW',
      templateName: 'opportunity_alert (Meta Approved)',
      text: 'Match Score: *97% (Verified Partner)*\nRef: *XPO-REQ-41208*\n\n*Requirement:* 10,000 printed 3-ply corrugated boxes\n*Category:* Packaging & Printing\n*Location:* Pune\n*Timeline:* Within 2-4 Weeks\n*Budget:* Quotes invited\n*Specs:* 3-ply, 12 x 10 x 8 in, 2-colour logo print, delivered to Pune warehouse.\n\n⏱ *5-Minute Wave 1 Clock started on delivery.*\nOffered to only 3 matched partners in Wave 1. Pass costs 0 credits.',
      time: '11:05 AM',
      status: 'read',
      buttons: [
        { id: 'p_claim_quote', label: '✓ Interested · Send Quote (1 Reply)', tone: 'primary' },
        { id: 'p_pass_offer', label: '✕ Pass (0 Credits)', tone: 'default' },
      ],
    },
  ]);

  const [logs, setLogs] = useState<WebhookLogEntry[]>(() => [
    {
      id: 'log-1',
      ts: '11:05:02',
      direction: 'OUTBOUND_META_API',
      summary: 'Dispatched template "opportunity_alert" (Wave 1) to +915679424578 (Klo Tech)',
      stateFrom: 'ACTIVE',
      stateTo: 'OFFER_SENT',
      payload: {
        messaging_product: 'whatsapp',
        to: '+915679424578',
        type: 'template',
        template: { name: 'opportunity_alert', language: { code: 'en' } },
        requirementCode: 'XPO-REQ-41208',
        wave: 1,
      },
    },
    {
      id: 'log-2',
      ts: '11:05:03',
      direction: 'INBOUND_WEBHOOK',
      summary: 'Meta Delivery Receipt: status="delivered" · 5-Minute Offer Clock Started (300s)',
      stateFrom: 'OFFER_SENT',
      stateTo: 'OFFER_SENT',
      payload: {
        object: 'whatsapp_business_account',
        statuses: [{ id: 'wamid.HBgMOTE1Njc5NDI0NTc4', status: 'delivered', offerClock: '300s_started' }],
      },
    },
  ]);

  const clientChatRef = useRef<HTMLDivElement | null>(null);
  const partnerChatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchMarketplaceState().then((st) => {
      if (st) setLiveState(st);
    });
    return subscribeMarketplaceSync((st) => {
      setLiveState(st);
    });
  }, []);

  useEffect(() => {
    if (!waveRunning) return;
    const timer = setInterval(() => {
      setWaveSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [waveRunning]);

  useEffect(() => {
    if (clientChatRef.current) {
      clientChatRef.current.scrollTop = clientChatRef.current.scrollHeight;
    }
    if (partnerChatRef.current) {
      partnerChatRef.current.scrollTop = partnerChatRef.current.scrollHeight;
    }
  }, [messages]);

  const nowTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const nowSec = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  };

  const addLog = (entry: Omit<WebhookLogEntry, 'id' | 'ts'>) => {
    setLogs((prev) => [
      {
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        ts: nowSec(),
        ...entry,
      },
      ...prev.slice(0, 24),
    ]);
  };

  const appendMsg = (msg: Omit<SimChatMessage, 'id' | 'time'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        time: nowTime(),
      },
    ]);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ============================================================================
  // Parse natural language / Hinglish requirement on WhatsApp
  // ============================================================================
  const handleClientNaturalLanguage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    appendMsg({
      persona: 'client',
      sender: 'user',
      text,
      status: 'read',
    });

    const upper = text.toUpperCase();

    // Also fire to backend simulator API asynchronously for Firestore session persistence
    fetch('/api/admin/whatsapp/simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_inbound',
        phoneE164: '+919849000112',
        profileName: 'Pavan (Test Traders)',
        textBody: text,
      }),
    }).catch(() => {});

    // 1. Check Global Keywords (STOP, START, SUPPORT, MENU)
    if (upper === 'STOP' || upper === 'UNSUBSCRIBE') {
      const prevSt = clientWaState;
      setClientWaState('PAUSED_OR_OPTED_OUT');
      addLog({
        direction: 'STATE_TRANSITION',
        summary: 'Global Keyword "STOP" → Immediate Opt-Out Suppression',
        stateFrom: prevSt,
        stateTo: 'PAUSED_OR_OPTED_OUT',
        payload: { keyword: 'STOP', optOutSuppressed: true },
      });
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: '🛑 Opt-Out Confirmed',
        text: 'You have been unsubscribed from XPO India WhatsApp alerts. No further messages will be sent.\n\nReply *START* anytime to re-activate your account.',
        buttons: [{ id: 'c_kw_start', label: '▶ Reply START to Resume', tone: 'primary' }],
      });
      return;
    }

    if (upper === 'START' || upper === 'RESUME') {
      const prevSt = clientWaState;
      setClientWaState('ACTIVE');
      addLog({
        direction: 'STATE_TRANSITION',
        summary: 'Global Keyword "START" → Opt-In Resubscription',
        stateFrom: prevSt,
        stateTo: 'ACTIVE',
        payload: { keyword: 'START', optOutSuppressed: false },
      });
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: '✓ Account Re-Activated',
        text: 'Welcome back, *Pavan*! Your XPO Client workspace is active again. Tell us what you need in one sentence:',
        buttons: [
          { id: 'c_sample_boxes', label: '📦 Post: 10,000 Corrugated Boxes', tone: 'primary' },
          { id: 'c_check_status', label: '📊 My Requirements', tone: 'default' },
        ],
      });
      return;
    }

    if (upper.includes('SUPPORT') || upper.includes('AGENT') || upper.includes('HELP')) {
      const prevSt = clientWaState;
      setClientWaState('SUPPORT_REVIEW');
      addLog({
        direction: 'STATE_TRANSITION',
        summary: 'Keyword "SUPPORT" → Bot Paused · Escalated to Superadmin Coordinator Queue',
        stateFrom: prevSt,
        stateTo: 'SUPPORT_REVIEW',
        payload: { keyword: 'SUPPORT', botPaused: true, escalatedTo: 'Superadmin Today Queue' },
      });
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: '👩‍💼 Human Coordinator Assigned',
        text: 'We have paused automated replies and alerted an XPO Coordinator (+91 40 4917 2200). A specialist will reply here within 15 minutes.',
        buttons: [{ id: 'c_kw_start', label: 'Resume Automated Bot', tone: 'default' }],
      });
      return;
    }

    // 2. Parse B2B requirement intent (English, Hindi, Hinglish)
    const lower = text.toLowerCase();
    const isHeld = lower.includes('bet') || lower.includes('casino') || lower.includes('gambl');
    let title = text.length > 68 ? text.slice(0, 65) + '...' : text;
    let cat = 'Web & Mobile Development';
    let city = 'Hyderabad';
    let timeline = 'Within 2-4 Weeks';
    let budget = '₹2,00,000';

    if (lower.includes('box') || lower.includes('dabba') || lower.includes('carton') || lower.includes('packaging')) {
      title = '10,000 printed 3-ply corrugated boxes';
      cat = 'Packaging & Printing';
      city = lower.includes('pune') ? 'Pune' : 'Hyderabad';
      timeline = 'Within 2-4 Weeks';
      budget = '₹1,80,000';
    } else if (lower.includes('solar') || lower.includes('kw') || lower.includes('rooftop')) {
      title = '50 kW rooftop solar plant with net metering';
      cat = 'Solar & Clean Energy';
      city = lower.includes('nagpur') ? 'Nagpur' : 'Pune';
      timeline = 'Within 2-4 Weeks';
      budget = '₹22,00,000';
    } else if (lower.includes('erp') || lower.includes('warehouse') || lower.includes('tally') || lower.includes('software')) {
      title = 'Custom ERP & Tally inventory sync for 12 warehouses';
      cat = 'Web & Mobile Development';
      city = lower.includes('mumbai') ? 'Mumbai' : 'Hyderabad';
      timeline = 'Within 2-4 Weeks';
      budget = '₹4,50,000';
    } else if (lower.includes('gst') || lower.includes('audit') || lower.includes('ca')) {
      title = 'Monthly GST filing and compliance for 3 entities';
      cat = 'Accounting, GST & Virtual CFO';
      city = 'Bengaluru';
      timeline = 'Immediate (Within 7 Days)';
      budget = '₹90,000 / year';
    } else if (isHeld) {
      title = 'Performance marketing for fantasy sports & betting app';
      cat = 'Performance Marketing & SEO';
      city = 'Bengaluru';
      timeline = 'Immediate (Within 7 Days)';
      budget = '₹5,00,000';
    }

    const nextSeq = (liveState?.client?.seq || 41230) + 1;
    const code = `XPO-REQ-${nextSeq}`;
    const draftObj = {
      code,
      title,
      cat,
      city,
      timeline,
      budget,
      spec: text,
      held: isHeld,
    };
    setPendingDraft(draftObj);
    const prevSt = clientWaState;
    setClientWaState('CLIENT_POST_REQ_CONFIRM');
    setActiveStep(1);

    addLog({
      direction: 'STATE_TRANSITION',
      summary: `AI Intent Resolver (96% conf) → Extracted [${cat}] in [${city}]`,
      stateFrom: prevSt,
      stateTo: 'CLIENT_POST_REQ_CONFIRM',
      payload: draftObj,
    });

    appendMsg({
      persona: 'client',
      sender: 'bot',
      header: '✨ Structured Requirement Draft Ready',
      text:
        `I've structured your requirement for free Wave 1 matching:\n\n` +
        `• *Ref:* ${code}\n` +
        `• *Title:* ${title}\n` +
        `• *Category:* ${cat}\n` +
        `• *Location:* ${city}\n` +
        `• *Timeline:* ${timeline}\n` +
        `• *Est. Budget:* ${budget}\n` +
        (isHeld
          ? `\n⚠️ *Safety Notice:* Contains restricted keyword ("betting"). Will be queued for Superadmin review before partner dispatch.`
          : `\nTap *Confirm & Post Free* to dispatch immediately to 3 verified Partners (5-min response window):`),
      buttons: [
        { id: 'c_confirm_post', label: '✓ Confirm & Post Free', tone: 'primary' },
        { id: 'c_cancel_draft', label: '✕ Cancel Draft', tone: 'default' },
      ],
    });
  };

  // ============================================================================
  // Interactive Button Handler (Full End-to-End Loop)
  // ============================================================================
  const handleButtonTap = async (persona: 'client' | 'partner', btnId: string, btnLabel: string) => {
    appendMsg({
      persona,
      sender: 'user',
      text: btnLabel,
      status: 'read',
    });

    if (btnId === 'c_sample_boxes') {
      await handleClientNaturalLanguage(
        'Need 10,000 printed 3-ply corrugated boxes in Pune within 2 weeks, budget ₹1,80,000'
      );
      return;
    }

    if (btnId === 'c_sample_erp') {
      await handleClientNaturalLanguage(
        'Need custom ERP & Tally inventory sync for 12 warehouses in Mumbai within 3 weeks, budget ₹4.5L'
      );
      return;
    }

    if (btnId === 'c_kw_start') {
      await handleClientNaturalLanguage('START');
      return;
    }

    if (btnId === 'c_check_status') {
      const reqCount = liveState ? Object.keys(liveState.client.reqs).length : 5;
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: `📊 Active Requirements (${reqCount})`,
        text:
          `1. *XPO-REQ-40971* · E-commerce website for 5-store chain — *2 Partners Interested*\n` +
          `2. *XPO-REQ-41208* · 10,000 printed 3-ply corrugated boxes — *Wave 1 Live (5m window)*\n` +
          `3. *XPO-REQ-41190* · Marketing for fantasy sports app — *Being Checked by Admin*\n\n` +
          `Tap below to review interested partners or post a new requirement:`,
        buttons: [
          { id: 'c_unlock_partner', label: '🔓 Unlock Klo Tech on XPO-REQ-41208 (1 View)', tone: 'primary' },
          { id: 'c_sample_boxes', label: '+ Post New Requirement', tone: 'default' },
        ],
      });
      return;
    }

    // STEP 1 -> 2: Client confirms requirement post on WhatsApp -> Syncs to Firestore & dispatches Wave 1 to Partner!
    if (btnId === 'c_confirm_post') {
      const d = pendingDraft || {
        code: 'XPO-REQ-' + ((liveState?.client?.seq || 41230) + 1),
        title: '10,000 printed 3-ply corrugated boxes',
        cat: 'Packaging & Printing',
        city: 'Pune',
        timeline: 'Within 2-4 Weeks',
        budget: '₹1,80,000',
        spec: '10,000 printed 3-ply corrugated boxes in Pune within 2 weeks, 2-colour logo print.',
        held: false,
      };

      const reqKey = 'wa_' + d.code.replace(/\D/g, '');
      const updated = await postMarketplaceAction('client.post_requirement', {
        key: reqKey,
        requirement: {
          code: d.code,
          title: d.title,
          sector: 'Manufacturing & Industrial',
          cat: d.cat,
          sub: 'Corrugated & Carton Boxes',
          loc: d.city,
          timeline: d.timeline,
          budget: d.budget,
          spec: d.spec,
          posted: 'posted just now via WhatsApp',
          status: d.held ? 'held' : 'finding',
          wave: d.held ? 0 : 1,
          partners: [],
        },
      });
      if (updated) setLiveState(updated);

      setClientWaState('ACTIVE');
      setActiveReqCode(d.code);
      setActiveReqTitle(d.title);

      if (d.held) {
        addLog({
          direction: 'FIRESTORE_SYNC',
          summary: `Requirement ${d.code} held by Safety Filter → Queued in Superadmin Moderation`,
          stateFrom: 'CLIENT_POST_REQ_CONFIRM',
          stateTo: 'ACTIVE',
          payload: { code: d.code, status: 'held', reason: 'Flagged keyword: betting' },
        });
        appendMsg({
          persona: 'client',
          sender: 'bot',
          header: `⏳ Queued for Safety Check · ${d.code}`,
          text: `Your requirement *${d.title}* (${d.code}) is being checked by our moderation team before sending to partners. You'll receive a WhatsApp update shortly.`,
        });
        return;
      }

      // Normal Wave 1 Dispatch!
      setPartnerWaState('OFFER_SENT');
      setCurrentWave(1);
      setWaveSeconds(300);
      setWaveRunning(true);
      setActiveStep(2);

      addLog({
        direction: 'FIRESTORE_SYNC',
        summary: `Saved ${d.code} to Firestore & triggered Wave 1 (3 matched Partners, 5:00 window)`,
        stateFrom: 'CLIENT_POST_REQ_CONFIRM',
        stateTo: 'OFFER_SENT',
        payload: {
          action: 'client.post_requirement',
          code: d.code,
          wave1Partners: ['Klo Tech', 'Shree Packaging', 'Deccan Pack'],
          windowSeconds: 300,
        },
      });

      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: `🚀 Posted Free · ${d.code}`,
        text:
          `Your requirement *${d.title}* is now live!\n\n` +
          `• *Wave 1 Dispatched:* Offered to *3 top-matched verified Partners* in ${d.city}\n` +
          `• *Response Window:* 5 minutes per wave\n\n` +
          `We will message you right here as soon as Partners reply with quotes.`,
      });

      // Dispatch outbound Meta template to Partner WhatsApp phone!
      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: `⚡ NEW WAVE 1 LEAD · ${d.code}`,
        templateName: 'opportunity_alert (Meta Approved)',
        text:
          `Match Score: *98% (Top Local Match)*\n` +
          `Ref: *${d.code}*\n\n` +
          `*Requirement:* ${d.title}\n` +
          `*Category:* ${d.cat}\n` +
          `*Location:* ${d.city}\n` +
          `*Timeline:* ${d.timeline}\n` +
          `*Budget:* ${d.budget}\n` +
          `*Specs:* ${d.spec}\n\n` +
          `⏱ *5:00 Response Window started upon delivery.* Reply now to lock your spot in the top 3:`,
        buttons: [
          { id: 'p_claim_quote', label: '✓ Interested · Send Quote (1 Reply)', tone: 'primary' },
          { id: 'p_pass_offer', label: '✕ Pass (0 Credits)', tone: 'default' },
        ],
      });
      return;
    }

    // STEP 3: Partner claims lead & submits quote on WhatsApp -> Syncs to Client & Firestore!
    if (btnId === 'p_claim_quote') {
      const targetCode = activeReqCode || 'XPO-REQ-41208';
      const nextCredits = Math.max(0, (liveState?.partner?.credits ?? 3) - 1);
      const pitchText =
        'We manufacture 3-ply & 5-ply corrugated boxes in Chakan MIDC with in-house 2-colour flexo printing. Can deliver 10,000 boxes in 10 days.';
      const quoteStr = '₹1,72,000';
      const timelineStr = 'Within 10 days';

      const updated = await postMarketplaceAction('partner.submit_reply', {
        oppId: targetCode === 'XPO-REQ-41208' ? 'req-2' : 'req-' + targetCode,
        ref: targetCode,
        pitch: pitchText,
        timeline: timelineStr,
        quote: quoteStr,
        credits: nextCredits,
      });
      if (updated) setLiveState(updated);

      setPartnerWaState('CLAIM_CONFIRMED');
      setWaveRunning(false);
      setActiveStep(3);

      addLog({
        direction: 'FIRESTORE_SYNC',
        summary: `Partner (Klo Tech) claimed ${targetCode} · 1 reply credit deducted (${nextCredits} left)`,
        stateFrom: 'OFFER_SENT',
        stateTo: 'CLAIM_CONFIRMED',
        payload: {
          action: 'partner.submit_reply',
          ref: targetCode,
          quote: quoteStr,
          timeline: timelineStr,
          partnerCreditsLeft: nextCredits,
        },
      });

      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: `✓ Reply Sent to Client · ${targetCode}`,
        text:
          `Your pitch and quote (*${quoteStr} · ${timelineStr}*) have been sent to the Client!\n\n` +
          `• *1 Reply Credit Used* (${nextCredits} free replies remaining)\n` +
          `• *Privacy Protected:* Your phone number remains masked until the Client unlocks your profile and you accept.`,
      });

      // Notify Client on WhatsApp with Masked Partner Card!
      setClientWaState('ACTIVE');
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: `🎯 New Partner Interested · ${targetCode}`,
        templateName: 'partner_reply_card',
        text:
          `A verified Partner has replied to *${activeReqTitle}* (${targetCode}):\n\n` +
          `🏢 *Verified Packaging & Tech Partner · Hyderabad/Pune*\n` +
          `💬 *"${pitchText}"*\n` +
          `💰 *Quote:* ${quoteStr}  |  ⏱ *Timeline:* ${timelineStr}\n` +
          `🔒 *Identity & Phone:* Masked until unlocked\n\n` +
          `Spend *1 Free Partner View* (4 remaining) to reveal their company name and request direct contact:`,
        buttons: [
          { id: 'c_unlock_partner', label: '🔓 Unlock Partner & Request Contact (1 Free View)', tone: 'primary' },
        ],
      });
      return;
    }

    // Partner passes on offer (0 credits deducted)
    if (btnId === 'p_pass_offer') {
      setPartnerWaState('ACTIVE');
      addLog({
        direction: 'STATE_TRANSITION',
        summary: `Partner passed on ${activeReqCode} · 0 credits deducted · Rotating to next partner`,
        stateFrom: 'OFFER_SENT',
        stateTo: 'ACTIVE',
        payload: { ref: activeReqCode, creditDeducted: 0, cascade: 'next_ranked_partner' },
      });
      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: 'Offer Passed · 0 Credits Used',
        text: `No problem! We did not deduct any reply credits and have rotated *${activeReqCode}* to the next matched Partner.`,
      });
      return;
    }

    // STEP 4: Client unlocks Partner on WhatsApp -> Requests mutual connection!
    if (btnId === 'c_unlock_partner') {
      const targetCode = activeReqCode || 'XPO-REQ-41208';
      const reqEntry = liveState
        ? Object.entries(liveState.client.reqs).find(([, r]) => r.code === targetCode)
        : undefined;
      const reqKey = reqEntry ? reqEntry[0] : 'r2';
      const nextFree = Math.max(0, (liveState?.client?.free ?? 4) - 1);

      const updated = await postMarketplaceAction('client.update_partner_status', {
        key: reqKey,
        partnerId: 'p1',
        st: 'waiting',
        free: nextFree,
        plan: liveState?.client?.plan ?? 0,
      });
      if (updated) setLiveState(updated);

      setClientWaState('CONNECTION_PENDING');
      setPartnerWaState('CONNECTION_PENDING');
      setActiveStep(4);

      addLog({
        direction: 'FIRESTORE_SYNC',
        summary: `Client unlocked Klo Tech on ${targetCode} · 1 free view used (${nextFree} left) · Connection request sent`,
        stateFrom: 'PARTNER_VIEW_UNLOCKED',
        stateTo: 'CONNECTION_PENDING',
        payload: {
          action: 'client.update_partner_status',
          reqKey,
          partnerId: 'p1',
          status: 'waiting',
          clientFreeViewsLeft: nextFree,
        },
      });

      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: `🔓 Partner Unlocked · Klo Tech`,
        text:
          `• *Company:* Klo Tech Pvt Ltd (Verified · GST Checked · 6 yrs)\n` +
          `• *1 Free View Used* (${nextFree} free views left)\n\n` +
          `⏳ *Mutual Consent Request Sent:* We've messaged *Klo Tech* on WhatsApp to confirm sharing direct phone numbers. If they decline, your view credit is automatically refunded.`,
      });

      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: `🔔 Client Requested Direct Contact · ${targetCode}`,
        templateName: 'mutual_connection_request (Meta Approved)',
        text:
          `*Test Traders* (*Pavan*, Hyderabad) used 1 Partner View to unlock your reply on *${activeReqTitle}* (${targetCode})!\n\n` +
          `Confirm below to share your direct phone/WhatsApp and unlock Pavan's direct number:`,
        buttons: [
          { id: 'p_accept_conn', label: '✓ Accept & Share Direct Contact', tone: 'primary' },
          { id: 'p_decline_conn', label: '✕ Decline (Refund Client View)', tone: 'danger' },
        ],
      });
      return;
    }

    // STEP 5: Partner accepts connection on WhatsApp -> Mutual Direct Contact Reveal!
    if (btnId === 'p_accept_conn') {
      const targetCode = activeReqCode || 'XPO-REQ-41208';
      const updated = await postMarketplaceAction('partner.respond_connection', {
        oppId: targetCode === 'XPO-REQ-41208' ? 'req-2' : 'req-' + targetCode,
        ref: targetCode,
        decision: 'accepted',
      });
      if (updated) setLiveState(updated);

      setClientWaState('CONNECTED');
      setPartnerWaState('CONNECTED');
      setActiveStep(5);

      addLog({
        direction: 'FIRESTORE_SYNC',
        summary: `Mutual Handshake Complete on ${targetCode} · Direct Phone & WhatsApp Revealed Both Ways`,
        stateFrom: 'CONNECTION_PENDING',
        stateTo: 'CONNECTED',
        payload: {
          action: 'partner.respond_connection',
          ref: targetCode,
          decision: 'accepted',
          clientPhone: '+91 98490 00112',
          partnerPhone: '+91 56794 24578',
          commissionCharged: '₹0 (0% Commission)',
        },
      });

      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: `🤝 Connected with Test Traders · ${targetCode}`,
        text:
          `Direct contact unlocked! Deal directly with zero commission:\n\n` +
          `👤 *Client:* Pavan (Test Traders · Hyderabad)\n` +
          `📞 *Direct Phone / WhatsApp:* +91 98490 00112\n` +
          `✉️ *Email:* pavan@testtraders.in`,
      });

      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: `🤝 Klo Tech Accepted! Direct Contact Shared`,
        text:
          `Mutual consent complete for *${targetCode}*. Deal directly with 0% commission:\n\n` +
          `🏭 *Partner:* Rohan Rao (Klo Tech Pvt Ltd · Verified)\n` +
          `📞 *Direct Phone / WhatsApp:* +91 56794 24578\n` +
          `🌐 *Web:* klotech.in`,
      });
      return;
    }

    if (btnId === 'p_decline_conn') {
      const targetCode = activeReqCode || 'XPO-REQ-41208';
      const updated = await postMarketplaceAction('partner.respond_connection', {
        oppId: targetCode === 'XPO-REQ-41208' ? 'req-2' : 'req-' + targetCode,
        ref: targetCode,
        decision: 'declined',
      });
      if (updated) setLiveState(updated);

      setClientWaState('ACTIVE');
      setPartnerWaState('ACTIVE');

      appendMsg({
        persona: 'partner',
        sender: 'bot',
        header: 'Connection Declined',
        text: `We let Test Traders know you're unavailable and refunded their Partner View credit.`,
      });
      appendMsg({
        persona: 'client',
        sender: 'bot',
        header: 'Partner Unavailable · View Refunded',
        text: `Klo Tech couldn't take on ${targetCode} right now. Your *1 Free Partner View* has been refunded automatically.`,
      });
      return;
    }
  };

  // Fast-forward 5-minute Wave 1 expiry -> Cascade to Wave 2 without deducting credits!
  const simulateWaveExpiryCascade = () => {
    setWaveSeconds(0);
    setWaveRunning(false);
    const nextWave = currentWave + 1;
    setCurrentWave(nextWave);
    setTimeout(() => {
      setWaveSeconds(300);
      setWaveRunning(true);
    }, 600);

    addLog({
      direction: 'STATE_TRANSITION',
      summary: `Wave ${currentWave} 5-Min Window Expired (00:00) · 0 Credits Deducted · Cascaded to Wave ${nextWave} (Next 3 Ranked Partners)`,
      stateFrom: 'OFFER_SENT',
      stateTo: 'OFFER_SENT',
      payload: {
        expiredWave: currentWave,
        newWave: nextWave,
        partnerPenaltyCredits: 0,
        dispatchedTo: ['Apex Packaging · Pune', 'Morya Cartons · Mumbai', 'Sahyadri Print · Nashik'],
      },
    });

    appendMsg({
      persona: 'partner',
      sender: 'system',
      text: `⏱ Wave ${currentWave} 5-minute window expired. 0 credits deducted. Engine automatically cascaded ${activeReqCode} to Wave ${nextWave} (next 3 ranked Partners).`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ==================== TOP ARCHITECTURE & 5-STAGE INTERACTIVE STEPPER ==================== */}
      <section
        className="card"
        style={{
          padding: '18px 20px',
          background: 'var(--sf)',
          border: '1px solid var(--ln)',
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
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                className="chip"
                style={{ background: '#E3F2E8', color: '#14532D', fontWeight: 800 }}
              >
                ● Meta WhatsApp Cloud API · Live 18-State Engine
              </span>
              <span className="chip" style={{ background: 'var(--bbg)', color: 'var(--btx)' }}>
                Synced with Firestore, Client App, Partner App &amp; Superadmin
              </span>
            </div>
            <b style={{ fontSize: 19 }}>
              End-to-End WhatsApp Automation &amp; 5-Minute Wave Matching Simulator
            </b>
            <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
              Click any step below or chat inside the Client &amp; Partner WhatsApp phones — every action updates the live database across all workspaces.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                gap: 4,
                padding: 3,
                borderRadius: 10,
                background: 'var(--sf3)',
              }}
            >
              {(
                [
                  ['dual', 'Both Phones'],
                  ['client', 'Client WA'],
                  ['partner', 'Partner WA'],
                ] as const
              ).map(([mId, mLabel]) => (
                <button
                  key={mId}
                  type="button"
                  onClick={() => setViewMode(mId)}
                  style={{
                    minHeight: 30,
                    padding: '0 10px',
                    borderRadius: 7,
                    border: 0,
                    background: viewMode === mId ? 'var(--inv)' : 'transparent',
                    color: viewMode === mId ? '#fff' : 'var(--tx2)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {mLabel}
                </button>
              ))}
            </div>
            {onOpenMobileSimulator ? (
              <>
                <button
                  type="button"
                  className="btn b2 sm"
                  onClick={() => onOpenMobileSimulator('client')}
                >
                  📱 Open Client Mobile App
                </button>
                <button
                  type="button"
                  className="btn b2 sm"
                  onClick={() => onOpenMobileSimulator('partner')}
                >
                  📱 Open Partner Mobile App
                </button>
              </>
            ) : (
              <Link href="/simulator" className="btn b2 sm" style={{ textDecoration: 'none' }}>
                📱 Open Full Mobile + WhatsApp Studio →
              </Link>
            )}
          </div>
        </div>

        {/* 5-Stage Interactive Playbook Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: 10,
          }}
        >
          {[
            {
              step: 1,
              title: '1. Client Texts / Voice on WA',
              sub: 'AI parses Category, City & Budget',
              cta: '▶ Simulate Step 1',
              run: () =>
                handleClientNaturalLanguage(
                  'Need 10,000 printed 3-ply corrugated boxes in Pune within 2 weeks, budget ₹1,80,000'
                ),
            },
            {
              step: 2,
              title: '2. Confirm & 5-Min Wave 1',
              sub: 'Dispatches to 3 matched Partners',
              cta: '▶ Simulate Step 2',
              run: () => handleButtonTap('client', 'c_confirm_post', '✓ Confirm & Post Free'),
            },
            {
              step: 3,
              title: '3. Partner Claims on WA',
              sub: '1 reply used · Pitch sent to Client',
              cta: '▶ Simulate Step 3',
              run: () =>
                handleButtonTap('partner', 'p_claim_quote', '✓ Interested · Send Quote (1 Reply)'),
            },
            {
              step: 4,
              title: '4. Client Unlocks Partner',
              sub: '1 free view used · Requests contact',
              cta: '▶ Simulate Step 4',
              run: () =>
                handleButtonTap(
                  'client',
                  'c_unlock_partner',
                  '🔓 Unlock Partner & Request Contact (1 Free View)'
                ),
            },
            {
              step: 5,
              title: '5. Mutual Consent & Reveal',
              sub: 'Partner accepts · Numbers shared',
              cta: '▶ Simulate Step 5',
              run: () =>
                handleButtonTap('partner', 'p_accept_conn', '✓ Accept & Share Direct Contact'),
            },
          ].map((s) => {
            const active = activeStep === s.step;
            const done = activeStep > s.step;
            return (
              <div
                key={s.step}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: active
                    ? '2px solid #C8102E'
                    : done
                    ? '1.5px solid #16A34A'
                    : '1px solid var(--ln)',
                  background: active ? 'var(--rbg2)' : done ? 'var(--gbg)' : 'var(--sf2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 13, color: active ? '#C8102E' : 'var(--tx)' }}>{s.title}</b>
                    {done && <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx2)', marginTop: 2 }}>{s.sub}</div>
                </div>
                <button
                  type="button"
                  onClick={s.run}
                  style={{
                    minHeight: 30,
                    borderRadius: 8,
                    border: active ? '0' : '1px solid var(--ln2)',
                    background: active ? '#C8102E' : 'var(--sf)',
                    color: active ? '#fff' : 'var(--tx)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Live 5-Minute Wave Status Strip */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--sf2)',
            border: '1px solid var(--ln)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              className="chip"
              style={{
                background: waveRunning ? '#FEF3C7' : '#E3F2E8',
                color: waveRunning ? '#92400E' : '#14532D',
                fontWeight: 800,
              }}
            >
              ⏱ Wave {currentWave} Clock: {formatTimer(waveSeconds)}
            </span>
            <span style={{ fontSize: 13 }}>
              <b>Active Lead:</b> <span className="mono">{activeReqCode}</span> ({activeReqTitle})
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
              Client Views Left: <b>{liveState?.client?.free ?? 4} free</b> · Partner Replies Left:{' '}
              <b>{liveState?.partner?.credits ?? 3} free</b>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn b2 sm"
              style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
              onClick={simulateWaveExpiryCascade}
            >
              ⏩ Fast-Forward 5m Expiry → Wave {currentWave + 1}
            </button>
            <button
              type="button"
              className="btn b2 sm"
              style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() =>
                handleClientNaturalLanguage(
                  'Need performance marketing for a fantasy sports and betting app in Bengaluru'
                )
              }
            >
              🛡️ Test Flagged Keyword (&ldquo;betting&rdquo;)
            </button>
            <button
              type="button"
              className="btn b2 sm"
              style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() => handleClientNaturalLanguage('STOP')}
            >
              🛑 Test &ldquo;STOP&rdquo; Opt-Out
            </button>
          </div>
        </div>
      </section>

      {/* ==================== DUAL WHATSAPP PHONES + 18-STATE INSPECTOR ==================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact
            ? 'repeat(auto-fit, minmax(340px, 1fr))'
            : 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* PHONE 1: CLIENT WHATSAPP BOT */}
        {(viewMode === 'dual' || viewMode === 'client') && (
          <div
            style={{
              background: '#15171C',
              borderRadius: 34,
              padding: 10,
              boxShadow: '0 20px 44px -18px rgba(0,0,0,0.35)',
              border: '3px solid #2D3139',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Phone Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 16px 8px',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <span>9:41</span>
              <span
                style={{
                  background: '#000',
                  padding: '2px 12px',
                  borderRadius: 99,
                  fontSize: 10.5,
                  color: '#A3E635',
                }}
              >
                👤 CLIENT WHATSAPP (+91 98490 00112)
              </span>
              <span>5G · 100%</span>
            </div>

            {/* WhatsApp Top Bar */}
            <div
              style={{
                background: '#075E54',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '22px 22px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#C8102E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  XPO
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    XPO India Assistant <span style={{ color: '#34D399', fontSize: 13 }}>✔</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.88 }}>
                    Client Bot · State: <span className="mono">{clientWaState}</span>
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(255,255,255,0.16)',
                  padding: '3px 8px',
                  borderRadius: 99,
                  fontWeight: 700,
                }}
              >
                Pavan (Buyer)
              </span>
            </div>

            {/* WhatsApp Chat Wallpaper Area */}
            <div
              ref={clientChatRef}
              style={{
                background: '#ECE5DD',
                height: 430,
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  alignSelf: 'center',
                  background: '#FEF3C7',
                  color: '#78350F',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 8,
                  textAlign: 'center',
                  maxWidth: '90%',
                }}
              >
                🔒 Messages are end-to-end encrypted &amp; verified via Meta Cloud API.
              </div>

              {messages
                .filter((m) => m.persona === 'client')
                .map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: m.sender === 'user' ? '#DCF8C6' : '#FFFFFF',
                      color: '#111827',
                      borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '10px 12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {m.templateName && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#075E54',
                          marginBottom: 3,
                          textTransform: 'uppercase',
                        }}
                      >
                        Template: {m.templateName}
                      </div>
                    )}
                    {m.header && (
                      <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4, color: '#111827' }}>
                        {m.header}
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10.5,
                        color: '#6B7280',
                        marginTop: 4,
                      }}
                    >
                      <span>{m.time}</span>
                      {m.sender === 'user' && <span style={{ color: '#0284C7', fontWeight: 800 }}>✓✓</span>}
                    </div>

                    {m.buttons && m.buttons.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid #E5E7EB',
                        }}
                      >
                        {m.buttons.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleButtonTap('client', b.id, b.label)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              background:
                                b.tone === 'primary'
                                  ? '#075E54'
                                  : b.tone === 'danger'
                                  ? '#FEE2E2'
                                  : '#F9FAFB',
                              color:
                                b.tone === 'primary'
                                  ? '#FFFFFF'
                                  : b.tone === 'danger'
                                  ? '#991B1B'
                                  : '#075E54',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Quick Hinglish / Voice Note Chips */}
            <div
              style={{
                background: '#E5DDD5',
                padding: '6px 10px',
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                borderTop: '1px solid #D4C8BE',
              }}
            >
              {[
                { l: '🎤 Hinglish: "5000 dabba printing Pune"', t: 'humko 5000 printed corrugated box chahiye Pune mein 2 week mein' },
                { l: '☀ "50kW rooftop solar Nagpur"', t: 'Need 50 kW rooftop solar installation in Nagpur warehouse' },
                { l: '📋 "MENU"', t: 'MENU' },
                { l: '👩‍💼 "SUPPORT"', t: 'SUPPORT' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleClientNaturalLanguage(chip.t)}
                  style={{
                    flex: '0 0 auto',
                    padding: '4px 9px',
                    borderRadius: 99,
                    border: '1px solid #B8ACA0',
                    background: '#fff',
                    color: '#1F2937',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {chip.l}
                </button>
              ))}
            </div>

            {/* WhatsApp Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!clientInput.trim()) return;
                const val = clientInput;
                setClientInput('');
                void handleClientNaturalLanguage(val);
              }}
              style={{
                background: '#F0F0F0',
                padding: '8px 10px',
                borderRadius: '0 0 22px 22px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                placeholder="Type a requirement or STOP / START / SUPPORT..."
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 99,
                  border: '1px solid #D1D5DB',
                  padding: '0 14px',
                  fontSize: 12.5,
                  background: '#fff',
                  color: '#111827',
                }}
              />
              <button
                type="submit"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 0,
                  background: '#075E54',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* PHONE 2: PARTNER WHATSAPP BOT */}
        {(viewMode === 'dual' || viewMode === 'partner') && (
          <div
            style={{
              background: '#15171C',
              borderRadius: 34,
              padding: 10,
              boxShadow: '0 20px 44px -18px rgba(0,0,0,0.35)',
              border: '3px solid #2D3139',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Phone Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 16px 8px',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <span>9:41</span>
              <span
                style={{
                  background: '#000',
                  padding: '2px 12px',
                  borderRadius: 99,
                  fontSize: 10.5,
                  color: '#38BDF8',
                }}
              >
                🏭 PARTNER WHATSAPP (+91 56794 24578)
              </span>
              <span>5G · 100%</span>
            </div>

            {/* WhatsApp Top Bar */}
            <div
              style={{
                background: '#075E54',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '22px 22px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#1E3A8A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  XPO
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    XPO Partner Alerts <span style={{ color: '#34D399', fontSize: 13 }}>✔</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.88 }}>
                    Partner Bot · State: <span className="mono">{partnerWaState}</span>
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(255,255,255,0.16)',
                  padding: '3px 8px',
                  borderRadius: 99,
                  fontWeight: 700,
                }}
              >
                Klo Tech
              </span>
            </div>

            {/* WhatsApp Chat Wallpaper Area */}
            <div
              ref={partnerChatRef}
              style={{
                background: '#ECE5DD',
                height: 430,
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  alignSelf: 'center',
                  background: '#DBEAFE',
                  color: '#1E3A8A',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 8,
                  textAlign: 'center',
                  maxWidth: '92%',
                  fontWeight: 700,
                }}
              >
                ⚡ 5-Min Wave 1 Priority Window · {liveState?.partner?.credits ?? 3} Free Replies Remaining
              </div>

              {messages
                .filter((m) => m.persona === 'partner')
                .map((m) =>
                  m.sender === 'system' ? (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: 'center',
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontSize: 11.5,
                        padding: '6px 12px',
                        borderRadius: 10,
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '88%',
                        background: m.sender === 'user' ? '#DCF8C6' : '#FFFFFF',
                        color: '#111827',
                        borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {m.templateName && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#075E54',
                            marginBottom: 3,
                            textTransform: 'uppercase',
                          }}
                        >
                          Template: {m.templateName}
                        </div>
                      )}
                      {m.header && (
                        <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4, color: '#111827' }}>
                          {m.header}
                        </div>
                      )}
                      <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          color: '#6B7280',
                          marginTop: 4,
                        }}
                      >
                        <span>{m.time}</span>
                        {m.sender === 'user' && <span style={{ color: '#0284C7', fontWeight: 800 }}>✓✓</span>}
                      </div>

                      {m.buttons && m.buttons.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: '1px solid #E5E7EB',
                          }}
                        >
                          {m.buttons.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleButtonTap('partner', b.id, b.label)}
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                background:
                                  b.tone === 'primary'
                                    ? '#075E54'
                                    : b.tone === 'danger'
                                    ? '#FEE2E2'
                                    : '#F9FAFB',
                                color:
                                  b.tone === 'primary'
                                    ? '#FFFFFF'
                                    : b.tone === 'danger'
                                    ? '#991B1B'
                                    : '#075E54',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                                textAlign: 'center',
                              }}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
            </div>

            {/* Quick Partner Action Chips */}
            <div
              style={{
                background: '#E5DDD5',
                padding: '6px 10px',
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                borderTop: '1px solid #D4C8BE',
              }}
            >
              {[
                {
                  l: '✓ Send Quote ₹1.72L (10 days)',
                  run: () => handleButtonTap('partner', 'p_claim_quote', '✓ Interested · Send Quote (1 Reply)'),
                },
                {
                  l: '🤝 Accept Client Connection',
                  run: () => handleButtonTap('partner', 'p_accept_conn', '✓ Accept & Share Direct Contact'),
                },
                {
                  l: '✕ Pass Offer (0 Credits)',
                  run: () => handleButtonTap('partner', 'p_pass_offer', '✕ Pass (0 Credits)'),
                },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.run}
                  style={{
                    flex: '0 0 auto',
                    padding: '4px 9px',
                    borderRadius: 99,
                    border: '1px solid #B8ACA0',
                    background: '#fff',
                    color: '#1F2937',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {chip.l}
                </button>
              ))}
            </div>

            {/* Partner Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!partnerInput.trim()) return;
                const val = partnerInput;
                setPartnerInput('');
                appendMsg({ persona: 'partner', sender: 'user', text: val, status: 'read' });
                void handleButtonTap('partner', 'p_claim_quote', val);
              }}
              style={{
                background: '#F0F0F0',
                padding: '8px 10px',
                borderRadius: '0 0 22px 22px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={partnerInput}
                onChange={(e) => setPartnerInput(e.target.value)}
                placeholder="Type custom pitch/quote or tap quick reply..."
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 99,
                  border: '1px solid #D1D5DB',
                  padding: '0 14px',
                  fontSize: 12.5,
                  background: '#fff',
                  color: '#111827',
                }}
              />
              <button
                type="submit"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 0,
                  background: '#075E54',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* RIGHT PANEL: 18-STATE MACHINE MAP & WEBHOOK PAYLOAD LOG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 15 }}>18-State Conversation State Machine</b>
              <span className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx2)', fontSize: 11 }}>
                Live State Highlighter
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 6,
                maxHeight: 265,
                overflowY: 'auto',
              }}
            >
              {ALL_18_STATES.map((st) => {
                const isClientHere = clientWaState === st.id;
                const isPartnerHere = partnerWaState === st.id;
                return (
                  <div
                    key={st.id}
                    title={st.desc}
                    style={{
                      padding: '7px 9px',
                      borderRadius: 9,
                      border:
                        isClientHere || isPartnerHere
                          ? '2px solid #C8102E'
                          : '1px solid var(--ln)',
                      background:
                        isClientHere || isPartnerHere ? 'var(--rbg2)' : 'var(--sf2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: 10.5, fontWeight: 800 }}>
                        {st.label}
                      </span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {isClientHere && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: '#14532D',
                              color: '#fff',
                              fontWeight: 800,
                            }}
                          >
                            CLIENT
                          </span>
                        )}
                        {isPartnerHere && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: '#1E3A8A',
                              color: '#fff',
                              fontWeight: 800,
                            }}
                          >
                            PARTNER
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--tx2)', lineHeight: 1.25 }}>
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Live Webhook & Firestore Sync Event Log */}
          <section className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 15 }}>Live Meta Webhook &amp; Firestore Sync Log</b>
              <span className="mono" style={{ fontSize: 11, color: 'var(--tx3)' }}>
                X-Hub-Signature-256 ✓
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {logs.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 10,
                    background: 'var(--sf2)',
                    border: '1px solid var(--ln)',
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color:
                          l.direction === 'FIRESTORE_SYNC'
                            ? '#15803D'
                            : l.direction === 'OUTBOUND_META_API'
                            ? '#1D4ED8'
                            : '#B45309',
                      }}
                    >
                      [{l.direction}]
                    </span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--tx3)' }}>
                      {l.ts}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{l.summary}</div>
                  {l.stateFrom && l.stateTo && (
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--tx2)' }}>
                      State: {l.stateFrom} → <b>{l.stateTo}</b>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
