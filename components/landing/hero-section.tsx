'use client';

import React from 'react';
import Link from 'next/link';
import { SearchPill } from './search-pill';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Shield, Globe2, Sparkles, Building2 } from 'lucide-react';

interface HeroSectionProps {
  region?: 'domestic' | 'global';
}

export function HeroSection({ region = 'domestic' }: HeroSectionProps) {
  const isGlobal = region === 'global';

  const quickTags = isGlobal
    ? [
        'Aerospace CNC Machining',
        'Forged Flanges (ANSI/DIN)',
        'Automotive Castings',
        'Pharma Intermediates',
        'Export Contract Mfr',
      ]
    : [
        'CNC Precision Machining',
        'Custom Corrugated Boxes',
        '500kg Cotton Combed Yarn',
        'Full-Stack Web App',
        'Domestic FMCG Distribution',
      ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-[#FFF5F6] via-[#FAFBFD] to-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        {/* Top Live Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-red-200/80 shadow-[0_2px_8px_rgba(232,25,44,0.06)]">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isGlobal ? 'bg-blue-600' : 'bg-[#E8192C]'}`} />
          <span className="text-xs font-bold text-[#111827]">
            {isGlobal
              ? '🌐 Global Cross-Border Sourcing Gateway — Connect Overseas Buyers & Indian Talent'
              : '🇮🇳 India’s High-Velocity Domestic Procurement & Opportunity Exchange'}
          </span>
        </div>

        {/* Main Display Heading */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#111827] tracking-tight leading-[1.06]">
            {isGlobal ? (
              <>
                Source World-Class <br />
                <span className="text-blue-600">Indian Engineering</span> & Global Talent.
              </>
            ) : (
              <>
                What do you need? <br />
                <span className="text-[#E8192C]">Someone on XPO</span> can provide it.
              </>
            )}
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto font-normal leading-relaxed">
            {isGlobal
              ? 'Direct cross-border B2B trade. Overseas enterprises source directly from vetted Indian manufacturers with zero intermediary markups, while Indian businesses hire global technical specialists.'
              : 'From precision engineering to 5,000 custom packaging boxes. Post any commercial requirement or discover verified business leads across every Indian industrial hub.'}
          </p>
        </div>

        {/* Airbnb-style Floating Pill Search Bar */}
        <div className="pt-2">
          <SearchPill />
        </div>

        {/* Quick Requirement Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs text-[#6B7280]">
          <span className="font-semibold text-[#111827] text-[11px] uppercase tracking-wider">
            {isGlobal ? 'Global Trade Demands:' : 'Trending Demands:'}
          </span>
          {quickTags.map((tag) => (
            <Link
              key={tag}
              href={`/absorber/opportunities?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#111827] text-[#374151] hover:text-[#111827] transition-all text-[11px] font-medium shadow-2xs"
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link href="/creator/dashboard?openPost=true" className="w-full sm:w-auto">
            <Button
              size="lg"
              className={`w-full sm:w-auto font-bold text-xs sm:text-sm tracking-wide rounded-full px-8 py-3.5 text-white shadow-md hover:shadow-lg transition-all ${
                isGlobal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E8192C] hover:bg-[#C0111F]'
              }`}
            >
              {isGlobal ? 'POST GLOBAL RFQ — FREE' : 'POST A REQUIREMENT — FREE'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link href="/absorber/opportunities" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-semibold text-xs sm:text-sm border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-full px-8 py-3.5 transition-all"
            >
              {isGlobal ? 'EXPLORE EXPORT LEADS' : 'FIND OPPORTUNITIES'}
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#4B5563] font-medium border-t border-[#E5E7EB]/80 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} />
            <span className="font-semibold text-[#111827]">Direct Buyer-Supplier Handshake</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} />
            <span className="font-semibold text-[#111827]">0% Broker Commission</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}`} />
            <span className="font-semibold text-[#111827]">
              {isGlobal ? 'Verified International Trade Rails' : 'Verified Pan-India MSME Hubs'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
