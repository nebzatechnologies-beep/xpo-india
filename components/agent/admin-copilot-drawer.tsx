'use client';

import React, { useState } from 'react';
import type { AdminCopilotCard, AdminCopilotResponse } from '@/lib/agent/admin-copilot';
import { Bot, CheckCircle2, Send, Sparkles, X } from 'lucide-react';

interface CopilotTurn {
  id: string;
  sender: 'admin' | 'agent';
  text: string;
  cards?: AdminCopilotCard[];
}

export function AdminCopilotDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [turns, setTurns] = useState<CopilotTurn[]>([
    {
      id: 'init',
      sender: 'agent',
      text: 'Ask for live funnel & revenue stats across your Client Database and Partner Database, or stage bulk WhatsApp invitations for opted-in contacts.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([
    'Give me a full XPO funnel & revenue summary',
    'Preview bulk WhatsApp invitations for opted-in Partners',
    'Preview bulk WhatsApp invitations for opted-in Clients',
  ]);

  if (!isOpen) return null;

  async function sendTurn(opts: {
    message?: string;
    confirmAction?: {
      type: 'launch_invitations';
      databaseType: 'client' | 'partner';
      templateId: string;
      city?: string | null;
    };
    adminLabel?: string;
  }) {
    if (busy) return;
    const label = opts.adminLabel || opts.message || '';
    if (label) {
      setTurns((prev) => [...prev, { id: `u_${Date.now()}`, sender: 'admin', text: label }]);
    }
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/admin/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: opts.message,
          confirmAction: opts.confirmAction,
        }),
      });
      const data = (await res.json()) as AdminCopilotResponse & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Agent query failed');
      }
      if (data.suggestedPrompts?.length) setPrompts(data.suggestedPrompts);
      setTurns((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          cards: data.cards || [],
        },
      ]);
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: err instanceof Error ? err.message : 'Agent request failed',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="w-full lg:w-96 bg-white border-l border-[#E5E7EB] shrink-0 flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-20 shadow-sm">
      <div className="px-4 py-3 bg-[#111827] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#E8192C] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </span>
          <div>
            <div className="text-xs font-extrabold flex items-center gap-1">
              XPO Superadmin Agent <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-[10px] text-gray-300">
              Live database queries & consent-safe invitations
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
          aria-label="Close Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
        {turns.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col ${t.sender === 'admin' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                t.sender === 'admin'
                  ? 'bg-[#111827] text-white font-medium'
                  : 'bg-white text-[#111827] border border-[#E5E7EB]'
              }`}
            >
              {t.text}
            </div>

            {t.cards?.map((card, idx) => (
              <div key={`${t.id}_c_${idx}`} className="mt-2 w-full">
                {card.type === 'operations_snapshot' && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#6B7280] block">Client DB</span>
                      <strong className="text-[#111827]">{card.metrics.clientDbTotal}</strong> (
                      {card.metrics.clientDbOptedInUninvited} ready)
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Partner DB</span>
                      <strong className="text-[#111827]">{card.metrics.partnerDbTotal}</strong> (
                      {card.metrics.partnerDbOptedInUninvited} ready)
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Registered</span>
                      <strong className="text-[#111827]">
                        {card.metrics.registeredClients}C / {card.metrics.registeredPartners}P
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Unlocks / Conns</span>
                      <strong className="text-[#111827]">
                        {card.metrics.candidateUnlocks} / {card.metrics.acceptedConnections}
                      </strong>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Active Plans & Revenue: </span>
                      <strong className="text-emerald-700">
                        {card.metrics.activeClientPlans + card.metrics.activePartnerPlans} plans • ₹
                        {card.metrics.revenueInr.toLocaleString('en-IN')} / $
                        {card.metrics.revenueUsd.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}

                {card.type === 'invitation_preview' && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2 text-xs">
                    <div className="font-extrabold text-[#111827]">
                      {card.databaseType === 'client' ? 'Client' : 'Partner'} Invitation Preview
                    </div>
                    <div className="text-[11px] text-[#374151] space-y-0.5">
                      <div>
                        Template: <strong className="font-mono">{card.templateName}</strong>
                      </div>
                      <div>
                        Opted-In Eligible: <strong>{card.eligibleCount}</strong> (Skipped:{' '}
                        {card.suppressedOrUnconsentedCount})
                      </div>
                      <div>
                        Est. Meta Cost: <strong>₹{card.estimatedCostInr}</strong>
                      </div>
                    </div>
                    {card.eligibleCount > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void sendTurn({
                            confirmAction: {
                              type: 'launch_invitations',
                              databaseType: card.databaseType,
                              templateId: card.templateId,
                              city: card.city,
                            },
                            adminLabel: `Confirm & dispatch ${card.eligibleCount} ${card.databaseType} invitations`,
                          })
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8192C] text-white font-bold text-xs hover:bg-[#c81324]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Dispatch Invitations
                      </button>
                    )}
                  </div>
                )}

                {card.type === 'invitation_dispatched' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <strong>{card.campaignName}</strong>: {card.sentCount} sent, {card.failedCount}{' '}
                    failed.
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-2.5 bg-white border-t border-[#F3F4F6] flex flex-wrap gap-1.5">
        {prompts.slice(0, 2).map((p) => (
          <button
            key={p}
            type="button"
            disabled={busy}
            onClick={() => void sendTurn({ message: p })}
            className="px-2.5 py-1 rounded-full bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] text-[10px] font-medium text-[#374151] truncate max-w-full"
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
          placeholder="Ask XPO Agent..."
          className="flex-1 px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="p-2 rounded-xl bg-[#111827] text-white disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
