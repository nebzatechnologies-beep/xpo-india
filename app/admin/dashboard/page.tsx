'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExecutiveKpiDashboardData } from '@/lib/services/analytics';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CreditCard,
  Download,
  FileText,
  Handshake,
  RefreshCw,
  Send,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';

export default function AdminExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveKpiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const ov = data?.overviewCounts;
  const kpi = data?.commercialHealthKpis;

  const monitoringPillars = [
    {
      title: '1. Uploaded Contacts',
      icon: Building2,
      value: `${ov?.crmContactsCount ?? 0}`,
      detail: `${ov?.clientDatabaseCount ?? 0} Client DB (${ov?.clientOptedInCount ?? 0} opted-in) • ${ov?.partnerDatabaseCount ?? 0} Partner DB (${ov?.partnerOptedInCount ?? 0} opted-in)`,
    },
    {
      title: '2. WhatsApp Invitations',
      icon: Send,
      value: `${(ov?.clientInvitationsSent ?? 0) + (ov?.partnerInvitationsSent ?? 0)}`,
      detail: `${ov?.clientInvitationsSent ?? 0} Client invites • ${ov?.partnerInvitationsSent ?? 0} Partner invites (${ov?.invitationRepliesCount ?? 0} replied)`,
    },
    {
      title: '3. Registrations',
      icon: UserCheck,
      value: `${(ov?.clientsCount ?? 0) + (ov?.partnersCount ?? 0)}`,
      detail: `${ov?.clientsCount ?? 0} activated Clients • ${ov?.partnersCount ?? 0} activated Partners`,
    },
    {
      title: '4. Client Requirements',
      icon: FileText,
      value: `${ov?.totalRequirements ?? 0}`,
      detail: `${ov?.activeRequirements ?? 0} in active distribution`,
    },
    {
      title: '5. Partner Responses',
      icon: Zap,
      value: `${ov?.offersClaimedCount ?? 0} / ${ov?.offersDispatchedCount ?? 0}`,
      detail: `${ov?.offersClaimedCount ?? 0} claimed • ${ov?.offersExpiredCount ?? 0} redirected`,
    },
    {
      title: '6. Unlocks & Connections',
      icon: Handshake,
      value: `${ov?.acceptedConnectionsCount ?? 0}`,
      detail: `${ov?.partnerProfilesUnlockedCount ?? 0} Partner profiles unlocked • ${ov?.acceptedConnectionsCount ?? 0} mutual connections`,
    },
    {
      title: '7. Active Subscriptions',
      icon: CreditCard,
      value: `${ov?.activeSubscriptions ?? 0}`,
      detail: `${ov?.activeClientPlans ?? 0} Client Plans • ${ov?.activePartnerPlans ?? 0} Partner Plans`,
    },
    {
      title: '8. Revenue & Meta Spend',
      icon: TrendingUp,
      value: `₹${(ov?.revenueInrTotal ?? 0).toLocaleString('en-IN')}`,
      detail: `$${ov?.revenueUsdTotal ?? 0} USD • Meta API spend: ₹${ov?.whatsappCostInrTotal ?? 0}`,
    },
  ];

  const kpiCards = [
    {
      title: 'Match Speed',
      desc: 'Requirement to 1st Partner alert',
      value: `${kpi?.avgRequirementToMatchSeconds ?? 0}s`,
    },
    {
      title: 'Round-1 Response Rate',
      desc: 'Partner response action rate',
      value: `${kpi?.firstRoundPartnerResponseRatePercent ?? 0}%`,
    },
    {
      title: 'Time to 3 Partners',
      desc: 'Average shortlist completion',
      value: `${kpi?.avgTimeToThreeInterestedMinutes ?? 0} min`,
    },
    {
      title: 'Mutual Connection Rate',
      desc: 'Accepted direct introductions',
      value: `${kpi?.mutualConnectionAcceptanceRatePercent ?? 0}%`,
    },
    {
      title: 'Partner Plan Conversion',
      desc: 'Free starter to paid Partner Plan',
      value: `${kpi?.freeToPaidPartnerConversionPercent ?? 0}%`,
    },
    {
      title: 'Client Plan Conversion',
      desc: 'Free views to paid Client Plan',
      value: `${kpi?.freeToPaidClientConversionPercent ?? 0}%`,
    },
    {
      title: 'WhatsApp Delivery',
      desc: 'Meta Cloud API delivery health',
      value: `${kpi?.whatsappDeliverySuccessPercent ?? 0}%`,
    },
    {
      title: 'Verified Profiles',
      desc: 'KYC verified marketplace accounts',
      value: `${kpi?.verifiedProfilePercent ?? 0}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827]">
            Superadmin Monitoring Dashboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Track Client & Partner Databases, WhatsApp invitations, registrations, requirements,
            partner responses, connections, subscriptions, and revenue from one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href="/api/admin/reports?format=csv"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        </div>
      </div>

      {/* Superadmin Step 1: Two Separate Primary Database Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#111827]">
              <Building2 className="w-4 h-4 text-[#E8192C]" /> Client Database
            </div>
            <p className="text-xs text-[#6B7280]">
              Upload potential Clients&apos; Excel sheets (names, WhatsApp numbers, locations,
              business info) and send consented WhatsApp invitations.
            </p>
            <div className="text-[11px] font-bold text-[#111827] pt-1">
              {loading
                ? 'Loading...'
                : `${ov?.clientDatabaseCount ?? 0} uploaded • ${ov?.clientOptedInCount ?? 0} opted-in • ${ov?.clientsCount ?? 0} registered`}
            </div>
          </div>
          <Link
            href="/admin/clients"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold"
          >
            Open Client DB <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#111827]">
              <Briefcase className="w-4 h-4 text-[#E8192C]" /> Partner Database
            </div>
            <p className="text-xs text-[#6B7280]">
              Upload potential Partners&apos; Excel sheets (names, WhatsApp numbers, locations,
              services, categories, subcategories) and dispatch invitations.
            </p>
            <div className="text-[11px] font-bold text-[#111827] pt-1">
              {loading
                ? 'Loading...'
                : `${ov?.partnerDatabaseCount ?? 0} uploaded • ${ov?.partnerOptedInCount ?? 0} opted-in • ${ov?.partnersCount ?? 0} registered`}
            </div>
          </div>
          <Link
            href="/admin/partners"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white text-xs font-bold"
          >
            Open Partner DB <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Superadmin Step 11: 8-Pillar End-to-End Monitoring Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {monitoringPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
                <span>{pillar.title}</span>
                <Icon className="w-4 h-4 text-[#6B7280]" />
              </div>
              <div className="text-2xl font-black text-[#111827] mt-2">
                {loading ? '—' : pillar.value}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1 leading-snug">{pillar.detail}</div>
            </div>
          );
        })}
      </div>

      {/* Operational Efficiency KPIs */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-[#111827]">Operational & Conversion Health</h2>
          <p className="text-[11px] text-[#6B7280]">
            Live telemetry across matching, mutual consent connections, and two-sided
            subscriptions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {kpiCards.map((c) => (
            <div
              key={c.title}
              className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs"
            >
              <div className="text-xs font-bold text-[#111827]">{c.title}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">{c.desc}</div>
              <div className="text-2xl font-black text-[#111827] mt-2.5">
                {loading ? '—' : c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requirements & Subscription Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111827]">Recent Client Requirements</h3>
            <Link
              href="/admin/leads"
              className="text-xs font-semibold text-[#111827] hover:underline"
            >
              View All Requirements →
            </Link>
          </div>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {(data?.recentRequirements || []).map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#6B7280] mr-2">{r.xpoCode}</span>
                  <span className="font-semibold text-gray-900">{r.title}</span>
                </div>
                <span className="capitalize text-gray-500 font-medium shrink-0">
                  {r.distributionStatus.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
            {(data?.recentRequirements || []).length === 0 && (
              <p className="text-[#6B7280] py-4">No Client requirements submitted yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111827]">Recent Subscription Payments</h3>
            <Link
              href="/admin/subscriptions"
              className="text-xs font-semibold text-[#111827] hover:underline"
            >
              Manage Plans & Quotas →
            </Link>
          </div>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {(data?.recentPayments || []).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#6B7280] mr-2">
                    {p.invoiceNumber || p.id.slice(0, 10)}
                  </span>
                  <span className="font-semibold text-gray-900 uppercase">{p.role} Plan</span>
                </div>
                <span className="font-bold text-emerald-700 shrink-0">
                  {p.currency === 'INR' ? `₹${p.amount}` : `$${p.amount}`}
                </span>
              </div>
            ))}
            {(data?.recentPayments || []).length === 0 && (
              <p className="text-[#6B7280] py-4">No subscription payments captured yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
