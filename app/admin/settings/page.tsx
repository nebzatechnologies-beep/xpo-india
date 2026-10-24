'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Workflow, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">System & Gateway Settings</h1>
        <p className="text-xs text-[#717171] mt-0.5">Configure live production keys for Razorpay, PayPal, Firebase, and Hostinger n8n Automation.</p>
      </div>

      {/* Hostinger n8n Integration Highlight Card */}
      <Card className="p-6 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-orange-50/30 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#E8192C] text-white rounded-2xl shadow-md shrink-0">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#222222]">Hostinger n8n Automation Bridge</h3>
                <Badge variant="outline" className="border-rose-300 text-[#E8192C] bg-white text-[10px] font-bold">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-[#717171] mt-1 max-w-xl">
                Connect XPO Firebase backend with Hostinger n8n for automated WhatsApp/Email alerts, lead deadline reminders, partner audience matching & daily Superadmin activity reports.
              </p>
            </div>
          </div>
          <Link href="/admin/settings/integrations/n8n" className="shrink-0">
            <Button variant="primary" size="md" className="rounded-2xl font-semibold gap-2 shadow-sm">
              Configure n8n Bridge <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Razorpay */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">Razorpay (Domestic India)</h3>
            <p className="text-xs text-[#717171]">Used for ₹999/year domestic subscriptions, UPI, Cards, and AutoPay.</p>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs">
            Live Ready
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Key ID</label>
            <Input defaultValue="rzp_test_demo123" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Key Secret</label>
            <Input defaultValue="••••••••••••••••" type="password" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      {/* PayPal */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">PayPal (International)</h3>
            <p className="text-xs text-[#717171]">Used for $49/year global subscriptions across 190+ countries.</p>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">
            Sandbox / Live
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Client ID</label>
            <Input defaultValue="paypal_client_demo123" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Secret</label>
            <Input defaultValue="••••••••••••••••" type="password" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      {/* Firebase */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">Firebase Storage & Hosting</h3>
            <p className="text-xs text-[#717171]">Connected Live Account: tanmaydevsare@gmail.com (Project: xpo-india-ca951)</p>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-bold">
            Live Connected
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Project ID</label>
            <Input defaultValue="xpo-india-ca951" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#222222] block mb-1">Storage Bucket</label>
            <Input defaultValue="xpo-india-ca951.firebasestorage.app" className="rounded-xl border-[#EBEBEB] text-xs font-mono" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" size="md" className="rounded-2xl font-semibold px-6">
          Save Settings
        </Button>
      </div>
    </div>
  );
}