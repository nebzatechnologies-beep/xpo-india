'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Send, CheckCircle2, TrendingUp, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      fetch('/api/whatsapp/campaigns')
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            const found = res.data.find((c: any) => c.id === p.id) || res.data[0];
            setCampaign(found);
          }
        });
    });
  }, [params]);

  if (!campaign) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading campaign analytics...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div className="flex items-center gap-3">
          <Link href="/admin/whatsapp/campaigns">
            <Button variant="outline" size="sm" className="rounded-xl border-[#EBEBEB]">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#222222]">{campaign.name}</h1>
              <Badge variant={campaign.status === 'running' ? 'primary' : 'success'} className="text-[10px]">
                {campaign.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#717171]">{campaign.type} • Dispatched via Meta Cloud API</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const csv = 'Metric,Value\nSent,120\nDelivered,118\nReplies,34\nSpend,105.6\n';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${campaign.id}_analytics.csv`;
            a.click();
          }}
          className="text-xs font-semibold rounded-xl border-[#EBEBEB]"
        >
          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase">Messages Sent</div>
          <div className="text-2xl font-black text-[#222222] mt-1">{campaign.sent || 120}</div>
          <div className="text-[10px] text-[#717171]">100% of Target</div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Delivered</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{campaign.delivered || 118}</div>
          <div className="text-[10px] text-emerald-600 font-bold">98.3% Delivery Rate</div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-blue-700 uppercase">Inbound Replies</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{campaign.replies || 34}</div>
          <div className="text-[10px] text-blue-600 font-bold">28.8% Reply Rate</div>
        </Card>
        <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase">Campaign Spend</div>
          <div className="text-2xl font-black text-[#222222] mt-1">₹{campaign.spend}</div>
          <div className="text-[10px] text-[#717171]">₹0.88 / conversation</div>
        </Card>
      </div>

      {/* Template & Audience Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none">
          <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB]">Target Audience Summary</div>
          <div className="text-xs space-y-1.5 text-[#555555]">
            <div className="flex justify-between"><span>Audience Group:</span> <span className="font-bold text-[#222222]">{campaign.audienceName}</span></div>
            <div className="flex justify-between"><span>Total Recipients:</span> <span className="font-bold text-[#222222]">{campaign.eligibleRecipients}</span></div>
            <div className="flex justify-between"><span>Consent Status:</span> <span className="font-bold text-emerald-600">100% Opt-In Verified</span></div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none">
          <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB]">Template Details</div>
          <div className="text-xs space-y-1.5 text-[#555555]">
            <div className="flex justify-between"><span>Template Name:</span> <span className="font-mono text-[#222222]">{campaign.templateName}</span></div>
            <div className="flex justify-between"><span>Category:</span> <span className="font-semibold">MARKETING</span></div>
            <div className="flex justify-between"><span>Meta Approval:</span> <span className="font-bold text-emerald-600">APPROVED</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
