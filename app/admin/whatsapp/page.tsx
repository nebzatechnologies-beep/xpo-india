'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, PlugZap, Workflow, PlaySquare, Inbox, ScrollText } from 'lucide-react';

export default function AdminWhatsAppOverviewPage() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [summary, setSummary] = useState<{
    totalMessages: number;
    failedMessages: number;
    totalEstimatedCostInr: number;
    activeOffers: number;
    expiredOffers: number;
  } | null>(null);
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    async function load() {
      const [cfgRes, logRes, inbRes] = await Promise.all([
        fetch('/api/admin/whatsapp/config'),
        fetch('/api/admin/whatsapp/logs'),
        fetch('/api/admin/whatsapp/inbox'),
      ]);
      if (cfgRes.ok) {
        const d = await cfgRes.json();
        setPhoneNumberId(d.config?.phoneNumberId || '');
        setHasToken(Boolean(d.config?.hasAccessToken));
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setSummary(d.summary || null);
      }
      if (inbRes.ok) {
        const d = await inbRes.json();
        setActiveSessions((d.sessions || []).length);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">
            Official Meta WhatsApp Cloud API (v21.0) Control Suite
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Persistent 18-state conversation engine, Conversation Builder, 5-minute lead offer
            clock, human takeover inbox, and Firestore-backed Simulator.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/whatsapp/simulator"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <PlaySquare className="w-4 h-4" /> Open Simulator
          </Link>
          <Link
            href="/admin/whatsapp/connect"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <PlugZap className="w-4 h-4" /> API Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] text-[#6B7280]">Meta WABA Status</div>
          <div className="text-base font-extrabold mt-1">
            {hasToken && phoneNumberId ? 'Connected' : 'Credentials Pending'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] text-[#6B7280]">Live Sessions</div>
          <div className="text-2xl font-black mt-1">{activeSessions}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] text-[#6B7280]">Active 5-Min Offers</div>
          <div className="text-2xl font-black text-[#E8192C] mt-1">
            {summary?.activeOffers ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] text-[#6B7280]">Failed Deliveries</div>
          <div className="text-2xl font-black mt-1">{summary?.failedMessages ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="text-[11px] text-[#6B7280]">Estimated Meta Cost</div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            ₹{summary?.totalEstimatedCostInr ?? 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/whatsapp/builder"
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <Workflow className="w-5 h-5 text-[#111827] mb-2" />
          <div className="font-bold text-sm">Conversation Builder</div>
          <p className="text-xs text-[#6B7280] mt-1">
            Edit Welcome, Client, and Partner WhatsApp conversation flows.
          </p>
        </Link>
        <Link
          href="/admin/whatsapp/inbox"
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <Inbox className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-sm">Support Takeover Inbox</div>
          <p className="text-xs text-[#6B7280] mt-1">
            Pause automation on SUPPORT_REVIEW chats and reply manually.
          </p>
        </Link>
        <Link
          href="/admin/whatsapp/templates"
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <MessageCircle className="w-5 h-5 text-emerald-600 mb-2" />
          <div className="font-bold text-sm">Templates & Meta Sync</div>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage Utility, Authentication & Marketing templates synced from Meta.
          </p>
        </Link>
        <Link
          href="/admin/whatsapp/logs"
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <ScrollText className="w-5 h-5 text-amber-600 mb-2" />
          <div className="font-bold text-sm">Webhook & Delivery Logs</div>
          <p className="text-xs text-[#6B7280] mt-1">
            Inspect sent/delivered/read receipts, 5-min expiry events & costs.
          </p>
        </Link>
      </div>
    </div>
  );
}
