import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { HowItWorks } from '@/components/landing/how-it-works';
import {
  MessageSquare,
  Clock,
  ShieldCheck,
  Handshake,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#15171C]">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 bg-[#F6F6F4] border-b border-[#E4E5E9]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp-First + Web Workspace
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
              How XPO Connects Clients & Partners
            </h1>
            <p className="mt-4 text-lg text-[#6B7280]">
              Dedicated Client and Partner workflows synced across WhatsApp Cloud API and the XPO
              Web Workspace — with AI-assisted requirement intake, 5-minute lead rounds, and mutual
              consent contact privacy.
            </p>
          </div>
        </section>

        <HowItWorks />

        <section className="py-16 border-t border-[#E4E5E9] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-12">
              Engineered for Speed, Fairness & Privacy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-[#E4E5E9] bg-[#F6F6F4]">
                <Clock className="w-7 h-7 text-[#C8102E] mb-4" />
                <h3 className="text-lg font-bold">5-Minute Lead Distribution</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                  Matching Client requirements are sent to eligible Partners in controlled rounds.
                  Partners have 5 minutes to express interest; unanswered opportunities automatically
                  redirect to the next eligible Partners with zero quota deduction.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-[#E4E5E9] bg-[#F6F6F4]">
                <ShieldCheck className="w-7 h-7 text-emerald-600 mb-4" />
                <h3 className="text-lg font-bold">Mutual-Consent Privacy</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                  Phone numbers and emails are never sold or broadcast publicly. Clients unlock
                  interested Partner profiles, request a connection, and direct contact details
                  release only once both parties explicitly agree.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-[#E4E5E9] bg-[#F6F6F4]">
                <Sparkles className="w-7 h-7 text-[#15171C] mb-4" />
                <h3 className="text-lg font-bold">Agentic Onboarding & Matching</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                  XPO&apos;s hybrid agent guides Clients and Partners on WhatsApp or Web, collects
                  only missing profile details, and matches requirements across categories,
                  subcategories, services, skills, and locations.
                </p>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link
                href="/register?role=client"
                className="p-6 rounded-2xl border border-[#E4E5E9] hover:border-[#15171C] transition flex flex-col justify-between"
              >
                <div>
                  <Building2 className="w-6 h-6 text-[#C8102E] mb-3" />
                  <div className="font-bold text-base">Register as a Client</div>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    Post requirements 100% free, unlock your first 5 interested Partner profiles
                    free, and connect directly.
                  </p>
                </div>
                <span className="mt-4 text-xs font-bold text-[#15171C]">Start as Client →</span>
              </Link>

              <Link
                href="/register?role=partner"
                className="p-6 rounded-2xl border border-[#E4E5E9] hover:border-[#C8102E] transition flex flex-col justify-between"
              >
                <div>
                  <Handshake className="w-6 h-6 text-[#C8102E] mb-3" />
                  <div className="font-bold text-base">Register as a Partner</div>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    Receive 5-minute matching business leads on WhatsApp with 5 free starter lead
                    applications.
                  </p>
                </div>
                <span className="mt-4 text-xs font-bold text-[#C8102E]">Start as Partner →</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
