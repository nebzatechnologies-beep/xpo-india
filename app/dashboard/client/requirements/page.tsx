'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ServiceRequirement } from '@/lib/types/domain';
import { FilePlus2, Loader2, XCircle } from 'lucide-react';

export default function ClientRequirementsListPage() {
  const [requirements, setRequirements] = useState<ServiceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requirements');
      if (res.ok) {
        const data = await res.json();
        setRequirements(data.requirements || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCloseRequirement(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/requirements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Requirements</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Monitor active partner matching and incoming responses.
          </p>
        </div>
        <Link
          href="/dashboard/client/post-requirement"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-xs font-bold"
        >
          <FilePlus2 className="w-4 h-4" /> Post Requirement
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
          Loading requirements...
        </div>
      ) : requirements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
          <p className="text-sm font-bold text-[#111827]">No service requirements yet</p>
          <Link
            href="/dashboard/client/post-requirement"
            className="mt-4 inline-flex px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold"
          >
            Create First Requirement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[11px] font-mono font-bold text-[#374151]">
                    {req.xpoCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold capitalize">
                    {req.distributionStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    Round {req.currentRound || 0} • {req.interestedCount}/
                    {req.targetInterestedCount} Partners Interested
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#111827]">{req.title}</h2>
                <p className="text-xs text-[#4B5563] line-clamp-2">{req.specifications}</p>
                <div className="text-[11px] text-[#6B7280]">
                  {req.categoryName} • {req.workLocation} • Timeline: {req.timeline} • Budget:{' '}
                  {req.estimatedBudget || 'Quotes Invited'}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/dashboard/client/claims"
                  className="px-3.5 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold"
                >
                  View Claims ({req.interestedCount})
                </Link>
                {req.distributionStatus === 'closed' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-[#4B5563] text-xs font-semibold">
                    Closed
                  </span>
                ) : req.moderationStatus === 'rejected' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                    Rejected by Moderation
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === req.id}
                    onClick={() => void handleCloseRequirement(req.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:text-red-600 disabled:opacity-50"
                  >
                    {busyId === req.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{busyId === req.id ? 'Closing...' : 'Close'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
