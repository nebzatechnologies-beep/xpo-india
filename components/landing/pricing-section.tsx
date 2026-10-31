'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Globe2, Zap } from 'lucide-react';

export interface PricingSettings {
  partnerFreeClaims: number;
  partnerPaidMonthlyClaims: number;
  partnerPlanUnlimited?: boolean;
  partnerInrMonthlyPrice: number;
  partnerUsdMonthlyPrice: number;
  clientFreePartnerViews: number;
  clientPaidMonthlyPartnerViews: number;
  clientPlanUnlimited?: boolean;
  clientInrMonthlyPrice: number;
  clientUsdMonthlyPrice: number;
  gstPercentInr: number;
}

const DEFAULT_SETTINGS: PricingSettings = {
  partnerFreeClaims: 5,
  partnerPaidMonthlyClaims: 30,
  partnerPlanUnlimited: false,
  partnerInrMonthlyPrice: 299,
  partnerUsdMonthlyPrice: 9.99,
  clientFreePartnerViews: 5,
  clientPaidMonthlyPartnerViews: 30,
  clientPlanUnlimited: false,
  clientInrMonthlyPrice: 299,
  clientUsdMonthlyPrice: 9.99,
  gstPercentInr: 18,
};

export function PricingSection({
  initialSettings,
}: {
  initialSettings?: Partial<PricingSettings>;
}) {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [settings, setSettings] = useState<PricingSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchLivePricing() {
      try {
        const res = await fetch('/api/platform/pricing');
        if (res.ok) {
          const data = await res.json();
          if (data.subscriptions && isMounted) {
            setSettings({
              partnerFreeClaims: Number(data.subscriptions.partnerFreeClaims ?? 5),
              partnerPaidMonthlyClaims: Number(data.subscriptions.partnerPaidMonthlyClaims ?? 30),
              partnerPlanUnlimited: Boolean(data.subscriptions.partnerPlanUnlimited),
              partnerInrMonthlyPrice: Number(data.subscriptions.partnerInrMonthlyPrice ?? 299),
              partnerUsdMonthlyPrice: Number(data.subscriptions.partnerUsdMonthlyPrice ?? 9.99),
              clientFreePartnerViews: Number(data.subscriptions.clientFreePartnerViews ?? 5),
              clientPaidMonthlyPartnerViews: Number(
                data.subscriptions.clientPaidMonthlyPartnerViews ?? 30
              ),
              clientPlanUnlimited: Boolean(data.subscriptions.clientPlanUnlimited),
              clientInrMonthlyPrice: Number(data.subscriptions.clientInrMonthlyPrice ?? 299),
              clientUsdMonthlyPrice: Number(data.subscriptions.clientUsdMonthlyPrice ?? 9.99),
              gstPercentInr: Number(data.subscriptions.gstPercentInr ?? 18),
            });
          }
        }
      } catch (err) {
        console.error('Failed to load live pricing settings:', err);
      }
    }
    void fetchLivePricing();
    return () => {
      isMounted = false;
    };
  }, []);

  const clientPriceDisplay =
    currency === 'INR'
      ? `₹${settings.clientInrMonthlyPrice}`
      : `$${settings.clientUsdMonthlyPrice}`;

  const partnerPriceDisplay =
    currency === 'INR'
      ? `₹${settings.partnerInrMonthlyPrice}`
      : `$${settings.partnerUsdMonthlyPrice}`;

  const gatewayText =
    currency === 'INR'
      ? `Razorpay UPI / Card AutoPay (+${settings.gstPercentInr}% GST)`
      : 'PayPal Subscriptions AutoPay';

  const clientAllowanceLabel = settings.clientPlanUnlimited
    ? 'Unlimited Partner Views / mo'
    : `${settings.clientPaidMonthlyPartnerViews} Partner Views / mo`;

  const partnerAllowanceLabel = settings.partnerPlanUnlimited
    ? 'Unlimited Lead Applications / mo'
    : `${settings.partnerPaidMonthlyClaims} Lead Applications / mo`;

  return (
    <section className="py-20 sm:py-24 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <Badge variant="primary" className="font-semibold">
            Starter Free Quotas • Zero Deal Commission
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            Start Free on Both Sides. Subscribe Only as You Grow.
          </h2>
          <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed">
            Clients always post requirements free and receive {settings.clientFreePartnerViews} free
            Partner profile views. Partners receive {settings.partnerFreeClaims} free valid lead
            applications before needing a monthly plan.
          </p>

          <div className="mt-6 inline-flex items-center p-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                currency === 'INR' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-[#E8192C]" /> India Billing (INR)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                currency === 'USD' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" /> International Billing (USD)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Client Plan */}
          <div className="border border-[#E5E7EB] rounded-3xl p-8 flex flex-col justify-between bg-[#F8F9FA] relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full">
              Post Requirements Free + {settings.clientFreePartnerViews} Free Partner Views
            </div>
            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  For Clients
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {clientAllowanceLabel}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#111827]">Client Monthly Plan</h3>
              <div className="my-5">
                <span className="text-4xl font-black text-[#111827]">{clientPriceDisplay}</span>
                <span className="text-xs text-[#6B7280]"> / month after free starter views</span>
                <div className="text-[11px] text-[#6B7280] mt-1">{gatewayText}</div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#374151]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Post business & service
                  requirements 100% free
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />{' '}
                  {settings.clientFreePartnerViews} free Partner profile unlocks included on signup
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {clientAllowanceLabel} on
                  active Client Plan (unlock once, view forever)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Mutual-consent contact
                  privacy & direct price negotiation
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-5 border-t border-[#E5E7EB]">
              <Link href="/register?role=client">
                <Button className="w-full rounded-xl bg-[#111827] hover:bg-black text-white font-bold">
                  Post Free & Get {settings.clientFreePartnerViews} Free Views
                </Button>
              </Link>
            </div>
          </div>

          {/* Partner Plan */}
          <div className="border-2 border-[#E8192C] rounded-3xl p-8 flex flex-col justify-between shadow-lg bg-white relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8192C] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full">
              {settings.partnerFreeClaims} Free Lead Applications Included
            </div>
            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">
                  For Partners
                </span>
                <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {partnerAllowanceLabel}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#111827]">Partner Monthly Plan</h3>
              <div className="my-5">
                <span className="text-4xl font-black text-[#111827]">{partnerPriceDisplay}</span>
                <span className="text-xs text-[#6B7280]"> / month after free starter claims</span>
                <div className="text-[11px] text-[#6B7280] mt-1">{gatewayText}</div>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#111827]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E8192C] shrink-0" /> {settings.partnerFreeClaims}{' '}
                  free valid lead applications on signup
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E8192C] shrink-0" /> {partnerAllowanceLabel} on
                  active Partner Plan
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E8192C] shrink-0" /> Zero deduction on expired or
                  declined 5-minute WhatsApp offers
                </li>
                <li className="flex items-center gap-2 font-semibold text-emerald-700">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" /> Keep 100% of contract value
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-5 border-t border-[#E5E7EB]">
              <Link href="/register?role=partner">
                <Button className="w-full rounded-xl bg-[#E8192C] hover:bg-[#C0111F] text-white font-bold">
                  Start with {settings.partnerFreeClaims} Free Applications
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
