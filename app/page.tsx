import React from 'react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { SectorStrip } from '@/components/landing/sector-strip';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsSection } from '@/components/landing/stats-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { Footer } from '@/components/landing/footer';
import { getPlatformSettings } from '@/lib/services/platform-settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
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
    // Fallback gracefully to client fetch in PricingSection
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SectorStrip />
        <HowItWorks />
        <StatsSection />
        <PricingSection initialSettings={initialSettings} />
      </main>
      <Footer />
    </div>
  );
}
