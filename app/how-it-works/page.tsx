'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Search,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Someone Needs Something → Post a Lead',
      description: 'Whether it is 5,000 CNC machined flanges, a cold storage logistics fleet, an enterprise software rewrite, or bulk organic cotton greige fabric — create a structured requirement in minutes. Each requirement receives an official XPO tracking identifier (e.g. XPO-10021).',
      icon: FileText,
    },
    {
      number: '02',
      title: 'Relevant Providers Discover & Respond',
      description: 'Qualified manufacturers, contractors, consultancies, and suppliers discover the lead through sector filters, category feeds, and instant automated WhatsApp broadcasts. Absorbers review specifications and submit commercial quotations.',
      icon: Search,
    },
    {
      number: '03',
      title: 'Lead Creator Reviews Direct Proposals',
      description: 'The buyer compares quotes, delivery timelines, vendor certifications, and portfolio details side-by-side in their dedicated response dashboard. No confusing bid spam.',
      icon: MessageSquare,
    },
    {
      number: '04',
      title: 'Direct Handshake & Connection',
      description: 'When the buyer connects with a proposal, full direct details (verified phone number, WhatsApp chat direct link, email, and corporate identity) are unlocked. The two parties finalize contracts, commercial terms, and transactions directly with ZERO broker cut.',
      icon: PhoneCall,
    },
  ];

  const caseStudies = [
    {
      sector: 'Manufacturing & Industrial',
      scenario: 'Automotive tier-1 vendor in Pune needed 20,000 sintered brass bushings with strict metallurgical tolerances within 3 weeks.',
      resolution: 'Matched with an ISO 9001 certified precision manufacturing unit in Rajkot within 48 hours. Direct offline inspection and delivery.',
    },
    {
      sector: 'IT & Cloud Architecture',
      scenario: 'US-based health-tech startup required HIPAA-compliant AWS cloud migration and Kubernetes orchestration.',
      resolution: 'Connected directly with an elite Bangalore DevOps consultancy via PayPal global pass. Zero escrow percentage taken.',
    },
    {
      sector: 'Logistics & Supply Chain',
      scenario: 'Pharma distributor required dedicated multi-temperature refrigerated reefer containers between Ahmedabad and Hyderabad.',
      resolution: 'Cold-chain fleet operator responded with real-time sensor tracking quotes. Direct bilateral service agreement executed.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            The XPO India Model
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            How XPO India Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#717171] leading-relaxed">
            The fundamental principle is straightforward: <span className="text-[#222222] font-semibold">Direct connection. Complete transparency. Zero middleman fees.</span>
          </p>
        </div>

        {/* 4 Steps Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Card key={idx} className="p-8 rounded-3xl border border-[#EBEBEB] hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-[#E8192C]/40">{s.number}</span>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#222222] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#717171] leading-relaxed">{s.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Real-World Case Studies */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">Cross-Industry Lead Exchanges</h2>
            <p className="text-sm text-[#717171] mt-1">XPO India operates across manufacturing, software, freight, legal, and commodity trade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((c, i) => (
              <div key={i} className="p-6 rounded-3xl bg-[#F7F7F7] border border-[#EBEBEB]">
                <Badge variant="outline" className="bg-white border-gray-200 text-[#222222] font-semibold text-xs mb-3">
                  {c.sector}
                </Badge>
                <div className="text-xs font-semibold text-[#222222] mb-1">Requirement:</div>
                <p className="text-xs text-[#717171] mb-4 leading-relaxed">{c.scenario}</p>
                <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Outcome:
                </div>
                <p className="text-xs text-[#717171] leading-relaxed">{c.resolution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-[#222222] to-[#111111] text-white text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to connect directly?</h2>
          <p className="text-sm text-gray-300 mt-2 max-w-lg">
            Join thousands of verified businesses and independent specialists across India and worldwide.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link href="/creator/dashboard?openPost=true">
              <Button variant="primary" size="lg" className="rounded-2xl font-semibold">
                Post a Requirement
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="outline" size="lg" className="rounded-2xl font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20">
                Browse Live Leads
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}