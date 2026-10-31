'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { WhatsAppMessageRecord, WhatsAppSession } from '@/lib/types/domain';
import { Send, UserCheck, Bot, Loader2 } from 'lucide-react';

export default function AdminWhatsAppInboxPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [togglingTakeover, setTogglingTakeover] = useState(false);

  const loadSessions = useCallback(async () => {
    const res = await fetch('/api/admin/whatsapp/inbox');
    if (res.ok) {
      const d = await res.json();
      setSessions(d.sessions || []);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function openSession(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/admin/whatsapp/inbox?sessionId=${encodeURIComponent(id)}`);
    if (res.ok) {
      const d = await res.json();
      setActiveSession(d.session);
      setMessages(d.messages || []);
    }
  }

  async function toggleTakeover(humanTakeover: boolean) {
    if (!selectedId) return;
    try {
      setTogglingTakeover(true);
      const res = await fetch('/api/admin/whatsapp/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_takeover', sessionId: selectedId, humanTakeover }),
      });
      if (res.ok) {
        await openSession(selectedId);
        await loadSessions();
      }
    } finally {
      setTogglingTakeover(false);
    }
  }

  async function sendCoordinatorReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;
    try {
      setSending(true);
      const res = await fetch('/api/admin/whatsapp/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reply',
          sessionId: selectedId,
          text: replyText.trim(),
        }),
      });
      if (res.ok) {
        setReplyText('');
        await openSession(selectedId);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Live WhatsApp Support & Human Takeover Inbox
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Monitor live 18-state conversations, pause automation on SUPPORT_REVIEW escalations, and
          reply as an XPO Coordinator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[540px]">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 overflow-y-auto space-y-2">
          <div className="text-xs font-bold text-[#6B7280] mb-2">
            Conversations ({sessions.length})
          </div>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void openSession(s.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                selectedId === s.id
                  ? 'border-[#111827] bg-gray-50 font-semibold'
                  : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="font-mono">{s.phoneE164}</span>
                {s.humanTakeover && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">
                    HUMAN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                State: <strong>{s.state}</strong> • Role: {s.selectedRole || 'Unset'}
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-[#6B7280] py-6">No live customer WhatsApp sessions yet.</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col justify-between">
          {!activeSession ? (
            <div className="my-auto text-center text-xs text-[#6B7280]">
              Select a WhatsApp session on the left to inspect messages or enable Human Takeover.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                <div className="text-xs">
                  <span className="font-mono font-extrabold text-sm">
                    {activeSession.phoneE164}
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-bold">
                    {activeSession.state}
                  </span>
                </div>

                {activeSession.humanTakeover ? (
                  <button
                    type="button"
                    disabled={togglingTakeover}
                    onClick={() => void toggleTakeover(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {togglingTakeover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                    <span>{togglingTakeover ? 'Resuming...' : 'Resume Bot Automation'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={togglingTakeover}
                    onClick={() => void toggleTakeover(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {togglingTakeover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{togglingTakeover ? 'Pausing Bot...' : 'Take Over (Pause Bot)'}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-2.5 max-h-[380px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] p-3 rounded-2xl text-xs whitespace-pre-line ${
                      m.direction === 'outbound'
                        ? 'ml-auto bg-emerald-50 border border-emerald-200 text-[#111827]'
                        : 'bg-[#F3F4F6] text-[#111827]'
                    }`}
                  >
                    <div>{m.body}</div>
                    <div className="text-[10px] text-[#6B7280] mt-1">
                      {m.direction} • {m.deliveryStatus}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendCoordinatorReply} className="pt-3 border-t border-[#E5E7EB] flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Send manual coordinator message via Meta Cloud API..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{sending ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
