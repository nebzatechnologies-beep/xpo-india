'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  WhatsAppLeadOffer,
  WhatsAppMessageRecord,
  WhatsAppSession,
} from '@/lib/types/domain';
import { Send, RotateCcw, FastForward } from 'lucide-react';

export default function AdminWhatsAppSimulatorPage() {
  const [phoneE164, setPhoneE164] = useState('+919900000001');
  const [profileName, setProfileName] = useState('Aarav Test');
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [simOffers, setSimOffers] = useState<WhatsAppLeadOffer[]>([]);
  const [textInput, setTextInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/whatsapp/simulator?phoneE164=${encodeURIComponent(phoneE164)}`
    );
    if (res.ok) {
      const d = await res.json();
      setSession(d.session || null);
      setMessages(d.messages || []);
      setSimOffers(d.simulatedOffers || []);
    }
  }, [phoneE164]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendSimulatedInbound(opts: {
    textBody?: string;
    buttonReplyId?: string;
    buttonReplyTitle?: string;
  }) {
    try {
      setBusy(true);
      const res = await fetch('/api/admin/whatsapp/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_inbound',
          phoneE164,
          profileName,
          ...opts,
        }),
      });
      if (res.ok) {
        setTextInput('');
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function resetSession() {
    setBusy(true);
    await fetch('/api/admin/whatsapp/simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_session', phoneE164 }),
    });
    setBusy(false);
    await load();
  }

  async function fastForwardExpiry(offerId: string) {
    setBusy(true);
    await fetch('/api/admin/whatsapp/simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fast_forward_expiry', offerId }),
    });
    setBusy(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">
            Firestore-Backed WhatsApp Conversation Simulator
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Executes the exact production 18-state conversation engine & matching logic in Cloud
            Firestore (`isSimulated: true`, strictly excluded from commercial KPIs — Report 2 Sec
            21).
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void resetSession()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-white text-xs font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Simulated Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col min-h-[540px]">
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#E5E7EB] text-xs">
            <input
              type="text"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#D1D5DB] font-mono font-bold"
              placeholder="+919900000001"
            />
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#D1D5DB]"
              placeholder="WhatsApp Profile Name"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[380px]">
            {messages.length === 0 && (
              <div className="text-center py-12 text-xs text-[#6B7280]">
                Send <strong>Hi</strong>, <strong>MENU</strong>, <strong>SUPPORT</strong>, or{' '}
                <strong>STOP</strong> to test the live conversation engine.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs whitespace-pre-line ${
                  m.direction === 'inbound'
                    ? 'ml-auto bg-emerald-600 text-white'
                    : 'bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB]'
                }`}
              >
                <div>{m.body}</div>
                {m.interactiveOptions && m.interactiveOptions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.interactiveOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void sendSimulatedInbound({
                            buttonReplyId: opt.id,
                            buttonReplyTitle: opt.title,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-white text-[#111827] border border-gray-300 font-bold text-[11px] hover:bg-gray-50"
                      >
                        {opt.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) void sendSimulatedInbound({ textBody: textInput.trim() });
            }}
            className="pt-3 border-t border-[#E5E7EB] flex gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type Hi, MENU, STOP, START, SUPPORT or answer current prompt..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-xs space-y-2">
            <h2 className="font-extrabold text-sm text-[#111827]">Live Session Inspector</h2>
            <div>
              State:{' '}
              <span className="px-2 py-0.5 rounded bg-gray-100 text-[#111827] font-bold">
                {session?.state || 'NEW_CONTACT'}
              </span>
            </div>
            <div>Selected Role: {session?.selectedRole || 'None'}</div>
            <div>Current Step: {session?.workflowStepKey || 'None'}</div>
            <div className="pt-2">
              <div className="font-bold text-[#6B7280] mb-1">Draft Data JSON</div>
              <pre className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] overflow-x-auto text-[11px]">
                {JSON.stringify(session?.draftData || {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-xs space-y-2">
            <h2 className="font-extrabold text-sm text-[#111827]">
              Simulated 5-Min Lead Offers ({simOffers.length})
            </h2>
            {simOffers.map((o) => (
              <div key={o.id} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="font-bold">
                  {o.xpoCode} • Round {o.round} ({o.status})
                </div>
                <div className="text-[#6B7280]">{o.partnerPhoneE164}</div>
                {['dispatched', 'delivered'].includes(o.status) && (
                  <button
                    type="button"
                    onClick={() => void fastForwardExpiry(o.id)}
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px]"
                  >
                    <FastForward className="w-3 h-3" /> Fast-Forward 5-Min Expiry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
