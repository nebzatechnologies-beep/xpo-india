'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, X, LayoutDashboard, Globe2 } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isGlobal = pathname.startsWith('/global');

  const user = session?.user;
  const role = (user as any)?.role;

  const dashboardUrl =
    role === 'superadmin' || role === 'staff'
      ? '/admin/dashboard'
      : role === 'lead_absorber' || role === 'absorber'
      ? '/absorber/opportunities'
      : '/creator/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Edition */}
        <div className="flex items-center gap-6">
          <Link href={isGlobal ? '/global' : '/'} className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform ${
              isGlobal ? 'bg-[#111827]' : 'bg-[#E8192C]'
            }`}>
              X
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#111827] leading-none">
                XPO <span className={isGlobal ? 'text-blue-600' : 'text-[#E8192C]'}>{isGlobal ? 'GLOBAL' : 'INDIA'}</span>
              </span>
              <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold mt-0.5">
                {isGlobal ? 'Cross-Border Sourcing Gateway' : 'Domestic Opportunity Exchange'}
              </span>
            </div>
          </Link>

          {/* Region Switcher Pill (Domestic India vs Global International) */}
          <div className="hidden lg:flex items-center p-1 bg-[#F3F4F6] rounded-full border border-[#E5E7EB] text-xs font-bold">
            <Link
              href="/"
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                !isGlobal
                  ? 'bg-white text-[#111827] shadow-xs font-extrabold'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>🇮🇳</span>
              <span>Domestic (India)</span>
            </Link>
            <Link
              href="/global"
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                isGlobal
                  ? 'bg-[#111827] text-white shadow-xs font-extrabold'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>🌐</span>
              <span>Global (Worldwide)</span>
            </Link>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#4B5563]">
          <Link href="/absorber/opportunities" className="hover:text-[#111827] transition-colors">
            Find Opportunities
          </Link>
          <Link href="/how-it-works" className="hover:text-[#111827] transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:text-[#111827] transition-colors">
            Pricing
          </Link>
          <Link href="/categories" className="hover:text-[#111827] transition-colors">
            Sectors
          </Link>
        </nav>

        {/* Action Controls & Profile */}
        <div className="hidden md:flex items-center gap-3.5">
          <Link href="/creator/dashboard?openPost=true">
            <Button
              size="sm"
              className={`font-bold text-xs rounded-xl text-white shadow-xs ${
                isGlobal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E8192C] hover:bg-[#C0111F]'
              }`}
            >
              Post a Requirement
            </Button>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-xs transition-all"
              >
                <span className="text-xs font-bold text-[#111827] max-w-[120px] truncate">
                  {user.name}
                </span>
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-extrabold ${
                  isGlobal ? 'bg-blue-600' : 'bg-[#E8192C]'
                }`}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
                    <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-[#111827] truncate mt-0.5">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#E8192C] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      {role || 'User'}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href={dashboardUrl}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F9FAFB]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#6B7280]" />
                      Dashboard
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]"
                    >
                      <span className="text-xs">🔄</span>
                      Switch Role
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-[#F3F4F6]">
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/auth/demo-switch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: 'logout' }),
                          });
                          window.location.href = '/login';
                        } catch {
                          window.location.href = '/login';
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-bold text-[#111827] hover:text-[#E8192C] transition-colors">
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm" variant="outline" className="font-semibold text-xs border-[#111827] rounded-xl text-[#111827]">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#222222] hover:bg-[#F7F7F7]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EBEBEB] bg-white px-4 pt-3 pb-6 space-y-4">
          {/* Mobile Region Switcher */}
          <div className="p-1 bg-[#F3F4F6] rounded-xl flex items-center text-xs font-bold">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex-1 py-1.5 text-center rounded-lg ${
                !isGlobal ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              🇮🇳 India (Domestic)
            </Link>
            <Link
              href="/global"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex-1 py-1.5 text-center rounded-lg ${
                isGlobal ? 'bg-[#111827] text-white shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              🌐 Global (Worldwide)
            </Link>
          </div>

          <div className="space-y-2">
            <Link href="/absorber/opportunities" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#222222] py-2">
              Find Opportunities
            </Link>
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#222222] py-2">
              How It Works
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#222222] py-2">
              Pricing
            </Link>
            <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-[#222222] py-2">
              Sectors
            </Link>
          </div>

          <div className="pt-3 border-t border-[#EBEBEB] flex flex-col gap-2">
            <Link href="/creator/dashboard?openPost=true" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">Post Requirement</Button>
            </Link>
            {user ? (
              <Link href={dashboardUrl} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center">Dashboard</Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
