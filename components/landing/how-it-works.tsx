'use client';

import React from 'react';
import { Building2, Handshake } from 'lucide-react';

export function HowItWorks() {
  const clientSteps = [
    {
      num: '1',
      title: 'Start on WhatsApp or Web',
      desc: 'Open XPO and register as a Client in seconds.',
    },
    {
      num: '2',
      title: 'Post a Requirement (Free)',
      desc: 'Describe the product, service, or professional you need.',
    },
    {
      num: '3',
      title: 'XPO Finds Matches',
      desc: 'The system automatically identifies suitable verified Partners.',
    },
    {
      num: '4',
      title: 'Receive Interested Partners',
      desc: 'XPO shows you Partners who responded within 5 minutes.',
    },
    {
      num: '5',
      title: 'Review and Connect',
      desc: 'Unlock their profiles (first 5 free) and choose whom to contact.',
    },
    {
      num: '6',
      title: 'Get Your Work Done',
      desc: 'Discuss pricing, timelines, and delivery directly with your Partner.',
    },
  ];

  const partnerSteps = [
    {
      num: '1',
      title: 'Start on WhatsApp or Web',
      desc: 'Register on XPO as a Partner.',
    },
    {
      num: '2',
      title: 'Set Up Your Profile',
      desc: 'Select your services, expertise, categories, and location.',
    },
    {
      num: '3',
      title: 'Receive Business Leads',
      desc: 'XPO automatically sends matching Client requirements to your WhatsApp.',
    },
    {
      num: '4',
      title: 'Respond in 5 Minutes',
      desc: 'Express interest before the opportunity redirects (zero cost on ignore).',
    },
    {
      num: '5',
      title: 'Get Shortlisted',
      desc: 'Your profile is presented to the Client for review.',
    },
    {
      num: '6',
      title: 'Connect & Grow With a Plan',
      desc: 'Communicate directly once both agree; subscribe after 5 free valid claims.',
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-[#F8F9FA]" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">
            Simple, Fast & Mutual-Consent Protected
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
            How XPO Works for Clients & Partners
          </h2>
          <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
            No public bidding wars, no cold-call phone scraping, and zero commission cuts on your deals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clients Column */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-7 sm:p-8 shadow-2xs">
            <div className="flex items-center gap-3 pb-5 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#111827]">
                  For Clients — Find the Right Partner
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Post requirements free • First 5 Partner profile views free
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {clientSteps.map((s) => (
                <div key={s.num} className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#111827] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {s.num}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-[#111827]">{s.title}</div>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners Column */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-7 sm:p-8 shadow-2xs">
            <div className="flex items-center gap-3 pb-5 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#111827]">
                  For Partners — Find New Clients
                </h3>
                <p className="text-xs text-[#6B7280]">
                  5-minute WhatsApp leads • First 5 valid applications free
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {partnerSteps.map((s) => (
                <div key={s.num} className="flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#E8192C] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {s.num}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-[#111827]">{s.title}</div>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
