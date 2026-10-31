'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SupportTicket, VerificationRequest } from '@/lib/types/domain';
import { ShieldCheck, XCircle, Trash2, Loader2, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

export default function AdminVerificationAndPrivacyPage() {
  const [kycRequests, setKycRequests] = useState<VerificationRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Unified view controls: Dropdown for Queue Type & Sub-tabs for Pending vs Signed
  const [queueType, setQueueType] = useState<'kyc' | 'tickets'>('kyc');
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/verification');
      if (res.ok) {
        const d = await res.json();
        setKycRequests(d.verificationRequests || []);
        setTickets(d.supportTickets || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reviewKyc(requestId: string, decision: 'verified' | 'rejected' | 'expired') {
    try {
      setBusyId(requestId);
      setMsg(null);
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_kyc',
          requestId,
          decision,
          reviewNotes: `Reviewed by Superadmin (${decision})`,
        }),
      });
      if (!res.ok) throw new Error('KYC review failed');
      setMsg(`KYC request marked ${decision}.`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  async function resolveTicket(
    ticket: SupportTicket,
    opts: { status: 'resolved' | 'dismissed'; approveDpdpDeletion?: boolean }
  ) {
    try {
      setBusyId(ticket.id);
      setMsg(null);
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_ticket',
          ticketId: ticket.id,
          status: opts.status,
          resolutionDecision: opts.approveDpdpDeletion
            ? 'Statutory DPDP PII erasure & phone suppression executed'
            : `Marked ${opts.status} by Trust & Safety`,
          approveDpdpDeletion: opts.approveDpdpDeletion,
        }),
      });
      if (!res.ok) throw new Error('Ticket resolution failed');
      setMsg('Ticket resolved and logged to immutable audit trail.');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Resolution failed');
    } finally {
      setBusyId(null);
    }
  }

  // Filter items by status
  const pendingKyc = kycRequests.filter(
    (r) => r.status === 'verification_pending' || r.status === 'unverified'
  );
  const signedKyc = kycRequests.filter(
    (r) => r.status === 'verified' || r.status === 'rejected' || r.status === 'expired'
  );

  const pendingTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_review'
  );
  const signedTickets = tickets.filter(
    (t) => t.status === 'resolved' || t.status === 'dismissed'
  );

  const pendingCount = queueType === 'kyc' ? pendingKyc.length : pendingTickets.length;
  const signedCount = queueType === 'kyc' ? signedKyc.length : signedTickets.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          KYC Verification, Fraud Moderation & DPDP Privacy Queue
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Manual review for Verified Trust Badges, abuse reports, and statutory DPDP Act PII
          erasure requests.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      {/* Unified Queue Card with Dropdown and Sub-tabs */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="queue-select" className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Select Queue:
            </label>
            <div className="relative">
              <select
                id="queue-select"
                value={queueType}
                onChange={(e) => setQueueType(e.target.value as 'kyc' | 'tickets')}
                className="appearance-none pl-3.5 pr-9 py-2 rounded-xl bg-white border border-[#D1D5DB] text-xs font-bold text-[#111827] shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C] transition-all cursor-pointer"
              >
                <option value="kyc">
                  KYC Verification Requests ({kycRequests.length})
                </option>
                <option value="tickets">
                  Abuse & DPDP Privacy Tickets ({tickets.length})
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sub-tabs: Pending Queue vs Verified */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signed')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'signed'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{queueType === 'kyc' ? 'Verified' : 'Resolved'} ({signedCount})</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[#6B7280] py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#E8192C]" />
              <span>Loading queue submissions...</span>
            </div>
          ) : queueType === 'kyc' ? (
            /* KYC Queue Display */
            activeTab === 'pending' ? (
              pendingKyc.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-[#6B7280]">
                    No pending KYC verification requests waiting for review.
                  </p>
                  {signedKyc.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('signed')}
                      className="mt-2 text-xs font-semibold text-[#E8192C] hover:underline"
                    >
                      View {signedKyc.length} verified record{signedKyc.length === 1 ? '' : 's'} →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingKyc.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-sm text-[#111827]">
                          {r.applicantName} {r.companyName ? `— ${r.companyName}` : ''}
                        </div>
                        <div className="text-[#6B7280]">
                          Role: <strong className="uppercase">{r.role}</strong> • Doc:{' '}
                          {r.documentType.replace(/_/g, ' ')} • ID: {r.documentNumber || 'N/A'} • Status:{' '}
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold capitalize">
                            {r.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {r.storagePaths.length > 0 && (
                          <div className="font-mono text-[11px] text-[#374151]">
                            Storage Vault: {r.storagePaths.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void reviewKyc(r.id, 'verified')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{busyId === r.id ? 'Verifying...' : 'Grant Verified Badge'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void reviewKyc(r.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{busyId === r.id ? 'Rejecting...' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* KYC Verified Tab */
              signedKyc.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-8">
                  No verified KYC records yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {signedKyc.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-sm text-[#111827]">
                          {r.applicantName} {r.companyName ? `— ${r.companyName}` : ''}
                        </div>
                        <div className="text-[#6B7280]">
                          Role: <strong className="uppercase">{r.role}</strong> • Doc:{' '}
                          {r.documentType.replace(/_/g, ' ')} • ID: {r.documentNumber || 'N/A'} • Status:{' '}
                          <strong className="capitalize">{r.status.replace(/_/g, ' ')}</strong>
                        </div>
                        {r.storagePaths.length > 0 && (
                          <div className="font-mono text-[11px] text-[#374151]">
                            Storage Vault: {r.storagePaths.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {r.status === 'verified' ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                            </span>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => void reviewKyc(r.id, 'rejected')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold disabled:opacity-50 transition-colors"
                            >
                              {busyId === r.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Revoke / Reject</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-bold">
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
                            </span>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => void reviewKyc(r.id, 'verified')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                            >
                              {busyId === r.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Re-verify & Grant</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          ) : (
            /* Tickets Queue Display */
            activeTab === 'pending' ? (
              pendingTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-[#6B7280]">
                    No open support or DPDP privacy tickets waiting for review.
                  </p>
                  {signedTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('signed')}
                      className="mt-2 text-xs font-semibold text-[#E8192C] hover:underline"
                    >
                      View {signedTickets.length} resolved ticket{signedTickets.length === 1 ? '' : 's'} →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-sm text-[#111827]">{t.subject}</div>
                        <div className="text-[#6B7280]">
                          Type: <strong>{t.type.replace(/_/g, ' ')}</strong> • Reporter:{' '}
                          {t.reporterPhoneE164 || t.reporterUid} • Status:{' '}
                          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold capitalize">
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[#374151]">{t.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {t.type === 'dpdp_account_deletion' && (
                          <button
                            type="button"
                            disabled={busyId === t.id}
                            onClick={() =>
                              void resolveTicket(t, { status: 'resolved', approveDpdpDeletion: true })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                          >
                            {busyId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>{busyId === t.id ? 'Erasing...' : 'Execute DPDP Erasure'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === t.id}
                          onClick={() => void resolveTicket(t, { status: 'resolved' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                        >
                          {busyId === t.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{busyId === t.id ? 'Resolving...' : 'Mark Resolved'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={busyId === t.id}
                          onClick={() => void resolveTicket(t, { status: 'dismissed' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D1D5DB] hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          {busyId === t.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{busyId === t.id ? 'Dismissing...' : 'Dismiss'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Tickets Signed Off Tab */
              signedTickets.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-8">
                  No resolved or dismissed tickets in record.
                </p>
              ) : (
                <div className="space-y-3">
                  {signedTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-sm text-[#111827]">{t.subject}</div>
                        <div className="text-[#6B7280]">
                          Type: <strong>{t.type.replace(/_/g, ' ')}</strong> • Reporter:{' '}
                          {t.reporterPhoneE164 || t.reporterUid}
                        </div>
                        <p className="text-[#374151]">{t.description}</p>
                        {t.resolutionDecision && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 mt-1 inline-block">
                            Resolution: {t.resolutionDecision}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {t.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            Resolved ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
                            Dismissed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
