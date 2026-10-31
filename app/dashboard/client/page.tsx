'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CustomerAgentPanel } from '@/components/agent/customer-agent-panel';
import { useAuth } from '@/lib/auth/auth-context';
import type {
  ClientLeadClaimView,
  ClientRoleProfile,
  ServiceRequirement,
} from '@/lib/types/domain';
import {
  ArrowRight,
  Eye,
  FilePlus2,
  FolderKanban,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function ClientOverviewPage() {
  const { profiles, refreshSession } = useAuth();
  const clientProfile = profiles.client as ClientRoleProfile | null;

  const [requirements, setRequirements] = useState<ServiceRequirement[]>([]);
  const [claims, setClaims] = useState<ClientLeadClaimView[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [reqRes, claimRes] = await Promise.all([
        fetch('/api/requirements'),
        fetch('/api/claims?role=client'),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequirements(data.requirements || []);
      }
      if (claimRes.ok) {
        const data = await claimRes.json();
        setClaims(data.claims || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeReqs = requirements.filter((r) => r.distributionStatus !== 'closed');
  const freeViews = clientProfile?.freePartnerViewsRemaining ?? 5;
  const paidViews = clientProfile?.paidPartnerViewsRemaining ?? 0;
  const unlimitedViews = Boolean(
    clientProfile?.paidViewsUnlimited && clientProfile?.activeSubscriptionId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Client Workspace</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Post requirements via AI Agent or Form. Review matching partners and connect directly after mutual consent.
          </p>
        </div>
        <Link
          href="/dashboard/client/post-requirement"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-xs font-bold hover:bg-[#C91424]"
        >
          <FilePlus2 className="w-4 h-4" /> Post Requirement
        </Link>
      </div>

      {/*KPI Row*/}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Active Requirements</span>
            <FolderKanban className="w-4 h-4 text-[#E8192C]" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-[#111827]">
            {loading ? '—' : activeReqs.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6B7280]">
            {requirements.length} total requirements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Partner Responses</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-[#111827]">
            {loading ? '—' : claims.length}
          </div>
          <div className="mt-1 text-[11px] text-[#6B7280]">
            Responded to your requirements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>View Credits</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#111827]">
            {unlimitedViews ? 'Unlimited' : `${freeViews + paidViews} Left`}
          </div>
          <div className="mt-1 text-[11px] text-[#6B7280]">
            {unlimitedViews
              ? 'Client Plan Unlimited Active'
              : `${freeViews} starter free • ${paidViews} plan`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold">
            <span>Privacy Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-lg font-extrabold text-[#111827]">Mutual Consent</div>
          <div className="mt-1 text-[11px] text-[#6B7280]">
            Contacts stay private until both agree
          </div>
        </div>
      </div>

      {/* Conversational Client Agent */}
      <CustomerAgentPanel
        role="client"
        compact
        onActionCompleted={() => {
          void load();
          void refreshSession();
        }}
      />

      {/* Recent Requirements */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#111827]">Recent Requirements</h2>
          <Link
            href="/dashboard/client/requirements"
            className="text-xs font-semibold text-[#E8192C] inline-flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-xs text-[#6B7280] py-6">Loading requirements...</div>
        ) : requirements.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-[#111827]">No requirements posted yet</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Describe what you need in the XPO Agent above or use the structured form.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {requirements.slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#6B7280]">
                      {req.xpoCode}
                    </span>
                    <span className="font-bold text-sm text-[#111827]">{req.title}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {req.categoryName} • {req.workLocation} • {req.interestedCount}/
                    {req.targetInterestedCount} Partners responded
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/client/claims"
                    className="px-3 py-1 rounded-lg bg-[#111827] text-white text-[11px] font-semibold"
                  >
                    Review Partners ({req.interestedCount})
                  </Link>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#374151] capitalize">
                    {req.distributionStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
