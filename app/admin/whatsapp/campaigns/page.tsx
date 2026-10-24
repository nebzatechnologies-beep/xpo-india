'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, ArrowRight, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

interface CampaignItem {
  id: string;
  name: string;
  type: string;
  audienceName: string;
  eligibleRecipients: number;
  scheduledDate?: string;
  sent: number;
  delivered: number;
  replies: number;
  spend: number;
  status: string;
  createdAt: string;
}

export default function BulkCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'scheduled' | 'completed' | 'draft'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/whatsapp/campaigns')
      .then(res => res.json())
      .then(res => {
        if (res.success) setCampaigns(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Bulk WhatsApp Campaigns</h1>
          <p className="text-xs text-[#717171] mt-0.5">High-volume outbound broadcasts, company acquisition invitations, and lead opportunity dispatches.</p>
        </div>

        <Link href="/admin/whatsapp/campaigns/create">
          <Button size="sm" className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Launch New Campaign
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl w-fit text-xs font-semibold">
        {(['all', 'running', 'scheduled', 'completed', 'draft'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
              activeTab === tab ? 'bg-white text-[#222222] shadow-xs' : 'text-[#717171]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Campaign Name & Type</th>
                <th className="p-4">Target Audience</th>
                <th className="p-4">Eligible</th>
                <th className="p-4">Sent / Delivered</th>
                <th className="p-4">Replies</th>
                <th className="p-4">Spend</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Analytics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-[#FDFDFD]">
                  <td className="p-4">
                    <Link href={`/admin/whatsapp/campaigns/${c.id}`} className="font-bold text-[#222222] hover:text-[#E8192C] block">
                      {c.name}
                    </Link>
                    <div className="text-[10px] text-[#717171]">{c.type}</div>
                  </td>
                  <td className="p-4 text-[#555555] font-semibold">{c.audienceName}</td>
                  <td className="p-4 font-bold text-[#222222]">{c.eligibleRecipients}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[#222222]">{c.sent} sent</div>
                    <div className="text-[10px] text-emerald-600 font-bold">{c.delivered} delivered</div>
                  </td>
                  <td className="p-4 font-bold text-blue-600">{c.replies || 0}</td>
                  <td className="p-4 font-mono font-bold text-[#222222]">₹{c.spend}</td>
                  <td className="p-4">
                    <Badge
                      variant={c.status === 'running' ? 'primary' : c.status === 'completed' ? 'success' : 'neutral'}
                      className="text-[10px]"
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/whatsapp/campaigns/${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg border-[#EBEBEB]">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Funnel
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
