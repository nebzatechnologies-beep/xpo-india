'use client';

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

    fetch(`/api/admin/payments?${params.toString()}`)
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
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `xpo_transactions_${Date.now()}.csv`);
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
            ${stats.paypalRevenue.toLocaleString()}
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isRzp
                              ? 'bg-red-50 text-[#E8192C] border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
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