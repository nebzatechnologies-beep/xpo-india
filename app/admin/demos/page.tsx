'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe2,
  Building2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Eye,
  Zap,
} from 'lucide-react';

export default function AdminDeploymentDemosPage() {
  const [activeSimulator, setActiveSimulator] = useState<'domestic' | 'global'>('domestic');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 text-xs font-bold">
              👑 Enterprise Architecture
            </Badge>
            <span className="text-xs text-[#717171]">/ Multi-Region Deployments</span>
          </div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            Deployment Demos & Multi-Regional Configurations
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Preview, test, and demonstrate distinct production deployments for Domestic (India) and Global (Worldwide).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <span>Domestic Demo (/)</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#717171]" />
            </Button>
          </Link>
          <Link href="/global" target="_blank">
            <Button size="sm" className="rounded-xl text-xs font-bold bg-[#111827] text-white hover:bg-black flex items-center gap-1.5 shadow-sm">
              <span>Global Demo (/global)</span>
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Side-by-Side Deployment Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile 1: XPO India Domestic */}
        <Card className="p-7 rounded-3xl border-2 border-red-200 bg-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full blur-2xl -mr-10 -mt-10" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E8192C] border border-red-200">
                <span>🇮🇳</span> Profile A: XPO India
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                ● Live Domestic
              </span>
            </div>

            <h2 className="text-xl font-black text-[#111827] tracking-tight">
              Domestic B2B Procurement & Industrial Exchange
            </h2>
            <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
              Configured for the domestic Indian industrial ecosystem, covering manufacturing hubs across Peenya, Pune, Coimbatore, Peenya, Ahmedabad, and Gurgaon.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-[#374151]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Primary Currency:</span>
                <span className="font-bold text-[#111827]">INR (₹ Indian Rupee)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Payment Gateway Stack:</span>
                <span className="font-bold text-[#111827]">Razorpay, UPI AutoPay, NetBanking</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Annual Subscription Tier:</span>
                <span className="font-bold text-[#E8192C]">₹999 / year (with GST Input Tax Credit)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Tax & Regulatory:</span>
                <span className="font-bold text-[#111827]">GSTIN Verification, PAN, e-Waybills</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#6B7280]">Cross-Border Capability:</span>
                <span className="font-bold text-emerald-700">✓ Can hire & connect with overseas talent</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EBEBEB] flex flex-wrap gap-2.5">
            <Link href="/" target="_blank" className="flex-1">
              <Button size="sm" className="w-full rounded-xl text-xs font-bold bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Launch Domestic Landing Page</span>
              </Button>
            </Link>
            <Link href="/creator/dashboard">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                Creator View (INR)
              </Button>
            </Link>
          </div>
        </Card>

        {/* Profile 2: XPO Global */}
        <Card className="p-7 rounded-3xl border-2 border-blue-200 bg-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-10 -mt-10" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span>🌐</span> Profile B: XPO Global
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                ● Live Global
              </span>
            </div>

            <h2 className="text-xl font-black text-[#111827] tracking-tight">
              Cross-Border Sourcing & Global Talent Gateway
            </h2>
            <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
              Configured for international sourcing managers (USA, Germany, UAE, Singapore, Japan, UK) contracting directly with vetted Indian manufacturers & engineering talent.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-[#374151]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Primary Currency:</span>
                <span className="font-bold text-[#111827]">USD ($ United States Dollar)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Payment Gateway Stack:</span>
                <span className="font-bold text-[#111827]">PayPal Subscriptions, International Cards</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Annual Subscription Tier:</span>
                <span className="font-bold text-blue-700">$49 / year (International Billing)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Tax & Regulatory:</span>
                <span className="font-bold text-[#111827]">IEC Codes, HS Classifications, Export Compliance</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#6B7280]">Cross-Border Capability:</span>
                <span className="font-bold text-emerald-700">✓ Can hire & connect with Indian engineering talent</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EBEBEB] flex flex-wrap gap-2.5">
            <Link href="/global" target="_blank" className="flex-1">
              <Button size="sm" className="w-full rounded-xl text-xs font-bold bg-[#111827] hover:bg-black text-white flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Launch Global Landing Page</span>
              </Button>
            </Link>
            <Link href="/absorber/opportunities">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                Exchange View (USD)
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Feature Comparison Matrix */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white">
        <h3 className="text-base font-extrabold text-[#111827] mb-4">
          Regional Deployment Feature & Compliance Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Dimension</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[#E8192C]">🇮🇳 Domestic (XPO India)</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-blue-600">🌐 Global (XPO Global)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
              <tr>
                <td className="py-3 px-3 font-semibold">Target User Base</td>
                <td className="py-3 px-3">Indian MSMEs, OEMs, Tier-1/2 Suppliers</td>
                <td className="py-3 px-3">Overseas Importers, Global Procurement Directors</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold">Eligible Plans</td>
                <td className="py-3 px-3 font-bold text-[#E8192C]">Domestic INR Plans Only (₹999/yr)</td>
                <td className="py-3 px-3 font-bold text-blue-600">Global USD Plans Only ($49/yr)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold">Cross-Border Connections</td>
                <td className="py-3 px-3 text-emerald-700 font-semibold">Allowed (Hire foreign talent / source overseas)</td>
                <td className="py-3 px-3 text-emerald-700 font-semibold">Allowed (Hire Indian manufacturers / contract work)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold">Payment Rail</td>
                <td className="py-3 px-3">Razorpay (UPI, NetBanking, Domestic Cards)</td>
                <td className="py-3 px-3">PayPal (International Cards, Cross-Border Wallets)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold">Landing Route</td>
                <td className="py-3 px-3 font-mono font-bold text-[#111827]">http://localhost:3000/</td>
                <td className="py-3 px-3 font-mono font-bold text-[#111827]">http://localhost:3000/global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
