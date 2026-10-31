'use client';

import React, { useEffect, useState } from 'react';
import type { WhatsAppMessageRecord } from '@/lib/types/domain';

export default function AdminWhatsAppLogsPage() {
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalMessages: number;
    failedMessages: number;
    totalEstimatedCostInr: number;
    activeOffers: number;
    expiredOffers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/whatsapp/logs');
        if (res.ok) {
          const d = await res.json();
          setMessages(d.messages || []);
          setSummary(d.summary || null);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          WhatsApp Delivery, Webhook & Cost Telemetry
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Total Messages: {summary?.totalMessages ?? 0} • Failed: {summary?.failedMessages ?? 0} •
          Expired 5-Min Offers: {summary?.expiredOffers ?? 0} • Est. Meta Cost: ₹
          {summary?.totalEstimatedCostInr ?? 0}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        {loading ? (
          <p className="text-xs text-[#6B7280]">Loading message logs...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No production WhatsApp messages logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2">Time</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Dir / Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Cost (INR)</th>
                  <th className="py-2">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 font-mono">{m.phoneE164}</td>
                    <td className="py-2">
                      {m.direction} / {m.messageType}
                    </td>
                    <td className="py-2 font-bold">{m.deliveryStatus}</td>
                    <td className="py-2">₹{m.estimatedCostInr ?? 0}</td>
                    <td className="py-2 max-w-xs truncate">{m.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
