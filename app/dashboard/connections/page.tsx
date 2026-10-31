'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { MutualConnection } from '@/lib/types/domain';
import { CheckCircle2, XCircle, Phone, Mail, Lock, MessageSquare, Loader2 } from 'lucide-react';

export default function MutualConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<MutualConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/connections');
      if (res.ok) {
        const d = await res.json();
        setConnections(d.connections || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(id: string, decision: 'accepted' | 'declined') {
    try {
      setBusyId(id);
      setMsg(null);
      const res = await fetch(`/api/connections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Unable to update connection');
      setMsg(
        decision === 'accepted'
          ? 'Mutual consent granted! Direct WhatsApp & phone contacts are now unlocked for both parties.'
          : 'Connection declined. Contact details remain strictly masked.'
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Connections</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Direct phone numbers, WhatsApp links, and email addresses unlock strictly after both parties confirm mutual consent.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
          Loading mutual connections...
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
          <Lock className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#111827]">No mutual connection requests yet</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Unlock an interested Partner profile and request a connection to discuss pricing,
            timelines, and delivery directly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => {
            const isRecipient = user?.uid === conn.recipientUid;
            const counterpartContact =
              user?.uid === conn.initiatorUid
                ? conn.releasedRecipientContact
                : conn.releasedInitiatorContact;

            return (
              <div key={conn.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[11px] font-mono font-bold">
                      {conn.sourceCode}
                    </span>
                    <span className="text-xs font-semibold uppercase text-[#6B7280]">
                      {conn.marketplaceType}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      conn.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700'
                        : conn.status === 'declined'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>

                <h2 className="mt-3 text-base font-extrabold text-[#111827]">{conn.sourceTitle}</h2>

                {conn.status === 'pending' && isRecipient && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId === conn.id}
                      onClick={() => void respond(conn.id, 'accepted')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {busyId === conn.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{busyId === conn.id ? 'Accepting...' : 'Accept & Share Direct Contact'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === conn.id}
                      onClick={() => void respond(conn.id, 'declined')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] disabled:opacity-50"
                    >
                      {busyId === conn.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>{busyId === conn.id ? 'Declining...' : 'Decline'}</span>
                    </button>
                  </div>
                )}

                {conn.status === 'pending' && !isRecipient && (
                  <p className="mt-2 text-xs text-amber-800">
                    Awaiting counterpart confirmation via WhatsApp or Web.
                  </p>
                )}

                {conn.status === 'declined' && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50/60 border border-red-100 text-xs text-red-700 font-medium">
                    This mutual contact exchange request was declined. Direct phone and email remain private.
                  </div>
                )}

                {conn.status === 'accepted' && counterpartContact && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="text-xs font-bold text-emerald-900">
                      Unlocked Direct Counterpart Contact
                    </div>
                    <div className="text-sm font-extrabold text-[#111827]">
                      {counterpartContact.name}{' '}
                      {counterpartContact.companyName ? `— ${counterpartContact.companyName}` : ''}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[#374151]">
                      <a
                        href={`tel:${counterpartContact.phoneE164}`}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> {counterpartContact.phoneE164}
                      </a>
                      <a
                        href={`https://wa.me/${counterpartContact.phoneE164.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat on WhatsApp
                      </a>
                      {counterpartContact.email && (
                        <a
                          href={`mailto:${counterpartContact.email}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" /> {counterpartContact.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
