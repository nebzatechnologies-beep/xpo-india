import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PricingSection } from '@/components/landing/pricing-section';
import { ShieldCheck, Zap, CreditCard, RefreshCw } from 'lucide-react';
import { getPlatformSettings } from '@/lib/services/platform-settings';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let initialSettings;
  try {
    const settings = await getPlatformSettings();
    initialSettings = {
      partnerFreeClaims: settings.subscriptions.partnerFreeClaims,
      partnerPaidMonthlyClaims: settings.subscriptions.partnerPaidMonthlyClaims,
      partnerPlanUnlimited: settings.subscriptions.partnerPlanUnlimited,
      partnerInrMonthlyPrice: settings.subscriptions.partnerInrMonthlyPrice,
      partnerUsdMonthlyPrice: settings.subscriptions.partnerUsdMonthlyPrice,
      clientFreePartnerViews: settings.subscriptions.clientFreePartnerViews,
      clientPaidMonthlyPartnerViews: settings.subscriptions.clientPaidMonthlyPartnerViews,
      clientPlanUnlimited: settings.subscriptions.clientPlanUnlimited,
      clientInrMonthlyPrice: settings.subscriptions.clientInrMonthlyPrice,
      clientUsdMonthlyPrice: settings.subscriptions.clientUsdMonthlyPrice,
      gstPercentInr: settings.subscriptions.gstPercentInr ?? 18,
    };
  } catch {
    // Fallback gracefully
  }

  const pPriceInr = initialSettings?.partnerInrMonthlyPrice ?? 299;
  const pPriceUsd = initialSettings?.partnerUsdMonthlyPrice ?? 9.99;
  const gstRate = initialSettings?.gstPercentInr ?? 18;
  const pClaims = initialSettings?.partnerPaidMonthlyClaims ?? 30;
  const cViews = initialSettings?.clientPaidMonthlyPartnerViews ?? 30;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-6 bg-[#F8F9FA] border-b border-[#E5E7EB]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              Zero Commission Marketplace
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
              Simple Starter Quotas & Monthly Plans
            </h1>
            <p className="mt-4 text-lg text-[#6B7280]">
              Clients post requirements free and unlock their first{' '}
              {initialSettings?.clientFreePartnerViews ?? 5} Partner profiles free. Partners claim
              their first {initialSettings?.partnerFreeClaims ?? 5} valid leads free before
              subscribing.
            </p>
          </div>
        </section>

        <PricingSection initialSettings={initialSettings} />

        <section className="py-16 bg-[#F8F9FA] border-t border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-10">
              Billing, Quotas & Governance Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                <Zap className="w-6 h-6 text-[#E8192C] mb-3" />
                <h3 className="font-bold text-sm">Fair Usage Protection</h3>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                  Partners are never charged for expired or declined 5-minute alerts. Clients unlock
                  each Partner once and re-view forever without double-deduction.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                <CreditCard className="w-6 h-6 text-emerald-600 mb-3" />
                <h3 className="font-bold text-sm">INR & USD AutoPay</h3>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                  Domestic billing runs via Razorpay AutoPay (₹{pPriceInr}/mo + {gstRate}% GST).
                  International billing runs via PayPal AutoPay (${pPriceUsd}/mo USD).
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                <RefreshCw className="w-6 h-6 text-[#111827] mb-3" />
                <h3 className="font-bold text-sm">Monthly Cycle Refresh</h3>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                  Active Partner Plans refresh {pClaims} lead claims/month and active Client Plans
                  refresh {cViews} Partner views/month (or Unlimited when enabled).
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                <ShieldCheck className="w-6 h-6 text-amber-600 mb-3" />
                <h3 className="font-bold text-sm">Webhook-Verified Ledger</h3>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                  Every credit grant, unlock, claim, and subscription renewal is cryptographically
                  verified and recorded in XPO&apos;s entitlement ledger.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#111827] text-white font-semibold text-sm hover:bg-black transition"
              >
                Create Your XPO Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
