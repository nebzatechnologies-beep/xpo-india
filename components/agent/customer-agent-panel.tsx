'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import type {
  AgentRequirementDraft,
  CustomerAgentActionInput,
  CustomerAgentCard,
  CustomerAgentResponse,
} from '@/lib/agent/customer-agent';
import type { CustomerRole } from '@/lib/types/domain';
import {
  Bot,
  CheckCircle2,
  Clock,
  Handshake,
  Loader2,
  Lock,
  Send,
  Sparkles,
  Unlock,
} from 'lucide-react';

interface ChatTurn {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  providerUsed?: string;
  cards?: CustomerAgentCard[];
}

export function CustomerAgentPanel({
  role,
  compact = false,
  onActionCompleted,
}: {
  role: CustomerRole;
  compact?: boolean;
  onActionCompleted?: () => void;
}) {
  const initialGreeting =
    role === 'client'
      ? 'Describe the service, product, or Partner you need in plain language — I will structure your requirement, match verified Partners, and launch 5-minute alerts (100% free to post).'
      : 'Tell me the services, categories, and cities you serve to update your matching profile, or ask to check your live 5-minute lead opportunities.';

  const initialPrompts =
    role === 'client'
      ? [
          'Need 10,000 custom corrugated boxes in Mumbai within 2 weeks',
          'Show Partners who responded to my requirements',
          'Check my free Partner view credits',
        ]
      : [
          'Show my active 5-minute lead opportunities',
          'We offer CNC Turning, VMC Milling & Sheet Metal in Pune',
          'Check my remaining free lead applications',
        ];

  const [turns, setTurns] = useState<ChatTurn[]>([
    { id: 'welcome', sender: 'agent', text: initialGreeting },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [draftReq, setDraftReq] = useState<AgentRequirementDraft | null>(null);
  const [prompts, setPrompts] = useState<string[]>(initialPrompts);
  const [confirmedKeys, setConfirmedKeys] = useState<string[]>([]);
  const busyRef = useRef(false);

  async function sendTurn(opts: { message?: string; action?: CustomerAgentActionInput; userLabel?: string }) {
    if (busyRef.current) return;
    busyRef.current = true;
    const displayLabel = opts.userLabel || opts.message || '';
    if (displayLabel) {
      setTurns((prev) => [
        ...prev,
        { id: `u_${Date.now()}`, sender: 'user', text: displayLabel },
      ]);
    }
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: opts.message,
          roleOverride: role,
          action: opts.action,
          draftRequirement: draftReq,
        }),
      });
      const data = (await res.json()) as CustomerAgentResponse & { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Agent request failed');
      }

      setDraftReq(data.draftRequirement || null);
      if (data.suggestedPrompts?.length) {
        setPrompts(data.suggestedPrompts);
      }

      setTurns((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          providerUsed: data.providerUsed,
          cards: data.cards || [],
        },
      ]);

      if (opts.action && onActionCompleted) {
        onActionCompleted();
      }
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: err instanceof Error ? err.message : 'Unable to complete agent action.',
        },
      ]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      <div className="px-5 py-3.5 bg-[#111827] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#E8192C] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </span>
          <div>
            <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
              XPO {role === 'client' ? 'Client' : 'Partner'} Agent
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[10px] text-gray-300">
              Conversational intake, instant matching & 1-click actions
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-gray-200">
          Zero Modals
        </span>
      </div>

      <div
        className={`p-4 space-y-3 overflow-y-auto bg-[#F8F9FA] ${
          compact ? 'max-h-[340px]' : 'max-h-[460px]'
        }`}
      >
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${turn.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                turn.sender === 'user'
                  ? 'bg-[#111827] text-white font-medium'
                  : 'bg-white text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              <div>{turn.text}</div>
            </div>

            {turn.cards && turn.cards.length > 0 && (
              <div className="mt-2 w-full max-w-[92%] space-y-2">
                {turn.cards.map((card, i) => {
                  const draftKey =
                    card.type === 'requirement_draft'
                      ? `${card.draft.title}_${card.draft.categoryId}`
                      : '';
                  const isConfirmed = Boolean(draftKey && confirmedKeys.includes(draftKey));
                  return (
                    <AgentCardRenderer
                      key={`${turn.id}_card_${i}`}
                      card={card}
                      busy={busy}
                      isConfirmed={isConfirmed}
                      onAction={(action, label) => {
                        if (action.type === 'confirm_requirement' && draftKey) {
                          setConfirmedKeys((prev) => [...prev, draftKey]);
                        }
                        void sendTurn({ action, userLabel: label });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="text-[11px] text-[#6B7280] font-medium px-1">
            XPO Agent is working...
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-white border-t border-[#F3F4F6] flex flex-wrap gap-1.5">
        {prompts.slice(0, 3).map((p) => (
          <button
            key={p}
            type="button"
            disabled={busy}
            onClick={() => void sendTurn({ message: p })}
            className="px-2.5 py-1 rounded-full bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] text-[11px] font-medium text-[#374151] transition-colors truncate max-w-full"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) void sendTurn({ message: input.trim() });
        }}
        className="p-3 bg-white border-t border-[#E5E7EB] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            role === 'client'
              ? 'Describe what you need or ask to review responded Partners...'
              : 'Describe your services/locations or ask for live 5-minute leads...'
          }
          className="flex-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs focus:outline-none focus:border-[#111827]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white text-xs font-bold disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

function AgentCardRenderer({
  card,
  busy,
  isConfirmed = false,
  onAction,
}: {
  card: CustomerAgentCard;
  busy: boolean;
  isConfirmed?: boolean;
  onAction: (action: CustomerAgentActionInput, label: string) => void;
}) {
  if (card.type === 'requirement_draft') {
    const d = card.draft;
    return (
      <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2.5 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-[#111827]">Structured Requirement Draft</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            100% Free to Post
          </span>
        </div>
        <div className="space-y-1 text-[#374151]">
          <div>
            <strong>Title:</strong> {d.title}
          </div>
          <div>
            <strong>Category:</strong> {d.categoryName}
            {d.subcategoryName ? ` › ${d.subcategoryName}` : ''}
          </div>
          <div>
            <strong>Location:</strong> {d.workLocation} • <strong>Timeline:</strong> {d.timeline}
          </div>
          <div>
            <strong>Budget:</strong> {d.estimatedBudget || 'To be discussed'}
          </div>
        </div>
        <div className="pt-1 flex flex-wrap gap-2">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Requirement Confirmed & Matching Started ✓
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onAction(
                  { type: 'confirm_requirement', payload: d as unknown as Record<string, unknown> },
                  'Confirm & publish requirement'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8192C] text-white font-bold text-xs hover:bg-[#c81324] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Confirm & Start 5-Min Matching</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (card.type === 'requirement_posted') {
    return (
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-xs">
        <div className="font-extrabold text-emerald-900">
          {card.xpoCode} — {card.title}
        </div>
        <div className="text-emerald-800">
          Matched <strong>{card.matchedCount}</strong> Partners • Dispatched{' '}
          <strong>{card.dispatchedOffersCount}</strong> live 5-minute WhatsApp offers.
        </div>
        <Link
          href="/dashboard/client/requirements"
          className="inline-block font-bold text-[#111827] underline pt-1"
        >
          Open My Requirements →
        </Link>
      </div>
    );
  }

  if (card.type === 'responded_partners') {
    return (
      <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-[#111827]">
            Interested Partners ({card.claims.length})
          </span>
          <span className="text-[11px] font-semibold text-[#6B7280]">
            {card.unlimitedViews
              ? 'Unlimited Views Active'
              : `Free Views: ${card.freeViewsRemaining} | Plan: ${card.paidViewsRemaining}`}
          </span>
        </div>
        {card.claims.slice(0, 4).map((clm) => (
          <div
            key={clm.id}
            className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-[#111827]">
                {clm.unlockedByClient ? clm.partnerBusinessName : '🔒 Verified XPO Partner'} (
                {clm.partnerCity})
              </div>
              <div className="text-[11px] text-[#6B7280]">{clm.xpoCode}</div>
            </div>
            {!clm.unlockedByClient ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(
                    { type: 'unlock_claim', payload: { claimId: clm.id } },
                    `Unlock Partner profile for ${clm.xpoCode}`
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111827] text-white font-bold text-[11px] disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                <span>Unlock (1 Credit)</span>
              </button>
            ) : !clm.connectionId ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(
                    { type: 'request_connection', payload: { claimId: clm.id } },
                    `Request connection with ${clm.partnerBusinessName}`
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8192C] text-white font-bold text-[11px] disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Handshake className="w-3 h-3" />}
                <span>Connect</span>
              </button>
            ) : (
              <Link
                href="/dashboard/connections"
                className="text-[11px] font-bold text-emerald-700 underline"
              >
                View Connection
              </Link>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (card.type === 'partner_unlocked') {
    const clm = card.claim;
    return (
      <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
        <div className="font-extrabold text-[#111827]">
          🔓 {clm.partnerBusinessName} ({clm.partnerCity})
        </div>
        {clm.capabilityNote && <div className="text-[#374151]">{clm.capabilityNote}</div>}
        {!clm.connectionId && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onAction(
                { type: 'request_connection', payload: { claimId: clm.id } },
                `Request mutual connection with ${clm.partnerBusinessName}`
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E8192C] text-white font-bold text-[11px] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Handshake className="w-3.5 h-3.5" />
            )}
            <span>Request Mutual Connection</span>
          </button>
        )}
      </div>
    );
  }

  if (card.type === 'live_offers') {
    if (card.offers.length === 0) return null;
    return (
      <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2 text-xs">
        <div className="font-extrabold text-[#111827]">Live 5-Minute Lead Alerts</div>
        {card.offers.map((o) => (
          <div
            key={o.id}
            className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-[#111827]">
                {o.xpoCode} • Round {o.round}
              </div>
              <div className="text-[11px] text-[#E8192C] inline-flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3" /> Expires {new Date(o.expiresAt).toLocaleTimeString()}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(
                    { type: 'claim_offer', payload: { offerId: o.id } },
                    `Express interest in ${o.xpoCode}`
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>I&apos;m Interested</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(
                    { type: 'decline_offer', payload: { offerId: o.id } },
                    `Decline ${o.xpoCode}`
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-[#374151] font-semibold text-[11px] disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Pass</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (card.type === 'subscription_required') {
    return (
      <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#111827]">
          <Lock className="w-3.5 h-3.5 text-[#E8192C]" />
          {card.role === 'partner' ? 'Partner Plan Required' : 'Client Plan Required'} (
          {card.priceLabel})
        </div>
        <p className="text-[#374151]">{card.reason}</p>
        <a
          href={card.checkoutUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8192C] text-white font-bold text-xs"
        >
          Activate Plan ({card.allowanceLabel}) →
        </a>
      </div>
    );
  }

  if (card.type === 'partner_profile_updated') {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
        <div className="font-extrabold text-emerald-900">Partner Matching Profile Updated</div>
        <div className="text-emerald-800">
          <strong>Categories:</strong> {card.categoryNames.join(', ')} •{' '}
          <strong>Services:</strong> {card.servicesOffered.join(', ')}
        </div>
      </div>
    );
  }

  if (card.type === 'entitlement_summary') {
    return (
      <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] text-xs flex items-center justify-between">
        <div>
          <div className="font-bold text-[#111827]">
            {card.role === 'client' ? 'Partner Profile View Credits' : 'Lead Application Credits'}
          </div>
          <div className="text-[#6B7280] mt-0.5">
            Free Starter Left: <strong>{card.freeRemaining}</strong> • Monthly Plan:{' '}
            <strong>{card.unlimited ? 'Unlimited' : card.paidRemaining}</strong>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="px-3 py-1.5 rounded-lg bg-[#111827] text-white font-bold text-[11px]"
        >
          Manage Plan
        </Link>
      </div>
    );
  }

  return null;
}
