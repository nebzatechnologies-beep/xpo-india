'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  PlugZap,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCheck
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/whatsapp/connect').then(r => r.json()),
      fetch('/api/whatsapp/campaigns').then(r => r.json()),
      fetch('/api/whatsapp/inbox').then(r => r.json()),
    ]).then(([connRes, campRes, convRes]) => {
      if (connRes.success) setData(connRes.data);
      if (campRes.success) setCampaigns(campRes.data);
      if (convRes.success) setConversations(convRes.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp Marketing & Notification Centre</h1>
            <Badge variant="success" className="text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              WABA CONNECTED
            </Badge>
          </div>
          <p className="text-xs text-[#717171] mt-0.5">
            Meta Cloud API broadcast infrastructure, CRM lead distribution, and customer conversation hub.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/whatsapp/connect">
            <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5">
              <PlugZap className="w-3.5 h-3.5 text-[#E8192C]" /> WABA Credentials
            </Button>
          </Link>
          <Link href="/admin/whatsapp/campaigns/create">
            <Button size="sm" className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> + Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Status</div>
          <div className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Live 200 OK
          </div>
          <div className="text-[9px] text-[#717171] mt-0.5">+91 98200 99881</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Eligible Contacts</div>
          <div className="text-xl font-black text-[#222222] mt-1">2,410</div>
          <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Verified Opt-Ins</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Dispatched</div>
          <div className="text-xl font-black text-[#222222] mt-1">12,480</div>
          <div className="text-[9px] text-[#717171] font-semibold mt-0.5">Last 30 Days</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Delivered</div>
          <div className="text-xl font-black text-emerald-600 mt-1">98.4%</div>
          <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">12,280 msgs</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Failed</div>
          <div className="text-xl font-black text-rose-600 mt-1">1.6%</div>
          <div className="text-[9px] text-rose-600 font-semibold mt-0.5">Invalid phones</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Inbound Replies</div>
          <div className="text-xl font-black text-blue-600 mt-1">28.2%</div>
          <div className="text-[9px] text-blue-600 font-semibold mt-0.5">3,520 replies</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Campaigns</div>
          <div className="text-xl font-black text-[#222222] mt-1">{campaigns.length}</div>
          <div className="text-[9px] text-[#717171] font-semibold mt-0.5">Active / Sched</div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Est. Spend</div>
          <div className="text-xl font-black text-[#222222] mt-1">₹10,890</div>
          <div className="text-[9px] text-[#717171] font-semibold mt-0.5">₹0.88 / utility</div>
        </Card>
      </div>

      {/* Main Grid: Campaign Funnel & Live Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Campaigns Table */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBEBEB]">
              <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#E8192C]" /> Active & Recent Bulk Campaigns
              </div>
              <Link href="/admin/whatsapp/campaigns" className="text-xs font-bold text-[#E8192C] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                  <tr>
                    <th className="p-3">Campaign Name</th>
                    <th className="p-3">Audience Segment</th>
                    <th className="p-3">Dispatched</th>
                    <th className="p-3">Delivered</th>
                    <th className="p-3">Spend</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-[#FDFDFD]">
                      <td className="p-3 font-bold text-[#222222]">
                        <Link href={`/admin/whatsapp/campaigns/${camp.id}`} className="hover:text-[#E8192C]">
                          {camp.name}
                        </Link>
                        <div className="text-[10px] text-[#717171] font-normal">{camp.type}</div>
                      </td>
                      <td className="p-3 text-[#555555]">{camp.audienceName}</td>
                      <td className="p-3 font-semibold text-[#222222]">{camp.sent} msgs</td>
                      <td className="p-3 text-emerald-600 font-semibold">{camp.delivered}</td>
                      <td className="p-3 font-mono font-bold">₹{camp.spend}</td>
                      <td className="p-3 text-right">
                        <Badge
                          variant={camp.status === 'running' ? 'primary' : camp.status === 'completed' ? 'success' : 'neutral'}
                          className="text-[10px]"
                        >
                          {camp.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Conversations Mini Feed */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBEBEB]">
              <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" /> Recent Inbound Inquiries
              </div>
              <Link href="/admin/whatsapp/inbox" className="text-xs font-bold text-emerald-600 hover:underline">
                Open Inbox →
              </Link>
            </div>

            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href="/admin/whatsapp/inbox"
                  className="block p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-[#EBEBEB]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#222222]">{conv.contactName}</span>
                    <span className="text-[10px] text-[#717171]">{conv.lastMessageTime}</span>
                  </div>
                  <div className="text-[10px] text-[#555555] font-semibold">{conv.company}</div>
                  <div className="text-[11px] text-[#717171] mt-1 line-clamp-1 italic">
                    &quot;{conv.lastMessage}&quot;
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}