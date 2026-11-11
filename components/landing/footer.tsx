'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E7E7E2] py-12 text-[#15171C] transition-colors">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          <div>
            <Link href="/" className="inline-block mb-3">
              <img src="/xpo-logo.png" alt="XPO India" className="h-7 w-auto object-contain" />
            </Link>
            <p className="text-sm text-[#565B63] max-w-[30ch] leading-relaxed">
              The B2B sourcing marketplace for every Indian business — freelancers to factories.
            </p>
          </div>
          <div>
            <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#8A8F98] mb-3.5">
              Explore
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#565B63]">
              <li>
                <a href="#how" className="hover:text-[#15171C] transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#cats" className="hover:text-[#15171C] transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#15171C] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#8A8F98] mb-3.5">
              For you
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#565B63]">
              <li>
                <Link href="/dashboard/client" className="hover:text-[#15171C] transition-colors">
                  Post a requirement
                </Link>
              </li>
              <li>
                <Link href="/dashboard/partner" className="hover:text-[#15171C] transition-colors">
                  Become a partner
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#15171C] transition-colors">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#8A8F98] mb-3.5">
              Company
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#565B63]">
              <li>
                <Link href="/how-it-works" className="hover:text-[#15171C] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/dashboard/support" className="hover:text-[#15171C] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/dashboard/support" className="hover:text-[#15171C] transition-colors">
                  Trust &amp; privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E7E7E2] pt-6 flex flex-wrap items-center gap-4 text-[13px] text-[#8A8F98]">
          <span>© 2026 XPO India</span>
          <Link href="/dashboard/support" className="hover:text-[#15171C]">Terms</Link>
          <Link href="/dashboard/support" className="hover:text-[#15171C]">Privacy</Link>
          <Link href="/dashboard/support" className="hover:text-[#15171C]">Refund policy</Link>
          <span className="flex-1" />
          <span>GST-verified suppliers · Secure payments</span>
        </div>
      </div>
    </footer>
  );
}
