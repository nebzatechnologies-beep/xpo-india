'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, Receipt, RefreshCw, ShieldAlert } from 'lucide-react';
import type { PaymentEventRecord } from '@/lib/types/domain';

interface PaymentSummary {
  totalInr: number;
  totalGstInr: number;
  totalUsd: number;
  failedEventsCount: number;
}

export default function AdminPaymentsPage() {
  const [events, setEvents] = useState<PaymentEventRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalInr: 0,
    totalGstInr: 0,
    totalUsd: 0,
    failedEventsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gatewayFilter, setGatewayFilter] = useState<'all' | 'razorpay' | 'paypal'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load payment events');
      setEvents(data.events || []);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payment ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = events.filter((e) => {
    if (gatewayFilter !== 'all' && e.gateway !== gatewayFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  function exportCsv() {
    const headers = [
      'EventID',
      'InvoiceNumber',
      'Gateway',
      'EventType',
      'Role',
      'UID',
      'Currency',
      'Amount',
      'TaxAmount',
      'Status',
      'VerifiedSignature',
      'OccurredAt',
    ];
    const rows = filtered.map((e) => [
      e.id,
      e.invoiceNumber || '',
      e.gateway,
      e.eventType,
      e.role,
      e.uid,
      e.currency,
      String(e.amount),
      String(e.taxAmount),
      e.status,
      String(e.verifiedSignature),
      e.occurredAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpo-payments-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#111827]" />
            Payments & Transactions
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Real-time billing transactions, Razorpay and PayPal subscription payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-black shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="text-[11px] font-bold uppercase text-[#6B7280]">
            Captured Domestic Revenue (INR)
          </div>
          <div className="text-2xl font-extrabold text-[#111827] mt-1">
            ₹{summary.totalInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Razorpay AutoPay Mandates
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="text-[11px] font-bold uppercase text-[#6B7280]">
            Collected GST Component (INR)
          </div>
          <div className="text-2xl font-extrabold text-[#111827] mt-1">
            ₹{summary.totalGstInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1">Tax-compliant domestic invoices</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="text-[11px] font-bold uppercase text-[#6B7280]">
            Captured Global Revenue (USD)
          </div>
          <div className="text-2xl font-extrabold text-[#111827] mt-1">
            ${summary.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-1">
            PayPal Subscriptions AutoPay
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="text-[11px] font-bold uppercase text-[#6B7280]">
            Failed / Halted Webhook Charges
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {summary.failedEventsCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1">Auto-notified via WhatsApp</div>
        </div>
      </div>

      {/* Filters + Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value as 'all' | 'razorpay' | 'paypal')}
              className="px-3 py-1.5 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
            >
              <option value="all">All Gateways</option>
              <option value="razorpay">Razorpay (INR)</option>
              <option value="paypal">PayPal (USD)</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured</option>
              <option value="mandate_authorized">Mandate Authorized</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <span className="text-[#6B7280] font-semibold">
            Showing {filtered.length} verified webhook events
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
            <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading payment events...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Invoice / Event</th>
                  <th className="px-4 py-3">Gateway & Event</th>
                  <th className="px-4 py-3">Customer / Role</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">GST / Tax</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Signature</th>
                  <th className="px-4 py-3">Occurred At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[#6B7280]">
                      No payment webhook events match your current filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-[#111827]">
                          {ev.invoiceNumber || ev.id}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B7280]">
                          Sub: {ev.subscriptionId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="uppercase font-bold text-[#111827]">{ev.gateway}</div>
                        <div className="font-mono text-[11px] text-[#6B7280]">{ev.eventType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[#111827]">{ev.uid}</div>
                        <div className="capitalize text-[11px] text-[#6B7280]">{ev.role}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#111827]">
                        {ev.currency === 'INR' ? `₹${ev.amount}` : `$${ev.amount}`}
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">
                        {ev.currency === 'INR' ? `₹${ev.taxAmount}` : `$${ev.taxAmount}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ev.status === 'captured'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ev.verifiedSignature ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        {new Date(ev.occurredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
