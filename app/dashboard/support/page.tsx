'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SupportTicket, SupportTicketType } from '@/lib/types/domain';
import { ShieldAlert, Lock, CheckCircle2, Loader2 } from 'lucide-react';

export default function SupportAndPrivacyPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [type, setType] = useState<SupportTicketType>('whatsapp_support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const [dpdpType, setDpdpType] = useState<'dpdp_data_correction' | 'dpdp_account_deletion'>(
    'dpdp_data_correction'
  );
  const [dpdpDetails, setDpdpDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const d = await res.json();
        setTickets(d.tickets || []);
      }
    } catch {
      // Ignore initial background fetch error
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to submit ticket');
      setSubject('');
      setDescription('');
      setSuccessMsg('Support / Moderation report logged and routed to XPO Trust & Safety.');
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDpdpRequest(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: dpdpType,
          details: dpdpDetails.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to submit DPDP request');
      setDpdpDetails('');
      setSuccessMsg('Statutory DPDP Act privacy request registered with immutable audit trail.');
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Trust & Safety Support + DPDP Privacy Rights
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Report spam, fake requirements, or suspicious activity — or exercise your Digital Personal
          Data Protection (DPDP) Act rights.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form
          onSubmit={submitTicket}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#E8192C]" />
            <h2 className="text-sm font-bold text-[#111827]">Report Issue or Abuse</h2>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Issue Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SupportTicketType)}
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
            >
              <option value="whatsapp_support">General / WhatsApp Support</option>
              <option value="fake_requirement">Fake or Unserious Requirement</option>
              <option value="inappropriate_conduct">Inappropriate Conduct</option>
              <option value="fraudulent_profile">Fraudulent Profile</option>
              <option value="unauthorized_contact_sharing">Unauthorized Contact Sharing</option>
              <option value="spam">Spam / Harassment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Subject *</label>
            <input
              type="text"
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., XPO-REQ-10421 contains invalid specs"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Details *</label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide reference code and relevant context..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit Support / Safety Ticket'}</span>
          </button>
        </form>

        <form
          onSubmit={submitDpdpRequest}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-[#111827]">
              Statutory DPDP Data & Account Rights
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Statutory Action</label>
            <select
              value={dpdpType}
              onChange={(e) => setDpdpType(e.target.value as typeof dpdpType)}
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
            >
              <option value="dpdp_data_correction">Personal Data Correction Request</option>
              <option value="dpdp_account_deletion">
                Account & PII Erasure / Suppression Request
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Details / Instructions *</label>
            <textarea
              required
              minLength={5}
              rows={4}
              value={dpdpDetails}
              onChange={(e) => setDpdpDetails(e.target.value)}
              placeholder="Specify fields to correct or confirm permanent account PII deletion..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit Statutory DPDP Request'}</span>
          </button>
        </form>
      </div>

      {tickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-sm font-bold text-[#111827] mb-3">Your Submitted Requests</h2>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {tickets.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold">{t.subject}</span>
                  <div className="text-[#6B7280] mt-0.5">
                    {t.type.replace(/_/g, ' ')} • {new Date(t.createdAt).toLocaleDateString()}
                    {t.resolutionDecision ? ` • Resolution: ${t.resolutionDecision}` : ''}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] font-semibold capitalize">
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
