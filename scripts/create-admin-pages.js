const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`Created: ${relPath}`);
}

// 1. app/(admin)/layout.tsx
writeFile('app/(admin)/layout.tsx', `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Users,
  Database,
  Send,
  MessageCircle,
  Tag,
  Settings,
  Sparkles,
  CheckCircle2,
  LogOut,
  Sliders,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Transaction Records', href: '/admin/payments', icon: CreditCard, highlight: true },
    { label: 'Moderate Leads', href: '/admin/leads', icon: FileText },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'CRM Database', href: '/admin/database', icon: Database },
    { label: 'Outreach Campaigns', href: '/admin/campaigns', icon: Send },
    { label: 'WhatsApp Logs', href: '/admin/whatsapp', icon: MessageCircle },
    { label: 'Categories & Sectors', href: '/admin/categories', icon: Tag },
    { label: 'Plan Pricing', href: '/admin/subscriptions', icon: Sliders },
    { label: 'Gateway & API Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
        window.location.reload();
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#EBEBEB] flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[#EBEBEB]">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                X
              </span>
              <div>
                <span className="text-base font-black tracking-tight text-[#222222]">
                  XPO <span className="text-[#E8192C]">ADMIN</span>
                </span>
                <span className="block text-[10px] text-[#717171] uppercase tracking-wider font-semibold">
                  Superadmin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={\`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all \${
                    isActive
                      ? 'bg-red-50 text-[#E8192C]'
                      : 'text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7]'
                  }\`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={\`w-4 h-4 \${isActive ? 'text-[#E8192C]' : 'text-[#717171]'}\`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-[#E8192C] font-bold">
                      Ledger
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#EBEBEB] space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            isLoading={seeding}
            className="w-full text-xs font-semibold border-red-200 text-[#E8192C] hover:bg-red-50 flex items-center justify-center gap-1.5"
          >
            {seedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Seeded!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Demo Accounts</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-xs text-[#717171] hover:text-[#222222] flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#EBEBEB] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
              👑 Superadmin Mode
            </span>
            <span className="text-xs text-[#717171] hidden sm:inline">
              Full Platform Control & Gateway Ledger
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              isLoading={seeding}
              className="text-xs font-semibold md:hidden"
            >
              Seed Data
            </Button>
            <Link href="/" target="_blank" className="text-xs font-semibold text-[#717171] hover:text-[#222222]">
              View Live Site ↗
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
`);

// 2. app/(admin)/dashboard/page.tsx
writeFile('app/(admin)/dashboard/page.tsx', `'use client';

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
            \${stats.paypalRevenueUSD.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-[#717171] flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" /> PayPal Global (\$49/yr)
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
              <span className="font-black text-blue-700">\${stats.paypalRevenueUSD.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

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
`);

