'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, MessageCircle, Copy, ExternalLink, Share2, Check } from 'lucide-react';

interface LeadItem {
  _id: string;
  xpoId: string;
  title: string;
  description: string;
  status: string;
  category?: { name: string; slug: string };
  creator?: { name: string; email: string };
  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  isDistributed?: boolean;
  distributedAt?: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareModalLead, setShareModalLead] = useState<LeadItem | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(`/api/admin/leads?${params.toString()}`)
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

  const getFormattedMessage = (lead: LeadItem) => {
    const budget = lead.budgetMin && lead.budgetMax ? `₹${lead.budgetMin.toLocaleString()} - ₹${lead.budgetMax.toLocaleString()}` : 'Budget on Discussion';
    const link = `https://xpoindia.com/opportunities/${lead._id}`;
    return `📢 *NEW OPPORTUNITY ON XPO INDIA*\n\n🎯 *Requirement:* ${lead.title}\n📂 *Classification:* ${lead.category?.name || 'Industrial'}\n💰 *Target Budget:* ${budget}\n📍 *Delivery Location:* ${lead.city || 'India'}\n🆔 *Tracking Code:* ${lead.xpoId}\n\n👉 *Review & Submit Your Proposal Directly:*\n${link}\n\n_Distributed via XPO India Direct Exchange_`;
  };

  const handleCopyMessage = () => {
    if (!shareModalLead) return;
    navigator.clipboard.writeText(getFormattedMessage(shareModalLead));
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyLink = () => {
    if (!shareModalLead) return;
    navigator.clipboard.writeText(`https://xpoindia.com/opportunities/${shareModalLead._id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMarkDistributed = () => {
    if (!shareModalLead) return;
    setLeads(leads.map(l => l._id === shareModalLead._id ? { ...l, isDistributed: true, distributedAt: 'Just now' } : l));
    setShareModalLead({ ...shareModalLead, isDistributed: true, distributedAt: 'Just now' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Lead Moderation & WhatsApp Distribution</h1>
        <p className="text-xs text-[#717171] mt-0.5">Audit requirements across sectors, approve new posts, and distribute leads directly via WhatsApp.</p>
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
                {lead.isDistributed && (
                  <Badge variant="success" className="text-[10px] bg-emerald-100 text-emerald-800">
                    <Check className="w-3 h-3 mr-0.5" /> DISTRIBUTED
                  </Badge>
                )}
                <span className="text-xs text-[#717171]">{lead.category?.name}</span>
              </div>
              <h3 className="text-sm font-bold text-[#222222]">{lead.title}</h3>
              <p className="text-xs text-[#717171] mt-0.5 line-clamp-1">{lead.description}</p>
              <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-800 font-bold px-1.5 py-0">
                  Client Poster
                </Badge>
                {lead.creator?.name || 'Verified Client Enterprise'} ({lead.creator?.email || 'client@xpoindia.com'})
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalLead(lead)}
                className="rounded-xl text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Share Lead
              </Button>

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

      {/* Part 11: Share Lead Modal */}
      {shareModalLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-[#EBEBEB] shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#222222]">Share Lead via WhatsApp</h3>
                  <p className="text-[11px] text-[#717171]">{shareModalLead.xpoId} • {shareModalLead.title}</p>
                </div>
              </div>

              <button onClick={() => setShareModalLead(null)} className="text-[#717171] hover:text-[#222222] font-bold text-sm">
                ✕
              </button>
            </div>

            {/* Formatted Message Preview */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#717171] uppercase tracking-wider block">
                Formatted WhatsApp Notification Text
              </label>
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#DDD5C7] text-xs font-sans whitespace-pre-wrap leading-relaxed text-[#111B21] max-h-60 overflow-y-auto">
                {getFormattedMessage(shareModalLead)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#EBEBEB] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyMessage}
                  className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMessage ? 'Message Copied!' : 'COPY MESSAGE'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Link Copied!' : 'COPY LINK'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkDistributed}
                  className={`text-xs font-semibold rounded-xl border-[#EBEBEB] ${
                    shareModalLead.isDistributed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''
                  }`}
                >
                  {shareModalLead.isDistributed ? '✓ DISTRIBUTED' : 'MARK AS DISTRIBUTED'}
                </Button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getFormattedMessage(shareModalLead))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="sm"
                    className="bg-[#00A884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> OPEN WHATSAPP
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}