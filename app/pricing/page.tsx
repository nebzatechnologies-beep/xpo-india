'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PaywallModal } from '@/components/ui/paywall';
import { CheckCircle2, ShieldCheck, Zap, Globe2, CreditCard, RefreshCw } from 'lucide-react';

export default function PricingPage() {
  const [region, setRegion] = useState<'domestic' | 'international'>('domestic');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'absorber'>('absorber');

  const isDomestic = region === 'domestic';
  const price = isDomestic ? '₹999' : '$49';
  const gateway = isDomestic ? 'Razorpay (India)' : 'PayPal (Global)';

  const openCheckout = (role: 'creator' | 'absorber') => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            Simple, Transparent Memberships
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            Direct connections. <br className="hidden sm:inline" />
            <span className="text-[#E8192C]">Zero middleman commissions.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#717171] leading-relaxed">
            Unlike traditional brokered exchanges that slice 10% to 30% from every deal, XPO India operates on a simple flat annual access pass.
          </p>

          {/* Region Switcher */}
          <div className="mt-8 inline-flex p-1 bg-[#F7F7F7] rounded-full border border-[#EBEBEB]">
            <button
              onClick={() => setRegion('domestic')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isDomestic ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#E8192C]" />
              Domestic (India - Razorpay)
            </button>
            <button
              onClick={() => setRegion('international')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                !isDomestic ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }`}
            >
              <Globe2 className="w-4 h-4 text-blue-600" />
              International (PayPal)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Creator Plan */}
          <Card className="p-8 rounded-3xl border border-[#EBEBEB] shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-gray-200 text-[#717171] font-semibold text-xs">
                  For Buyers & Businesses
                </Badge>
                <span className="text-xs text-[#717171] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" /> AutoPay Ready
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">Lead Creator Pass</h3>
              <p className="text-xs text-[#717171] mt-1">For organizations and individuals who need products, services, or contracts executed.</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#222222]">{price}</span>
                <span className="text-sm font-medium text-[#717171]">/ year</span>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">Processed securely via {gateway}</p>

              <ul className="mt-6 space-y-3">
                {[
                  'Post up to 50 active leads per month',
                  'Instant WhatsApp & Email broadcast to suppliers',
                  'Receive detailed bids & competitive quotes',
                  'Direct unmasked phone & WhatsApp contact',
                  '0% commission on contract value',
                  'Dedicated verified creator badge',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#484848]">
                    <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full mt-8 font-semibold rounded-2xl"
              onClick={() => openCheckout('creator')}
            >
              Subscribe as Lead Creator
            </Button>
          </Card>

          {/* Absorber Plan */}
          <Card className="p-8 rounded-3xl border-2 border-[#E8192C] shadow-lg relative flex flex-col justify-between bg-gradient-to-b from-red-50/20 to-white">
            <div className="absolute -top-3.5 right-6">
              <span className="px-3 py-1 bg-[#E8192C] text-white text-[11px] font-bold uppercase rounded-full shadow-sm">
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="primary" className="bg-[#E8192C] text-white font-semibold text-xs">
                  For Providers & Sellers
                </Badge>
                <span className="text-xs text-[#717171] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" /> AutoPay Ready
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">Lead Absorber Pass</h3>
              <p className="text-xs text-[#717171] mt-1">For manufacturers, contractors, freelancers, and service providers who fulfill demands.</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#222222]">{price}</span>
                <span className="text-sm font-medium text-[#717171]">/ year</span>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">Processed securely via {gateway}</p>

              <ul className="mt-6 space-y-3">
                {[
                  'Browse unlimited buyer leads & sector opportunities',
                  'Direct unmasking of buyer phone & WhatsApp',
                  'Submit unlimited commercial proposals & bids',
                  'Priority delivery of leads in matching sectors',
                  'Zero transaction broker fees on deals closed',
                  'Verified Provider Checkmark on all submissions',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#484848]">
                    <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-8 font-semibold rounded-2xl shadow-md"
              onClick={() => openCheckout('absorber')}
            >
              Subscribe as Lead Absorber
            </Button>
          </Card>
        </div>

        {/* Feature Comparison Notice */}
        <div className="mt-14 max-w-3xl mx-auto p-6 rounded-3xl bg-[#F7F7F7] border border-[#EBEBEB] text-center">
          <h4 className="text-base font-bold text-[#222222] flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            No hidden costs. No escrow cuts. 100% direct transactions.
          </h4>
          <p className="text-xs text-[#717171] mt-2 max-w-xl mx-auto leading-relaxed">
            Both domestic Razorpay (₹999/yr) and international PayPal ($49/yr) support one-time checkout and recurring AutoPay. Cancel anytime from your account dashboard.
          </p>
        </div>
      </main>

      <Footer />

      <PaywallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        role={selectedRole}
      />
    </div>
  );
}