// 3. app/(admin)/payments/page.tsx - Core Superadmin Transaction Records
writeFile('app/(admin)/payments/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  Download,
  Search,
  Filter,
  RefreshCw,
  Globe2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    razorpayRevenue: 1998,
    paypalRevenue: 98,
    totalTransactions: 6,
  });
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (gatewayFilter !== 'all') params.set('gateway', gatewayFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(\`/api/admin/payments?\${params.toString()}\`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setPayments(res.payments || []);
          if (res.stats) setStats(res.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, [gatewayFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Gateway Order ID',
      'Gateway',
      'User Name',
      'User Email',
      'Amount',
      'Currency',
      'Type',
      'AutoPay',
      'Status',
      'Date',
    ];

    const rows = payments.map((p) => [
      p.gatewayPaymentId || p._id,
      p.gatewayOrderId || 'N/A',
      p.gateway?.toUpperCase(),
      p.user?.name || 'User',
      p.user?.email || 'N/A',
      p.amount,
      p.currency,
      p.type,
      p.metadata?.isAutoPay ? 'YES' : 'NO',
      p.status?.toUpperCase(),
      new Date(p.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`xpo_transactions_\${Date.now()}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#222222] tracking-tight">
              Transaction Records & Ledger
            </h1>
            <Badge variant="outline" className="border-red-200 text-[#E8192C] bg-red-50 text-xs">
              Superadmin Only
            </Badge>
          </div>
          <p className="text-xs text-[#717171] mt-0.5">
            Complete financial records for Domestic (Razorpay ₹999) & International (PayPal $49) with AutoPay subscriptions.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleExportCSV}
          className="rounded-2xl font-semibold flex items-center gap-2 border-[#EBEBEB] text-[#222222] hover:bg-[#F7F7F7] shrink-0"
        >
          <Download className="w-4 h-4 text-[#E8192C]" />
          Export Ledger CSV
        </Button>
      </div>

      {/* Financial Summary Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Domestic Volume (Razorpay)</span>
            <CreditCard className="w-5 h-5 text-[#E8192C]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#222222]">
            ₹{stats.razorpayRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#717171] mt-0.5">Indian UPI & e-Mandates</div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Global Volume (PayPal)</span>
            <Globe2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#222222]">
            \${stats.paypalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#717171] mt-0.5">International Subscriptions</div>
        </Card>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Total Ledger Records</span>
            <RefreshCw className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#222222]">
            {stats.totalTransactions}
          </div>
          <div className="text-[11px] text-[#717171] mt-0.5">Combined payment events</div>
        </Card>
      </div>

      {/* Controls & Search */}
      <Card className="p-4 rounded-3xl border border-[#EBEBEB] bg-white">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#717171] absolute left-3.5 top-3.5" />
            <Input
              placeholder="Search by Order ID, Transaction ID, user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border-[#EBEBEB] text-xs"
            />
          </div>

          {/* Gateway Filter */}
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#EBEBEB] text-xs bg-white focus:outline-none font-semibold text-[#222222]"
          >
            <option value="all">All Gateways (Razorpay & PayPal)</option>
            <option value="razorpay">Razorpay (India ₹999)</option>
            <option value="paypal">PayPal (Global $49)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#EBEBEB] text-xs bg-white focus:outline-none font-semibold text-[#222222]"
          >
            <option value="all">All Statuses</option>
            <option value="captured">Captured / Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <Button type="submit" variant="primary" size="sm" className="rounded-xl text-xs font-semibold px-4">
            Filter Records
          </Button>
        </form>
      </Card>

      {/* Transactions Table */}
      <Card className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#717171]">
                <th className="py-3 px-5">Transaction & Gateway</th>
                <th className="py-3 px-5">Customer / Organization</th>
                <th className="py-3 px-5">Type & AutoPay</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB] text-xs">
              {payments.map((p) => {
                const isRzp = p.gateway === 'razorpay';
                const isAutoPay = Boolean(p.metadata?.isAutoPay || p.type === 'subscription');
                return (
                  <tr key={p._id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
                            isRzp
                              ? 'bg-red-50 text-[#E8192C] border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }\`}
                        >
                          {p.gateway}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#222222]">
                          {p.gatewayPaymentId || p.gatewayOrderId || p._id}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#717171] mt-0.5 font-mono">
                        Order: {p.gatewayOrderId || 'N/A'}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-[#222222]">{p.user?.name || 'Verified Member'}</div>
                      <div className="text-[11px] text-[#717171]">{p.user?.email || 'N/A'}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-semibold text-[#222222]">
                          {p.type?.replace('_', ' ')}
                        </span>
                        {isAutoPay && (
                          <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50 font-bold">
                            <RefreshCw className="w-2.5 h-2.5 mr-0.5 animate-spin-slow" /> AutoPay
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-[#717171]">
                        {p.plan?.name || (isRzp ? 'Annual Domestic (INR)' : 'Annual Global (USD)')}
                      </div>
                    </td>

                    <td className="py-4 px-5 font-black text-[#222222]">
                      {p.currency === 'USD' ? '$' : '₹'}{p.amount?.toLocaleString()}
                    </td>

                    <td className="py-4 px-5">
                      {p.status === 'captured' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Captured
                        </span>
                      ) : p.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-[#717171] text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
`);

// 4. app/(admin)/leads/page.tsx
writeFile('app/(admin)/leads/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(\`/api/admin/leads?\${params.toString()}\`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setLeads(res.leads || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const updateStatus = async (leadId: string, status: string) => {
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status }),
    });
    fetchLeads();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Lead Moderation & Quality</h1>
        <p className="text-xs text-[#717171] mt-0.5">Audit requirements across sectors, approve new posts, or suspend spam.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search leads by title or XPO-ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md rounded-xl border-[#EBEBEB] text-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#EBEBEB] text-xs bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="live">Live</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="closed">Closed</option>
        </select>
        <Button variant="primary" size="sm" onClick={fetchLeads} className="rounded-xl text-xs font-semibold">
          Search
        </Button>
      </div>

      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead._id} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100">{lead.xpoId}</span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                  {lead.status?.toUpperCase()}
                </Badge>
                <span className="text-xs text-[#717171]">{lead.category?.name}</span>
              </div>
              <h3 className="text-sm font-bold text-[#222222]">{lead.title}</h3>
              <p className="text-xs text-[#717171] mt-0.5 line-clamp-1">{lead.description}</p>
              <div className="text-[11px] text-[#717171] mt-1">Creator: {lead.creator?.name} ({lead.creator?.email})</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lead.status !== 'live' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateStatus(lead._id, 'live')}
                  className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve / Set Live
                </Button>
              )}
              {lead.status === 'live' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus(lead._id, 'closed')}
                  className="rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Close Lead
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 5. app/(admin)/users/page.tsx
writeFile('app/(admin)/users/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('search', search);

    fetch(\`/api/admin/users?\${params.toString()}\`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUsers(res.users || []);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: newStatus }),
    });
    fetchUsers();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">User Directory & Roles</h1>
        <p className="text-xs text-[#717171] mt-0.5">Manage creators, absorbers, permissions, and account status.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md rounded-xl border-[#EBEBEB] text-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#EBEBEB] text-xs bg-white"
        >
          <option value="all">All Roles</option>
          <option value="lead_creator">Lead Creators</option>
          <option value="lead_absorber">Lead Absorbers</option>
          <option value="superadmin">Superadmins</option>
        </select>
        <Button variant="primary" size="sm" onClick={fetchUsers} className="rounded-xl text-xs font-semibold">
          Search
        </Button>
      </div>

      <Card className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#717171]">
              <th className="py-3 px-5">User</th>
              <th className="py-3 px-5">Role</th>
              <th className="py-3 px-5">Company & Phone</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-[#F9F9F9]">
                <td className="py-3 px-5">
                  <div className="font-bold text-[#222222]">{u.name}</div>
                  <div className="text-[11px] text-[#717171]">{u.email}</div>
                </td>
                <td className="py-3 px-5 capitalize font-semibold text-[#222222]">
                  {u.role?.replace('_', ' ')}
                </td>
                <td className="py-3 px-5">
                  <div>{u.company || 'Individual'}</div>
                  <div className="text-[11px] text-[#717171]">{u.phone || 'N/A'}</div>
                </td>
                <td className="py-3 px-5">
                  <Badge
                    variant="outline"
                    className={\`text-[10px] font-bold \${
                      u.status === 'active'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-red-200 text-red-700 bg-red-50'
                    }\`}
                  >
                    {u.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(u._id, u.status)}
                    className="text-xs font-semibold hover:text-[#E8192C]"
                  >
                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
`);

// 6. app/(admin)/database/page.tsx
writeFile('app/(admin)/database/page.tsx', `'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Database, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function AdminDatabasePage() {
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSimulatedImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">CRM Database & Imports</h1>
        <p className="text-xs text-[#717171] mt-0.5">Upload business supplier lists and customer records via CSV.</p>
      </div>

      <Card className="p-8 rounded-3xl border border-[#EBEBEB] bg-white text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#E8192C] flex items-center justify-center mb-4">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#222222]">Import Leads / Supplier Database CSV</h3>
        <p className="text-xs text-[#717171] mt-1 max-w-md">
          Upload contacts in CSV format with columns: Name, Email, Phone, Company, Sector, and City.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleSimulatedImport}
            isLoading={importing}
            className="rounded-2xl font-semibold"
          >
            {success ? 'Imported 120 Contacts!' : 'Upload Sample Vendor CSV'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
`);

// 7. app/(admin)/campaigns/page.tsx
writeFile('app/(admin)/campaigns/page.tsx', `'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, Mail } from 'lucide-react';

export default function AdminCampaignsPage() {
  const campaigns = [
    {
      name: 'Q3 Western India CNC Manufacturers Blast',
      channel: 'whatsapp',
      status: 'completed',
      recipients: 450,
      delivered: 442,
      replied: 88,
    },
    {
      name: 'Global Cross-Border Exporters Outreach',
      channel: 'email',
      status: 'running',
      recipients: 1200,
      delivered: 1180,
      replied: 142,
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Outreach Campaigns</h1>
          <p className="text-xs text-[#717171] mt-0.5">Automated broadcasts over WhatsApp WABA and Email.</p>
        </div>
        <Button variant="primary" size="md" className="rounded-2xl text-xs font-semibold">
          Create New Campaign
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.map((c, i) => (
          <Card key={i} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                  {c.status.toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold capitalize text-[#717171] flex items-center gap-1">
                  {c.channel === 'whatsapp' ? <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5 text-blue-600" />}
                  {c.channel}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#222222]">{c.name}</h3>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#717171]">
              <div>Recipients: <span className="font-bold text-[#222222]">{c.recipients}</span></div>
              <div>Delivered: <span className="font-bold text-emerald-600">{c.delivered}</span></div>
              <div>Replies: <span className="font-bold text-[#E8192C]">{c.replied}</span></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 8. app/(admin)/whatsapp/page.tsx
writeFile('app/(admin)/whatsapp/page.tsx', `'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCheck } from 'lucide-react';

export default function AdminWhatsAppPage() {
  const logs = [
    {
      to: '+91 9820011223',
      template: 'xpo_lead_match_alert',
      leadId: 'XPO-10021',
      status: 'delivered',
      time: '10 mins ago',
    },
    {
      to: '+91 9910044556',
      template: 'xpo_proposal_received',
      leadId: 'XPO-10021',
      status: 'read',
      time: '25 mins ago',
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp Cloud API Logs</h1>
        <p className="text-xs text-[#717171] mt-0.5">Meta WABA webhook events and real-time lead notification dispatches.</p>
      </div>

      <div className="space-y-3">
        {logs.map((log, i) => (
          <Card key={i} className="p-4 rounded-2xl border border-[#EBEBEB] bg-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#222222]">{log.to}</div>
                <div className="text-[10px] text-[#717171]">Template: {log.template} • Lead: {log.leadId}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                <CheckCheck className="w-3 h-3 mr-1" /> {log.status}
              </Badge>
              <span className="text-[11px] text-[#717171]">{log.time}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 9. app/(admin)/categories/page.tsx
writeFile('app/(admin)/categories/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.categories || []);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Taxonomy & Category Manager</h1>
        <p className="text-xs text-[#717171] mt-0.5">Configure sector-agnostic industries and sub-sectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Card key={c._id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-[#222222]">{c.name}</div>
              <div className="text-xs text-[#717171]">{c.slug}</div>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">
              Active
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 10. app/(admin)/subscriptions/page.tsx
writeFile('app/(admin)/subscriptions/page.tsx', `'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminSubscriptionsPage() {
  const plans = [
    { name: 'Lead Creator Annual (India)', price: '₹999', gateway: 'Razorpay', cycle: 'annual', activeUsers: 42 },
    { name: 'Lead Creator Annual (Global)', price: '$49', gateway: 'PayPal', cycle: 'annual', activeUsers: 18 },
    { name: 'Lead Absorber Annual (India)', price: '₹999', gateway: 'Razorpay', cycle: 'annual', activeUsers: 84 },
    { name: 'Lead Absorber Annual (Global)', price: '$49', gateway: 'PayPal', cycle: 'annual', activeUsers: 29 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Subscription Plan Management</h1>
        <p className="text-xs text-[#717171] mt-0.5">Control pricing tiers, AutoPay rules, and gateway mappings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((p, i) => (
          <Card key={i} className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {p.gateway} AutoPay
                </Badge>
                <span className="text-xs text-[#717171]">{p.activeUsers} Active Subscriptions</span>
              </div>
              <h3 className="text-lg font-bold text-[#222222]">{p.name}</h3>
              <div className="text-2xl font-black text-[#222222] mt-2">{p.price} <span className="text-xs font-normal text-[#717171]">/ year</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#EBEBEB] flex justify-end">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                Edit Pricing
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 11. app/(admin)/settings/page.tsx
writeFile('app/(admin)/settings/page.tsx', `'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">System & Gateway Settings</h1>
        <p className="text-xs text-[#717171] mt-0.5">Configure live production keys for Razorpay, PayPal, Firebase, and Meta WABA.</p>
      </div>

      {/* Razorpay */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">Razorpay (Domestic India)</h3>
            <p className="text-xs text-[#717171]">Used for ₹999/year domestic subscriptions, UPI, Cards, and AutoPay.</p>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs">
            Live Ready
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Key ID</label>
            <Input defaultValue="rzp_test_demo123" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Key Secret</label>
            <Input defaultValue="••••••••••••••••" type="password" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      {/* PayPal */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">PayPal (International)</h3>
            <p className="text-xs text-[#717171]">Used for $49/year global subscriptions across 190+ countries.</p>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">
            Sandbox / Live
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Client ID</label>
            <Input defaultValue="paypal_client_demo123" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Secret</label>
            <Input defaultValue="••••••••••••••••" type="password" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      {/* Firebase */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#222222]">Firebase Storage & Hosting</h3>
          <p className="text-xs text-[#717171]">Storage for lead specification CAD files, brochures, and platform hosting.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Project ID</label>
            <Input defaultValue="xpo-india-app" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Storage Bucket</label>
            <Input defaultValue="xpo-india-app.appspot.com" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" size="md" className="rounded-2xl font-semibold px-6">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
`);

console.log('Admin pages written successfully!');
