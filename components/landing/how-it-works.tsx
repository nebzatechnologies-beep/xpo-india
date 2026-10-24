'use client';

import React from 'react';
import { FileEdit, MessageSquare, Handshake } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: FileEdit,
      title: 'Post Requirement',
      role: 'Lead Creator',
      desc: 'Tell the world what you need — from software development or design to 5,000 packaging boxes or contract textiles.',
      action: 'Post for free in 60 seconds',
    },
    {
      num: '02',
      icon: MessageSquare,
      title: 'Providers Respond',
      role: 'Lead Absorber',
      desc: 'Relevant providers, suppliers, and agencies discover your lead and submit exclusive proposals, quotes, and timelines.',
      action: 'Private & competitor-blind',
    },
    {
      num: '03',
      icon: Handshake,
      title: 'Direct Connection',
      role: 'Both Parties',
      desc: 'Review responses, compare credentials, and connect directly to finalize commercial terms without intermediary fees.',
      action: 'Zero platform commission',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F8F9FA]" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">
            Direct Business Exchange
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
            POST → RESPOND → CONNECT
          </h2>
          <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
            XPO connects commercial requirements directly with capable suppliers across India and globally. Simple, transparent, and direct.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-8 relative flex flex-col justify-between hover:border-[#111827] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-[#E8192C]/20 group-hover:text-[#E8192C] transition-colors">
                      {step.num}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E8192C]">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-full">
                    {step.role}
                  </span>
                  <h3 className="text-lg font-bold text-[#111827] mt-3 mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#F3F4F6] text-xs font-bold text-[#111827]">
                  {step.action}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
