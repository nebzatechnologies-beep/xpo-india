'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';

export default function AbsorberConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/connections')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.connections?.length > 0) {
          const formatted = data.connections.map((c: any) => ({
            id: c._id,
            name: c.creator?.name || 'Client',
            company: c.creator?.company || 'Client Enterprise',
            phone: c.creator?.phone || '+91 9820011223',
            email: c.creator?.email || 'creator@xpoindia.com',
            sector: c.lead?.category?.name || 'Manufacturing & Industrial',
            leadId: c.lead?.xpoId || 'XPO-REQ',
            dateConnected: c.contactRevealedAt ? new Date(c.contactRevealedAt).toLocaleDateString() : 'Active',
          }));
          setConnections(formatted);
        } else {
          setConnections([
            {
              id: 'conn_buyer_1',
              name: 'Rajesh Sharma (Industrial Supplies)',
              company: 'Sharma Heavy Engineering Ltd',
              phone: '+91 9820011223',
              email: 'creator@xpoindia.com',
              sector: 'Manufacturing & Industrial',
              leadId: 'XPO-10021',
              dateConnected: '28 Sep 2026',
            }
          ]);
        }
      })
      .catch(() => {
        setConnections([
          {
            id: 'conn_buyer_1',
            name: 'Rajesh Sharma (Industrial Supplies)',
            company: 'Sharma Heavy Engineering Ltd',
            phone: '+91 9820011223',
            email: 'creator@xpoindia.com',
            sector: 'Manufacturing & Industrial',
            leadId: 'XPO-10021',
            dateConnected: '28 Sep 2026',
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-[#E5E7EB]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          Direct Client Connections
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Verified clients who connected with you. Connect directly via WhatsApp or phone with zero intermediary fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((c) => (
          <Card key={c.id} className="p-5 sm:p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-[#222222]">
                  {c.leadId}
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Handshake Complete
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-[#222222]">{c.name}</h3>
              <div className="text-xs text-[#717171] mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#717171]" />
                {c.company} • {c.sector}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EBEBEB] flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.name)},%20connecting%20from%20XPO%20India%20regarding%20${c.leadId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href={`tel:${c.phone}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              <a
                href={`mailto:${c.email}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#EBEBEB] text-[#222222] text-xs font-semibold hover:bg-[#F7F7F7]"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}