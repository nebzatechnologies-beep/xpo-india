import React from 'react';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { SectorStrip } from '@/components/landing/sector-strip';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsSection } from '@/components/landing/stats-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'XPO India — High-Velocity Domestic Procurement & Lead Exchange',
  description: 'Connect directly with verified Indian manufacturers, suppliers, and engineering talent across Peenya, Pune, Coimbatore, Peenya, Ahmedabad & Gurgaon.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection region="domestic" />
        <SectorStrip />
        <HowItWorks />
        <StatsSection />
        <PricingSection region="domestic" />
      </main>
      <Footer />
    </div>
  );
}