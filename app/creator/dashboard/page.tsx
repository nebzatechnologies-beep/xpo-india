'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PlusCircle,
  FileText,
  Users,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.leads || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = leads.filter((l) => l.status === 'live').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Client Workspace"
        description="Track active commercial requirements, review interested partners, and manage direct WhatsApp connections."
        badge={
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#E8192C] border border-red-200">
            Client Requirement Hub
          </span>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Active Requirements"
          value={totalActive}
          description="Live specifications visible to verified partners"
          icon={FileText}
          accentColor="red"
          trend={{ value: '+2 this week', isPositive: true }}
        />
        <MetricCard
          label="Interested Partners"
          value={12}
          description="Partners expressing capability and suitability"
          icon={MessageSquare}
          accentColor="amber"
          trend={{ value: '3 new today', isPositive: true }}
        />
        <MetricCard
          label="Direct Handshakes"
          value={5}
          description="Active partner connections established on WhatsApp"
          icon={Users}
          accentColor="emerald"
          trend={{ value: '100% direct', isPositive: true }}
        />
      </div>

      {/* Action Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111827] to-[#1F2937] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm border border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 uppercase tracking-wider">
              Instant Broadcast
            </span>
          </div>
          <h3 className="text-base font-bold text-white">Need components fabricated, goods packaged, or software built?</h3>
          <p className="text-xs text-white/70 max-w-xl leading-relaxed">
            Post your technical requirements in 2 minutes using the <strong>Post a Requirement</strong> button in the top header. Verified partners will review your scope and express interest directly.
          </p>
        </div>
      </div>

      {/* Posted Opportunities Table / List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Your Posted Requirements</h2>
            <p className="text-xs text-[#6B7280]">Live demands currently receiving partner interest</p>
          </div>
          <Link href="/creator/my-leads" className="text-xs font-bold text-[#E8192C] flex items-center gap-1 hover:underline">
            View all ({leads.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {leads.length === 0 && !loading ? (
          <EmptyState
            title="No requirements posted yet"
            description="Use the 'Post a Requirement' button in the top header to broadcast your first business specification to verified partners across India."
            icon={FileText}
          />
        ) : (
          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <Card
                key={lead._id}
                className="p-5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-gray-100 text-[#111827]">
                      {lead.xpoId}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 font-bold">
                      {lead.status?.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-semibold text-[#6B7280]">
                      {lead.category?.name || 'General Industry'}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">•</span>
                    <span className="text-xs text-[#6B7280]">
                      Budget: {lead.budgetOpenForDiscussion || !lead.budgetMax
                        ? 'Open for discussion'
                        : `${lead.budgetCurrency === 'USD' ? '$' : '₹'}${lead.budgetMax.toLocaleString()}`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#111827]">{lead.title}</h4>
                  <p className="text-xs text-[#6B7280] line-clamp-1 max-w-2xl">{lead.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F4F6] w-full sm:w-auto">
                  <Link href="/creator/responses" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center rounded-xl text-xs font-bold border-[#E5E7EB] hover:bg-[#F9FAFB]">
                      View Interested Partners
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}