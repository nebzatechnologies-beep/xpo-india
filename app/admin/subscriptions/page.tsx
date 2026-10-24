'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Globe2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<'all' | 'domestic' | 'global'>('all');

  const plans = [
    {
      id: 'plan_creator_inr',
      name: 'Client (Requirement Poster) Plan — India Domestic',
      role: 'Client',
      region: 'domestic',
      price: '₹999',
      currency: 'INR',
      gateway: 'Razorpay AutoPay',
      cycle: 'annual',
      activeUsers: 42,
      features: [
        'Post unlimited requirement leads/month',
        'Instant WhatsApp & Email broadcast to Partners',
        'GST-compliant B2B invoicing',
        'Direct phone unmasking on Partner handshake',
        'Cross-border: Can hire overseas engineering talent',
      ],
    },
    {
      id: 'plan_creator_usd',
      name: 'Client (Requirement Poster) Plan — Global Sourcing',
      role: 'Client',
      region: 'global',
      price: '$49',
      currency: 'USD',
      gateway: 'PayPal Subscriptions',
      cycle: 'annual',
      activeUsers: 18,
      features: [
        'International overseas procurement',
        'Post unlimited global requirements',
        'Priority audience matching with Indian Partners',
        'Cross-border escrow & customs tracking',
        'Direct supplier video & WhatsApp handshakes',
      ],
    },
    {
      id: 'plan_absorber_inr',
      name: 'Partner (Solution Provider) Pass — India Domestic',
      role: 'Partner',
      region: 'domestic',
      price: '₹999',
      currency: 'INR',
      gateway: 'Razorpay AutoPay',
      cycle: 'annual',
      activeUsers: 84,
      features: [
        'Direct access to domestic Client requirements',
        'Submit unlimited capability proposals',
        'GST credit input invoicing',
        'Verified Indian Partner / MSME Badge',
        'Cross-border: Can bid on overseas export RFQs',
      ],
    },
    {
      id: 'plan_absorber_usd',
      name: 'Partner (Solution Provider) Pass — Global Provider',
      role: 'Partner',
      region: 'global',
      price: '$49',
      currency: 'USD',
      gateway: 'PayPal Subscriptions',
      cycle: 'annual',
      activeUsers: 29,
      features: [
        'Global overseas Client leads access',
        'Submit unlimited commercial quotations',
        'International verified Partner badge',
        'Multi-currency bidding (USD, EUR, GBP)',
        'Cross-border: Connect with Indian & global Clients',
      ],
    },
  ];

  const filteredPlans = plans.filter((p) => {
    if (tab === 'all') return true;
    return p.region === tab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            Subscription Pricing & Regional Quotas
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Strict regional distinction: Domestic INR pricing via Razorpay vs Global USD pricing via PayPal.
          </p>
        </div>

        <Link href="/admin/demos">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold flex items-center gap-1.5 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Open Deployment Demos Console ↗</span>
          </Button>
        </Link>
      </div>

      {/* Regional Partition Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#717171]">Domestic Volume</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E8192C]">₹ INR</span>
          </div>
          <div className="mt-3 text-2xl font-black text-[#222222]">₹1,25,874</div>
          <div className="mt-1 text-[11px] text-[#717171]">126 Active Indian subscribers</div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#717171]">International Volume</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">$ USD</span>
          </div>
          <div className="mt-3 text-2xl font-black text-[#222222]">$2,303</div>
          <div className="mt-1 text-[11px] text-[#717171]">47 Active Global subscribers</div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#717171]">Domestic Gateway</span>
            <CreditCard className="w-4 h-4 text-[#E8192C]" />
          </div>
          <div className="mt-3 text-sm font-bold text-[#222222]">Razorpay UPI AutoPay</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">● 100% Operational (INR)</div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#717171]">Global Gateway</span>
            <Globe2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-sm font-bold text-[#222222]">PayPal Subscriptions</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">● 100% Operational (USD)</div>
        </Card>
      </div>

      {/* Regional Regulatory Policy Card */}
      <Card className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[#111827]">
              Regional Billing Distinction & Cross-Border Connection Logic
            </span>
            <p className="text-[#4B5563] leading-relaxed">
              • <strong>Domestic Entities (India)</strong>: Can only subscribe to Indian plans (₹999/yr in INR via Razorpay) for tax & GST compliance.<br />
              • <strong>Global Entities (Overseas)</strong>: Can only subscribe to Global plans ($49/yr in USD via PayPal).<br />
              • <strong>Borderless Liquidity</strong>: Indian employers can always hire and connect with foreign engineering talent; foreign buyers can always hire and connect with Indian manufacturers.
            </p>
          </div>
        </div>
      </Card>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            tab === 'all'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'text-[#6B7280] hover:text-[#111827] bg-white border border-[#E5E7EB]'
          }`}
        >
          All Plans ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('domestic')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            tab === 'domestic'
              ? 'bg-[#E8192C] text-white shadow-xs'
              : 'text-[#6B7280] hover:text-[#111827] bg-white border border-[#E5E7EB]'
          }`}
        >
          <span>🇮🇳</span>
          <span>Domestic India (INR ₹)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('global')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            tab === 'global'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[#6B7280] hover:text-[#111827] bg-white border border-[#E5E7EB]'
          }`}
        >
          <span>🌐</span>
          <span>Global International (USD $)</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlans.map((p) => {
          const isDom = p.region === 'domestic';
          return (
            <Card
              key={p.id}
              className={`p-6 rounded-3xl border bg-white flex flex-col justify-between shadow-2xs ${
                isDom ? 'border-red-100 hover:border-red-200' : 'border-blue-100 hover:border-blue-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      isDom
                        ? 'border-red-200 text-[#E8192C] bg-red-50'
                        : 'border-blue-200 text-blue-700 bg-blue-50'
                    }`}
                  >
                    {isDom ? '🇮🇳 Domestic Plan' : '🌐 Global Plan'} • {p.gateway}
                  </Badge>
                  <span className="text-xs text-[#717171] font-semibold">
                    {p.activeUsers} Active Subscribers
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#222222]">{p.name}</h3>

                <div className="text-2xl font-black text-[#222222] mt-2">
                  {p.price}{' '}
                  <span className="text-xs font-normal text-[#717171]">
                    / year ({p.currency})
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-2">
                  <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Tier Entitlements:
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#4B5563]">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isDom ? 'text-[#E8192C]' : 'text-blue-600'
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EBEBEB] flex items-center justify-between">
                <span className="text-xs text-[#717171]">
                  AutoPay: <strong className="text-emerald-600">Enabled</strong>
                </span>
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                  Edit Pricing & Quotas
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}