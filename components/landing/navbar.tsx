'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Menu, MessageCircle, Shield, X } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const waNumber = (process.env.NEXT_PUBLIC_WA_BUSINESS_NUMBER || '').replace(/\D/g, '');
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi XPO')}`
    : '/how-it-works';

  const dashboardUrl = user?.isSuperadmin
    ? '/admin/dashboard'
    : user?.role === 'partner'
      ? '/dashboard/partner'
      : '/dashboard/client';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              X
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#111827] leading-none">
                XPO <span className="text-[#E8192C]">MARKETPLACE</span>
              </span>
              <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold mt-0.5">
                WhatsApp-First Client & Partner Exchange
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#4B5563]">
          <Link href="/categories" className="hover:text-[#111827] transition-colors">
            Sectors & Categories
          </Link>
          <Link href="/how-it-works" className="hover:text-[#111827] transition-colors">
            How XPO Works
          </Link>
          <Link href="/pricing" className="hover:text-[#111827] transition-colors">
            Plans & Quotas
          </Link>
          <a
            href={waHref}
            target={waNumber ? '_blank' : undefined}
            rel={waNumber ? 'noreferrer' : undefined}
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
              className="font-bold text-xs rounded-xl text-white bg-[#E8192C] hover:bg-[#C0111F] shadow-xs"
            >
              Post Requirement Free
            </Button>
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all"
              >
                <span className="text-xs font-bold text-[#111827] max-w-[120px] truncate">
                  {user.displayName}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-extrabold">
                  {user.displayName ? user.displayName[0]!.toUpperCase() : 'X'}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
                    <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                      Signed in
                    </p>
                    <p className="text-xs font-bold text-[#111827] truncate mt-0.5">
                      {user.phoneE164 || user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#E8192C] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      {user.isSuperadmin ? 'Superadmin' : user.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href={dashboardUrl}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#6B7280]" />
                      Open Workspace
                    </Link>
                    {user.isSuperadmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-gray-50"
                      >
                        <Shield className="w-4 h-4 text-[#E8192C]" />
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
                className="text-xs font-bold text-[#111827] hover:text-[#E8192C] transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-semibold text-xs border-[#111827] rounded-xl text-[#111827]"
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
            className="p-2 rounded-lg text-[#111827] hover:bg-[#F3F4F6]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#111827] py-1.5"
          >
            Sectors & Categories
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#111827] py-1.5"
          >
            How XPO Works
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#111827] py-1.5"
          >
            Plans & Quotas
          </Link>
          <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
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
