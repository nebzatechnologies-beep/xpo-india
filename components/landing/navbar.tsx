'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { getXpoWhatsAppBotUrl } from '@/lib/whatsapp/demo-bot-link';
import { LayoutDashboard, Menu, MessageCircle, Shield, X } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const waHref = getXpoWhatsAppBotUrl('general');

  const dashboardUrl = user?.isSuperadmin
    ? '/superadmin'
    : user?.role === 'partner'
      ? '/dashboard/partner'
      : '/dashboard/client';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E4E5E9] transition-all">
      <div className="max-w-[1140px] mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/xpo-logo.png" alt="XPO India" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-[15px] font-semibold text-[#565B63]">
          <a href="#how" className="hover:text-[#15171C] transition-colors">
            How it works
          </a>
          <a href="#cats" className="hover:text-[#15171C] transition-colors">
            Categories
          </a>
          <a href="#partners" className="hover:text-[#15171C] transition-colors">
            For partners
          </a>
          <a href="#faq" className="hover:text-[#15171C] transition-colors">
            FAQ
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Start on WhatsApp
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard/client/post-requirement">
            <Button
              size="sm"
              className="font-bold text-xs rounded-xl text-white bg-[#C8102E] hover:bg-[#A50D25] shadow-xs"
            >
              Post Requirement Free
            </Button>
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-[#E4E5E9] hover:border-[#D1D5DB] transition-all"
              >
                <span className="text-xs font-bold text-[#15171C] max-w-[120px] truncate">
                  {user.displayName}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#15171C] text-white flex items-center justify-center text-xs font-extrabold">
                  {user.displayName ? user.displayName[0]!.toUpperCase() : 'X'}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E4E5E9] rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
                    <p className="text-[10px] text-[#8A8E97] uppercase font-bold tracking-wider">
                      Signed in
                    </p>
                    <p className="text-xs font-bold text-[#15171C] truncate mt-0.5">
                      {user.phoneE164 || user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#C8102E] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      {user.isSuperadmin ? 'Superadmin' : user.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href={dashboardUrl}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#15171C] hover:bg-[#F9FAFB]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#6B7280]" />
                      Open Workspace
                    </Link>
                    {user.isSuperadmin && (
                      <Link
                        href="/superadmin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#15171C] hover:bg-gray-50"
                      >
                        <Shield className="w-4 h-4 text-[#C8102E]" />
                        Superadmin Console
                      </Link>
                    )}
                  </div>
                  <div className="pt-1 border-t border-[#F3F4F6]">
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-bold text-[#15171C] hover:text-[#C8102E] transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-semibold text-xs border-[#15171C] rounded-xl text-[#15171C]"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#15171C] hover:bg-[#F3F4F6]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E4E5E9] bg-white px-4 pt-3 pb-6 space-y-3">
          <a
            href="#how"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#15171C] py-1.5"
          >
            How it works
          </a>
          <a
            href="#cats"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#15171C] py-1.5"
          >
            Categories
          </a>
          <a
            href="#partners"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#15171C] py-1.5"
          >
            For partners
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#15171C] py-1.5"
          >
            FAQ
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 py-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            Start on WhatsApp Chatbot
          </a>
          <div className="pt-3 border-t border-[#E4E5E9] flex flex-col gap-2">
            {user ? (
              <Link href={dashboardUrl} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center">Open Workspace</Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
