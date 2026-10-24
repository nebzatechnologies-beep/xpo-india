import React from 'react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { SectorStrip } from '@/components/landing/sector-strip';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsSection } from '@/components/landing/stats-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'XPO Global — Cross-Border B2B Sourcing Gateway',
  description: 'Connect overseas enterprises directly with world-class Indian precision manufacturers, engineering talent, and global suppliers with zero broker commissions.',
};

export default function GlobalLandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection region="global" />
        <SectorStrip />
        <HowItWorks />
        <StatsSection />
        <PricingSection region="global" />
      </main>
      <Footer />
    </div>
  );
}
