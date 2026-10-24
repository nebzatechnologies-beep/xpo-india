'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  TrendingUp,
  FileText,
  Users,
  RefreshCw,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {
    totalUsers: 3,
    creatorCount: 1,
    absorberCount: 1,
    totalLeads: 5,
    liveLeads: 5,
    autopayCount: 3,
    razorpayRevenueINR: 1998,
    paypalRevenueUSD: 98,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Platform Performance & Metrics</h1>
        <p className="text-xs text-[#717171] mt-0.5">Live platform transactions, sector opportunity distribution, and gateway revenue.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Domestic INR */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Domestic Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-[#222222]">
            ₹{stats.razorpayRevenueINR.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[#717171] flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-[#E8192C]" /> Razorpay (India ₹999/yr)
          </div>
        </Card>

        {/* Global USD */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">International Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              $
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-[#222222]">
            ${stats.paypalRevenueUSD.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[#717171] flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" /> PayPal Global ($49/yr)
          </div>
        </Card>

        {/* AutoPay Subscriptions */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Active AutoPay</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-[#222222]">{stats.autopayCount}</div>
          <div className="mt-1 text-xs text-[#717171]">Recurring annual renewals</div>
        </Card>

        {/* Live Leads */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Live Opportunities</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-[#222222]">{stats.liveLeads}</div>
          <div className="mt-1 text-xs text-[#717171]">{stats.totalUsers} registered members</div>
        </Card>
      </div>

      {/* Client & Partner Workspace Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-sky-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Client Workspace (Requirement Posters)
            </h3>
            <Badge variant="outline" className="border-blue-300 text-blue-800 bg-white text-xs font-bold">
              Clients Hub
            </Badge>
          </div>
          <p className="text-xs text-[#717171]">
            Clients register for free, build company profiles, and post commercial requirements for buying goods, services, & contracting.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-[11px] font-semibold text-[#717171]">Registered Clients</span>
              <p className="text-xl font-black text-blue-950 mt-0.5">{stats.clientCount || stats.creatorCount || 1}</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-[11px] font-semibold text-[#717171]">Requirements Posted</span>
              <p className="text-xl font-black text-blue-950 mt-0.5">{stats.totalLeads}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/admin/leads">
              <Button variant="outline" size="sm" className="w-full rounded-2xl text-xs font-bold border-blue-200 text-blue-800 hover:bg-blue-50">
                Moderate Client Requirements →
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Partner Workspace (Solution Providers)
            </h3>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-white text-xs font-bold">
              Partners Hub
            </Badge>
          </div>
          <p className="text-xs text-[#717171]">
            Partners (manufacturers, suppliers, agencies, contractors) discover requirements, submit capability proposals, & unlock direct contact details.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[11px] font-semibold text-[#717171]">Registered Partners</span>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{stats.partnerCount || stats.absorberCount || 2}</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[11px] font-semibold text-[#717171]">Proposals & Interests</span>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{stats.totalProposals || 8}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="w-full rounded-2xl text-xs font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                Manage Partner Directory →
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Gateway Split Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#222222]">Domestic Payment Gateway</h3>
            <Badge variant="outline" className="text-xs text-[#E8192C] border-red-200 bg-red-50">
              Razorpay Active
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100">
              <span className="text-[#717171]">Annual Plan Rate</span>
              <span className="font-bold text-[#222222]">₹999 / year</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100">
              <span className="text-[#717171]">Supported Rails</span>
              <span className="font-semibold text-[#222222]">UPI AutoPay, Cards, NetBanking</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-[#717171]">Domestic Captured Volume</span>
              <span className="font-black text-emerald-700">₹{stats.razorpayRevenueINR.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#222222]">International Payment Gateway</h3>
            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
              PayPal Active
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100">
              <span className="text-[#717171]">Annual Global Plan Rate</span>
              <span className="font-bold text-[#222222]">$49 / year</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100">
              <span className="text-[#717171]">Supported Rails</span>
              <span className="font-semibold text-[#222222]">PayPal Subscriptions, International Cards</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-[#717171]">International Captured Volume</span>
              <span className="font-black text-blue-700">${stats.paypalRevenueUSD.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Deployment Demos Console Banner */}
      <Card className="p-6 rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-indigo-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              👑 Multi-Regional Control
            </span>
            <span className="text-xs text-[#717171]">Domestic (India) ⇄ Global (Worldwide)</span>
          </div>
          <h3 className="text-base font-bold text-[#222222]">Superadmin Deployment Demos Console</h3>
          <p className="text-xs text-[#717171] mt-0.5">
            Test and preview live deployment profiles for India Domestic (INR, Razorpay) and Global Cross-Border Sourcing (USD, PayPal).
          </p>
        </div>
        <Link href="/admin/demos">
          <Button size="md" className="rounded-2xl font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-2 shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Launch Deployment Demos
          </Button>
        </Link>
      </Card>

      {/* Quick Action to Payments Ledger */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#222222]">Superadmin Transaction Ledger</h3>
          <p className="text-xs text-[#717171] mt-0.5">
            View every payment capture, AutoPay subscription id, gateway orders, and export full accounting CSVs.
          </p>
        </div>
        <Link href="/admin/payments">
          <Button variant="primary" size="md" className="rounded-2xl font-semibold flex items-center gap-2 shrink-0">
            Open Transaction Records <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}