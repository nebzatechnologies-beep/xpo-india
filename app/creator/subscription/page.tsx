'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from '@/components/ui/paywall';
import { CheckCircle2, ShieldCheck, RefreshCw, CreditCard, Globe2, Zap } from 'lucide-react';

export default function CreatorSubscriptionPage() {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [autoPay, setAutoPay] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-6 border-b border-[#E5E7EB]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          Creator Membership & Billing
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Manage your domestic or international subscription, gateway auto-renewals, and tax invoicing.
        </p>
      </div>

      {/* Regional Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50/50 border border-red-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-red-200 text-[#E8192C] flex items-center justify-center font-bold text-lg shadow-xs">
            🇮🇳
          </div>
          <div>
            <div className="text-xs font-bold text-[#111827]">
              Domestic Indian Employer Account
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Restricted to Domestic INR Plans (₹999/yr with GST invoice). Cross-border talent hiring is enabled.
            </div>
          </div>
        </div>
        <Badge variant="outline" className="border-red-200 text-[#E8192C] bg-white text-xs font-semibold self-start sm:self-auto">
          Compliant Domestic Entity
        </Badge>
      </div>

      <Card className="p-5 sm:p-8 rounded-3xl border border-[#EBEBEB] bg-white shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#EBEBEB]">
          <div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold mb-2">
              Active Annual Plan
            </Badge>
            <h2 className="text-xl font-bold text-[#222222]">Lead Creator Annual (India)</h2>
            <div className="text-xs text-[#717171] mt-1">Billed at ₹999 / year via Razorpay UPI AutoPay</div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-3xl font-black text-[#222222]">₹999</span>
            <div className="text-xs text-[#717171]">Renews on 28 Sep 2027</div>
          </div>
        </div>

        {/* AutoPay toggle */}
        <div className="py-6 flex items-center justify-between border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${autoPay ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#222222]">Razorpay AutoPay (Recurring Renewal)</div>
              <div className="text-xs text-[#717171]">Seamless renewal without service interruption. Cancel anytime.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAutoPay(!autoPay)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              autoPay ? 'bg-[#E8192C]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                autoPay ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Cross-border capabilities */}
        <div className="pt-6 space-y-3">
          <div className="text-xs font-bold text-[#111827] flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-blue-600" />
            <span>Cross-Border Hiring & Sourcing Privileges</span>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Your Indian domestic plan allows you to broadcast RFQs and hire both local Indian manufacturers and verified foreign engineering talent without extra platform fees.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-semibold text-xs"
              onClick={() => setPaywallOpen(true)}
            >
              View Plan Specifications & Quotas
            </Button>
          </div>
        </div>
      </Card>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        role="creator"
        accountRegion="domestic"
      />
    </div>
  );
}