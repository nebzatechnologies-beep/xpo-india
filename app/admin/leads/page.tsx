'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  LeadClaim,
  MatchCandidateItem,
  ServiceRequirement,
  WhatsAppLeadOffer,
} from '@/lib/types/domain';
import { CheckCircle2, XCircle, FastForward, Eye, Loader2 } from 'lucide-react';

export default function AdminServiceLeadsPage() {
  const [requirements, setRequirements] = useState<ServiceRequirement[]>([]);
  const [offers, setOffers] = useState<WhatsAppLeadOffer[]>([]);
  const [claims, setClaims] = useState<LeadClaim[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/leads');
      if (res.ok) {
        const d = await res.json();
        setRequirements(d.requirements || []);
        setOffers(d.offers || []);
        setClaims(d.claims || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function inspectMatching(reqId: string) {
    setSelectedReqId(reqId);
    const res = await fetch(`/api/admin/leads?reqId=${encodeURIComponent(reqId)}`);
    if (res.ok) {
      const d = await res.json();
      setCandidates(d.candidates || []);
    }
  }

  async function moderate(reqId: string, decision: 'approved' | 'rejected' | 'closed') {
    try {
      setBusyId(reqId);
      setMsg(null);
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moderate', reqId, decision }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Moderation failed');
      setMsg(`Requirement ${decision}.`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function forceNextRound(reqId: string) {
    try {
      setBusyId(reqId);
      setMsg(null);
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_next_round', reqId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Dispatch failed');
      setMsg('Triggered next 5-minute round of 3 Partners.');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Leads & Distribution Rounds
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Approve flagged requirements, inspect deterministic Partner match scores + fairness
          penalties, and monitor offer cascades ({offers.length} offers, {claims.length}{' '}
          claims).
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
          {msg}
        </div>
      )}

      {selectedReqId && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">
              Matched Partners Pool ({candidates.length} Ranked)
            </h2>
            <button
              type="button"
              onClick={() => setSelectedReqId(null)}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
            >
              Close
            </button>
          </div>
          {candidates.length === 0 ? (
            <p className="text-xs text-[#6B7280]">No eligible matched Partners in pool yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="py-2">Partner</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Relevance</th>
                    <th className="py-2">Fairness Penalty</th>
                    <th className="py-2">Final Score</th>
                    <th className="py-2">Round / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {candidates.map((c) => (
                    <tr key={c.candidateUid}>
                      <td className="py-2 font-bold">{c.businessName || c.displayName}</td>
                      <td className="py-2 font-mono">{c.phoneE164}</td>
                      <td className="py-2">{c.relevanceScore}</td>
                      <td className="py-2 text-amber-700">-{c.fairnessPenalty}</td>
                      <td className="py-2 font-extrabold text-[#111827]">{c.finalScore}</td>
                      <td className="py-2">
                        R{c.offeredRound || '-'} • {c.offerStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        {loading ? (
          <p className="text-xs text-[#6B7280]">Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No requirements submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold">{req.xpoCode}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[11px] font-bold capitalize">
                      Moderation: {req.moderationStatus.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[11px] font-bold capitalize">
                      Dist: {req.distributionStatus.replace(/_/g, ' ')} (Round {req.currentRound})
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#111827]">{req.title}</div>
                  <div className="text-xs text-[#6B7280]">
                    {req.clientBusinessName} • {req.categoryName} • {req.workLocation} •{' '}
                    {req.interestedCount}/{req.targetInterestedCount} Claims
                  </div>
                  {req.moderationReason && (
                    <div className="text-[11px] text-amber-700">
                      Auto-Moderation Flag: {req.moderationReason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void inspectMatching(req.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> Match Pool
                  </button>

                  {req.distributionStatus === 'closed' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
                      Closed
                    </span>
                  ) : req.moderationStatus === 'rejected' ? (
                    <>
                      <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                        Rejected
                      </span>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void moderate(req.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {busyId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Re-Approve</span>
                      </button>
                    </>
                  ) : req.moderationStatus !== 'approved' ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void moderate(req.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {busyId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{busyId === req.id ? 'Approving...' : 'Approve & Dispatch'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void moderate(req.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {busyId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{busyId === req.id ? 'Rejecting...' : 'Reject'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {req.distributionStatus === 'target_reached' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          Target Reached ({req.interestedCount} Claims)
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === req.id}
                          onClick={() => void forceNextRound(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold disabled:opacity-50"
                        >
                          {busyId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FastForward className="w-3.5 h-3.5" />
                          )}
                          <span>{busyId === req.id ? 'Advancing...' : 'Next Round'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void moderate(req.id, 'closed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === req.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{busyId === req.id ? 'Closing...' : 'Close Requirement'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
