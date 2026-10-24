'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MessageSquare, ArrowLeft, Share2, Copy, Check, MessageCircle } from 'lucide-react';

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeads(data.leads || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleShare = (lead: any) => {
    const url = `https://xpoindia.com/opportunities/${lead._id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(lead._id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-[#E5E7EB]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          My Requirements
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Manage your posted requirements, review interested partners, and share your requirement links.
        </p>
      </div>

      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead._id} className="p-5 sm:p-6 rounded-3xl border border-[#EBEBEB] bg-white hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6 shadow-2xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-[#222222]">
                  {lead.xpoId}
                </span>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[11px] font-semibold">
                  {lead.status?.toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold text-[#717171]">{lead.category?.name}</span>
                <span className="text-xs text-[#717171]">• {lead.city || lead.country}</span>
                <span className="text-xs text-[#717171]">
                  • Budget: {lead.budgetOpenForDiscussion || !lead.budgetMax
                    ? 'Open for discussion'
                    : `${lead.budgetCurrency === 'USD' ? '$' : '₹'}${lead.budgetMax.toLocaleString()}`}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#222222]">{lead.title}</h3>
              <p className="text-xs text-[#717171] line-clamp-2 max-w-3xl">{lead.description}</p>
              {lead.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.tags.map((t: string, i: number) => (
                    <span key={i} className="text-[10px] bg-[#F7F7F7] px-2 py-0.5 rounded-full text-[#717171] border border-[#EBEBEB]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare(lead)}
                className="flex-1 sm:flex-initial rounded-xl font-semibold flex items-center justify-center gap-1.5 border-[#EBEBEB] text-xs h-9"
              >
                {copiedId === lead._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#E8192C]" />}
                {copiedId === lead._id ? 'Copied!' : 'Share Link'}
              </Button>

              <Link href="/creator/responses" className="flex-1 sm:flex-initial">
                <Button size="sm" className="w-full sm:w-auto rounded-xl font-semibold bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center justify-center gap-1.5 h-9 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Interested Partners
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}