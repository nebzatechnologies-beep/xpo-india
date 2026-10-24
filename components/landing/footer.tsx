'use client';
import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1C1C1C] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[8px] bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-lg">
                X
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                XPO <span className="text-[#E8192C]">INDIA</span>
              </span>
            </Link>
            <p className="mt-4 text-xs text-[#999999] leading-relaxed max-w-sm">
              Sector-agnostic opportunity and lead exchange connecting requirement creators with capable absorbers across technology, manufacturing, design, trade, and professional services.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">For Users</h4>
            <ul className="space-y-2.5 text-xs text-[#AAAAAA]">
              <li><Link href="/creator/dashboard?openPost=true" className="hover:text-white">Post Requirement (Free)</Link></li>
              <li><Link href="/absorber/opportunities" className="hover:text-white">Find Opportunities</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing & Plans</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Administration</h4>
            <ul className="space-y-2.5 text-xs text-[#AAAAAA]">
              <li><Link href="/admin/dashboard" className="hover:text-[#E8192C] font-semibold">Superadmin</Link></li>
              <li><Link href="/admin/payments" className="hover:text-white">Transaction Records</Link></li>
              <li><Link href="/admin/leads" className="hover:text-white">Lead Moderation</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#777777] gap-4">
          <p>© {new Date().getFullYear()} XPO India. All rights reserved. Connecting Businesses Directly.</p>
        </div>
      </div>
    </footer>
  );
}
