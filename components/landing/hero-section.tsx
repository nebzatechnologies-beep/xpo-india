'use client';

import React from 'react';
import Link from 'next/link';
import { SearchPill } from './search-pill';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Building2,
  Handshake,
  MessageCircle,
} from 'lucide-react';

export function HeroSection() {
  const quickTags = [
    'Full-Stack SaaS Engineering',
    'CNC Precision Machining',
    'Custom Corrugated Packaging',
    'Commercial Solar EPC',
    'Enterprise Cloud & ERP',
  ];

  const waNumber = (process.env.NEXT_PUBLIC_WA_BUSINESS_NUMBER || '').replace(/\D/g, '');
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi XPO')}`
    : '/register';

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-[#FFF5F6] via-[#FAFBFD] to-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-red-200/80 shadow-[0_2px_8px_rgba(232,25,44,0.06)]">
          <span className="w-2 h-2 rounded-full animate-pulse bg-[#E8192C]" />
          <span className="text-xs font-bold text-[#111827]">
            WhatsApp-First B2B Client & Partner Marketplace
          </span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#111827] tracking-tight leading-[1.06]">
            Find the Right Partner. <br />
            <span className="text-[#E8192C]">Win Verified Clients in 5 Minutes.</span>
          </h1>
          <p className="text-base sm:text-xl text-[#4B5563] max-w-3xl mx-auto font-normal leading-relaxed">
            Clients post business requirements free and review interested Partners. Partners receive
            matched opportunities directly on WhatsApp with a 5-minute response window and zero deal
            commission.
          </p>
        </div>

        <div className="pt-2">
          <SearchPill />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs text-[#6B7280]">
          <span className="font-semibold text-[#111827] text-[11px] uppercase tracking-wider">
            Popular Categories:
          </span>
          {quickTags.map((tag) => (
            <Link
              key={tag}
              href={`/categories?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#111827] text-[#374151] hover:text-[#111827] transition-all text-[11px] font-medium"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link href="/register?role=client" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto font-bold text-xs sm:text-sm tracking-wide rounded-full px-7 py-3.5 text-white bg-[#E8192C] hover:bg-[#C0111F] shadow-md"
            >
              START AS CLIENT — POST FREE
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link href="/register?role=partner" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-semibold text-xs sm:text-sm border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-full px-7 py-3.5"
            >
              REGISTER AS PARTNER (5 FREE LEADS)
            </Button>
          </Link>

          <a
            href={waHref}
            target={waNumber ? '_blank' : undefined}
            rel={waNumber ? 'noreferrer' : undefined}
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-semibold text-xs sm:text-sm border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-full px-7 py-3.5"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              START ON WHATSAPP
            </Button>
          </a>
        </div>

        {/* 2 Customer Roles Strip */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
          <Link
            href="/register?role=client"
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#E8192C] transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#111827]">
                <Building2 className="w-4 h-4 text-[#E8192C]" />
                For Clients — Find the Right Partner
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Post Free + 5 Free Views
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Describe the product, service, or professional you need. Review interested Partners,
              unlock profiles, and negotiate pricing directly.
            </p>
          </Link>

          <Link
            href="/register?role=partner"
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#E8192C] transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#111827]">
                <Handshake className="w-4 h-4 text-[#E8192C]" />
                For Partners — Find New Clients
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#E8192C] border border-red-200">
                5 Free Lead Claims
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Select your services, categories, and location. Receive matching Client leads on
              WhatsApp, respond in 5 minutes, and connect directly.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
