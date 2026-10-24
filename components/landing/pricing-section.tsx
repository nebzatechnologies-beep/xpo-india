'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Zap, Globe2 } from 'lucide-react';

interface PricingSectionProps {
  region?: 'domestic' | 'global';
}

export function PricingSection({ region = 'domestic' }: PricingSectionProps) {
  const isGlobal = region === 'global';
  const [roleTab, setRoleTab] = useState<'creator' | 'absorber'>('absorber');

  const priceAmount = isGlobal ? '$49' : '₹999';
  const freePrice = isGlobal ? '$0' : '₹0';
  const currencyLabel = isGlobal ? 'USD' : 'INR';
  const gatewayLabel = isGlobal ? 'PayPal / International Stripe' : 'Razorpay UPI AutoPay / NetBanking';

  return (
    <section className="py-20 sm:py-28 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <Badge variant="primary" className="font-semibold">
            {isGlobal ? 'Global Transparent Subscriptions' : 'Domestic Transparent Subscriptions'}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#222222] tracking-tight">
            Monetized on Connections. Zero Commission on Deals.
          </h2>
          <p className="text-[#717171] text-sm sm:text-base leading-relaxed">
            {isGlobal
              ? 'International buyers and suppliers subscribe to our flat annual USD global plan with zero middleman deductions.'
              : 'Indian employers and suppliers subscribe to our flat annual INR domestic plan with GST invoicing and UPI AutoPay.'}
          </p>

          {/* Regional Rule Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium text-[#4B5563]">
            <Globe2 className="w-3.5 h-3.5 text-[#E8192C]" />
            <span>
              {isGlobal
                ? 'Global Plan: Billed in USD ($49/yr). Connect with Indian manufacturing talent & worldwide buyers.'
                : 'Domestic Plan: Billed in INR (₹999/yr). Connect with Indian suppliers & overseas engineering talent.'}
            </span>
          </div>

          <div className="mt-8 inline-flex items-center p-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">
            <button
              onClick={() => setRoleTab('absorber')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'absorber' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }`}
            >
              For Lead Absorbers (Providers)
            </button>
            <button
              onClick={() => setRoleTab('creator')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'creator' ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }`}
            >
              For Lead Creators (Buyers)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="border border-[#EBEBEB] rounded-[18px] p-8 flex flex-col justify-between bg-[#FAFAFA]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#717171]">Starter</span>
                <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">Free</span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">
                {roleTab === 'absorber' ? 'Explorer Access' : 'Initial Lead Post'}
              </h3>
              <div className="my-6">
                <span className="text-4xl font-black text-[#222222]">{freePrice}</span>
              </div>
              <ul className="space-y-3 text-sm text-[#717171]">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Browse lead headlines & categories</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> View approximate budget ranges</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Cross-border discovery enabled</li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-[#EBEBEB]">
              <Link href={roleTab === 'absorber' ? '/absorber/opportunities' : '/creator/dashboard?openPost=true'}>
                <Button variant="outline" className="w-full">
                  {roleTab === 'absorber' ? 'Explore Opportunities' : 'Post Free Requirement'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium Annual Tier */}
          <div className={`border-2 rounded-[18px] p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-white relative ${
            isGlobal ? 'border-blue-600' : 'border-[#E8192C]'
          }`}>
            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full ${
              isGlobal ? 'bg-blue-600' : 'bg-[#E8192C]'
            }`}>
              Most Popular • Best Value
            </div>
            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isGlobal ? 'text-blue-600' : 'text-[#E8192C]'
                }`}>
                  {roleTab === 'absorber' ? 'Annual Provider' : 'Annual Creator'}
                </span>
                <span className="text-xs font-semibold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-full">
                  {gatewayLabel}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">
                {roleTab === 'absorber' ? 'Full Provider Membership' : 'Unlimited Creator Plan'}
              </h3>
              <div className="my-6">
                <span className="text-4xl font-black text-[#222222]">{priceAmount}</span>
                <span className="text-xs text-[#717171]"> / year ({currencyLabel})</span>
              </div>
              <ul className="space-y-3 text-sm text-[#222222]">
                <li className="flex items-center gap-2"><Check className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} /> Full technical specification & drawing file access</li>
                <li className="flex items-center gap-2"><Check className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} /> Submit unlimited quotes & proposals</li>
                <li className="flex items-center gap-2"><Check className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} /> Direct phone & WhatsApp handshake unmasking</li>
                <li className="flex items-center gap-2"><Check className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} /> Cross-border hiring: Connect across India and worldwide</li>
                <li className="flex items-center gap-2 font-semibold text-[#059669]"><Zap className="w-4 h-4 text-[#059669]" /> Keep 100% of deal value — zero broker commission</li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-[#EBEBEB]">
              <Link href={roleTab === 'absorber' ? '/absorber/subscription' : '/creator/subscription'}>
                <Button className={`w-full font-bold py-3 text-white ${
                  isGlobal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E8192C] hover:bg-[#C0111F]'
                }`}>
                  Get Started — {priceAmount}/year
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
