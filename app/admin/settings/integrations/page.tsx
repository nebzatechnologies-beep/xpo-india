'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workflow, ArrowRight, CheckCircle2, MessageCircle, Database } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Integrations & External Automation</h1>
        <p className="text-xs text-[#717171] mt-0.5">
          Connect XPO with external automation servers, notification engines, and CRM pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hostinger n8n */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col justify-between hover:border-rose-300 transition-all shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-50 text-[#E8192C] rounded-2xl">
                <Workflow className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-rose-200 text-[#E8192C] bg-rose-50 text-xs font-semibold">
                Active Bridge
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Hostinger n8n Automation</h3>
              <p className="text-xs text-[#717171] mt-1">
                Automate WhatsApp notifications, email alerts, lead deadline reminders, partner matching, and daily Superadmin summaries silently in the background.
              </p>
            </div>
            <ul className="text-xs text-[#555555] space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time Firebase Event Hooks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> HMAC-SHA256 Payload Signing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Machine API Key Auth for Inbound Calls
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link href="/admin/settings/integrations/n8n">
              <Button variant="primary" size="md" className="w-full rounded-2xl font-semibold gap-2">
                Configure n8n Bridge <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* WhatsApp Meta WABA */}
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white flex flex-col justify-between hover:border-emerald-300 transition-all shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold">
                Native Engine
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Meta WhatsApp Business Cloud API</h3>
              <p className="text-xs text-[#717171] mt-1">
                Direct WhatsApp Business Cloud API integration for template broadcasts, live customer inbox, and transactional messaging.
              </p>
            </div>
            <ul className="text-xs text-[#555555] space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Official Meta Approved Templates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Live Interactive Inbox
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link href="/admin/whatsapp">
              <Button variant="secondary" size="md" className="w-full rounded-2xl font-semibold gap-2">
                Manage WhatsApp <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
