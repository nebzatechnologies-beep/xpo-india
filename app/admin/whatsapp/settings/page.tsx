'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ShieldCheck, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp API Settings & Webhooks</h1>
        <p className="text-xs text-[#717171] mt-0.5">Global parameters, rate pacing, fallback channels, and webhook security keys.</p>
      </div>

      <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="font-bold text-sm text-[#222222] pb-2 border-b border-[#EBEBEB] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#E8192C]" /> Active Configuration
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
            <span>Cloud API Provider:</span>
            <span className="font-bold text-[#222222]">Meta Cloud API Graph v20.0</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
            <span>Verified Phone:</span>
            <span className="font-mono font-bold text-emerald-600">+91 98200 99881</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
            <span>Rate Pacing:</span>
            <span className="font-bold text-[#222222]">80 messages / second</span>
          </div>
          <div className="flex justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
            <span>Webhook Status:</span>
            <Badge variant="success" className="text-[10px]">200 OK VERIFIED</Badge>
          </div>
        </div>

        <div className="pt-2 text-right">
          <Link href="/admin/whatsapp/connect">
            <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
              Modify WABA Credentials
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
