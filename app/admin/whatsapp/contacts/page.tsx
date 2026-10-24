'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Copy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crm/contacts')
      .then(res => res.json())
      .then(res => {
        if (res.success) setContacts(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyInvite = (c: any) => {
    navigator.clipboard.writeText(`Hi ${c.name}, view live requirements on XPO India: https://xpoindia.com?ref=${c.id}`);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp Contact Database</h1>
          <p className="text-xs text-[#717171] mt-0.5">Verified WhatsApp-ready contacts with delivery consent records.</p>
        </div>
        <Link href="/admin/whatsapp/campaigns/create">
          <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
            Broadcast to Contacts
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Contact & Company</th>
                <th className="p-4">WhatsApp Number</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Consent Status</th>
                <th className="p-4">Campaigns Sent</th>
                <th className="p-4 text-right">Direct Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-[#FDFDFD]">
                  <td className="p-4">
                    <div className="font-bold text-[#222222]">{c.name}</div>
                    <div className="text-[10px] text-[#717171]">{c.company}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#222222]">{c.whatsapp}</td>
                  <td className="p-4 text-[#555555]">{c.industry}</td>
                  <td className="p-4">
                    <Badge variant={c.consentStatus === 'opted_in' ? 'success' : 'neutral'} className="text-[10px]">
                      {c.consentStatus === 'opted_in' ? 'OPTED-IN' : 'OPTED-OUT'}
                    </Badge>
                  </td>
                  <td className="p-4 font-semibold text-[#222222]">{c.campaignHistoryCount || 1} campaigns</td>
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => copyInvite(c)}
                      title="Copy Invite"
                      className="p-1.5 rounded-lg border border-[#EBEBEB] hover:bg-neutral-50 inline-flex items-center text-[#555555]"
                    >
                      {copiedId === c.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${c.name}, greeting from XPO India.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 inline-flex items-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
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
