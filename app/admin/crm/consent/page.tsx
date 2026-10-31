'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { ConsentStatus, WhatsAppConsentRecord } from '@/lib/types/domain';

export default function AdminCrmConsentPage() {
  const [records, setRecords] = useState<WhatsAppConsentRecord[]>([]);
  const [suppressed, setSuppressed] = useState<Array<{ phoneE164: string; reason?: string }>>([]);
  const [phoneE164, setPhoneE164] = useState('');
  const [newStatus, setNewStatus] = useState<ConsentStatus>('opted_in');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/crm/consent');
    if (res.ok) {
      const d = await res.json();
      setRecords(d.records || []);
      setSuppressed(d.suppressed || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recordManualConsent(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/crm/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneE164, newStatus, evidenceNote }),
    });
    if (res.ok) {
      setPhoneE164('');
      setEvidenceNote('');
      setMsg('Consent ledger & suppression list updated.');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          WhatsApp Consent Audit & Suppression List
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          STOP / UNSUBSCRIBE keywords immediately add numbers to the active suppression list so no
          outbound marketing or alert templates are sent.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <form
        onSubmit={recordManualConsent}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-5 grid grid-cols-1 sm:grid-cols-4 gap-3"
      >
        <input
          type="tel"
          required
          placeholder="+919876543210"
          value={phoneE164}
          onChange={(e) => setPhoneE164(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as ConsentStatus)}
          className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
        >
          <option value="opted_in">Opted In</option>
          <option value="opted_out">Opted Out (Suppress)</option>
          <option value="consent_pending">Consent Pending</option>
        </select>
        <input
          type="text"
          required
          placeholder="Written consent / opt-out evidence note"
          value={evidenceNote}
          onChange={(e) => setEvidenceNote(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold"
        >
          Record Consent Event
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-bold mb-3">
            Active Suppressed Phone Numbers ({suppressed.length})
          </h2>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {suppressed.map((s) => (
              <div key={s.phoneE164} className="py-2 flex justify-between">
                <span className="font-mono font-bold text-red-700">{s.phoneE164}</span>
                <span className="text-[#6B7280]">{s.reason || 'STOP / Opt-Out'}</span>
              </div>
            ))}
            {suppressed.length === 0 && (
              <p className="text-[#6B7280]">Zero suppressed phone numbers.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-bold mb-3">Recent Consent Audit Trail ({records.length})</h2>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {records.map((r) => (
              <div key={r.id} className="py-2">
                <div className="flex justify-between font-bold">
                  <span className="font-mono">{r.phoneE164}</span>
                  <span>
                    {r.previousStatus} → {r.newStatus}
                  </span>
                </div>
                <div className="text-[#6B7280] text-[11px]">
                  {r.channel} • {r.evidenceNote}
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="text-[#6B7280]">No consent events logged yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
