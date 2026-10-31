'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-lg">
                X
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                XPO <span className="text-[#E8192C]">MARKETPLACE</span>
              </span>
            </Link>
            <p className="mt-4 text-xs text-gray-400 leading-relaxed max-w-md">
              WhatsApp-first B2B marketplace connecting Clients and verified Partners with AI-guided
              onboarding, 5-minute opportunity distribution, mutual-consent privacy, and zero deal
              commission.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Marketplace Roles
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/register?role=client" className="hover:text-white">
                  Client — Post Requirement (Free)
                </Link>
              </li>
              <li>
                <Link href="/register?role=partner" className="hover:text-white">
                  Partner — 5-Min Business Leads
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Customer Sign In
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform & Governance
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Client & Partner Plans
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white">
                  4-Tier Industry Taxonomy
                </Link>
              </li>
              <li>
                <Link href="/dashboard/support" className="hover:text-white">
                  Trust, Safety & Privacy
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#E8192C] font-semibold">
                  Superadmin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} XPO Marketplace. Zero Commission • Mutual Consent Privacy.</p>
        </div>
      </div>
    </footer>
  );
}
