'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronDown,
  LogOut,
  Settings,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  CreditCard,
  Search,
  FileCheck2,
  MessageCircle,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface WorkspaceShellProps {
  workspaceType: 'admin' | 'creator' | 'absorber';
  workspaceTitle: string;
  workspaceSubtitle: string;
  navGroups: NavGroup[];
  headerActions?: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    avatarInitials: string;
  };
  children: React.ReactNode;
}

export function WorkspaceShell({
  workspaceType,
  workspaceTitle,
  workspaceSubtitle,
  navGroups,
  headerActions,
  user,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role: 'superadmin' | 'lead_creator' | 'lead_absorber') => {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
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
  };

  const getRoleTheme = () => {
    switch (workspaceType) {
      case 'admin':
        return {
          accentColor: '#9333EA',
          badgeText: 'Superadmin',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          avatarBg: 'bg-purple-600 text-white',
          activeNavBg: 'bg-purple-50 text-purple-800 font-semibold',
          activeIconColor: 'text-purple-700',
          bottomActiveColor: 'text-purple-700',
          bottomActiveBg: 'bg-purple-50 text-purple-700',
        };
      case 'creator':
        return {
          accentColor: '#E8192C',
          badgeText: 'Client',
          badgeBg: 'bg-red-50 text-[#E8192C] border-red-200',
          avatarBg: 'bg-[#E8192C] text-white',
          activeNavBg: 'bg-red-50 text-[#E8192C] font-semibold',
          activeIconColor: 'text-[#E8192C]',
          bottomActiveColor: 'text-[#E8192C]',
          bottomActiveBg: 'bg-red-50 text-[#E8192C]',
        };
      case 'absorber':
        return {
          accentColor: '#2563EB',
          badgeText: 'Partner',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          avatarBg: 'bg-blue-600 text-white',
          activeNavBg: 'bg-blue-50 text-blue-700 font-semibold',
          activeIconColor: 'text-blue-600',
          bottomActiveColor: 'text-blue-600',
          bottomActiveBg: 'bg-blue-50 text-blue-600',
        };
    }
  };

  const theme = getRoleTheme();

  // Find active breadcrumb label
  let currentBreadcrumb = 'Overview';
  for (const group of navGroups) {
    const matched = group.items.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
    if (matched) {
      currentBreadcrumb = matched.label;
      break;
    }
  }

  const getBottomNavItems = () => {
    switch (workspaceType) {
      case 'creator':
        return [
          { label: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
          { label: 'Requirements', href: '/creator/my-leads', icon: FileText },
          { label: 'Interested', href: '/creator/responses', icon: MessageSquare },
          { label: 'Handshakes', href: '/creator/connections', icon: Users },
        ];
      case 'absorber':
        return [
          { label: 'Opportunities', href: '/absorber/opportunities', icon: Search },
          { label: 'My Interests', href: '/absorber/my-responses', icon: FileCheck2 },
          { label: 'Handshakes', href: '/absorber/connections', icon: Users },
        ];
      case 'admin':
        return [
          { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Leads', href: '/admin/leads', icon: Shield },
          { label: 'CRM', href: '/admin/crm', icon: Users },
          { label: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle },
          { label: 'Taxonomy', href: '/admin/taxonomy', icon: Layers },
        ];
    }
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row antialiased">
      {/* ---------------- VERTICAL NAVBAR (SIDEBAR) ---------------- */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-[#E5E7EB] flex items-center shrink-0">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
                X
              </span>
              <div>
                <span className="text-sm font-black tracking-tight text-[#111827]">
                  XPO <span className="text-[#E8192C]">{workspaceTitle}</span>
                </span>
                <span className="block text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold">
                  {workspaceSubtitle}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Scrollable Vertical Navbar) */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {group.title && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    {group.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                          isActive
                            ? theme.activeNavBg
                            : item.highlight
                            ? 'text-[#E8192C] font-semibold hover:bg-red-50/50'
                            : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? theme.activeIconColor : 'text-[#6B7280]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                              item.badge === 'Ledger'
                                ? 'bg-red-100 text-[#E8192C]'
                                : item.badge === 'WABA'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.badge === 'New'
                                ? 'bg-red-100 text-[#E8192C]'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Link to Public Platform */}
        <div className="p-3 border-t border-[#E5E7EB] shrink-0">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Marketplace
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </Link>
        </div>
      </aside>

      {/* ---------------- MAIN WORKSPACE COLUMN ---------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Top Header (Zero Hamburger Menu - Clean & Ergonomic) */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-3.5 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Left: Brand Identity & Active Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform shrink-0">
                X
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-[#111827]">
                    XPO <span className="text-[#E8192C]">{workspaceTitle}</span>
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${theme.badgeBg}`}>
                    {theme.badgeText}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] font-medium hidden sm:inline">
                  {currentBreadcrumb}
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Action Buttons & Profile Tab with Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerActions}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-xs transition-all bg-white active:scale-95"
                aria-label="User profile and settings"
              >
                <span className="text-xs font-bold text-[#111827] max-w-[120px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shadow-2xs ${theme.avatarBg}`}
                >
                  {user.avatarInitials}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>

              {/* Profile Dropdown & Mobile Action Sheet */}
              {profileDropdownOpen && (
                <>
                  {/* Mobile Slide-Up Bottom Sheet (< sm) */}
                  <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    <div
                      className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="relative bg-white rounded-t-3xl p-5 z-10 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
                      {/* Drag Handle & User Header */}
                      <div className="w-12 h-1.5 bg-[#E5E7EB] rounded-full mx-auto -mt-1 mb-2" />
                      
                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm ${theme.avatarBg}`}>
                            {user.avatarInitials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#111827]">{user.name}</div>
                            <div className="text-xs text-[#6B7280]">{user.email}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                          {theme.badgeText} Workspace
                        </span>
                      </div>

                      {/* Subscription & Plans */}
                      <Link
                        href={
                          workspaceType === 'admin'
                            ? '/admin/subscriptions'
                            : workspaceType === 'creator'
                            ? '/creator/subscription'
                            : '/absorber/subscription'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#111827]">Subscription & Plans</div>
                            <div className="text-[11px] text-[#6B7280]">
                              {workspaceType === 'creator'
                                ? 'Domestic RFQ Plan • Active'
                                : workspaceType === 'absorber'
                                ? 'Annual Partner Pass • ₹999/yr'
                                : 'Plan Pricing & Quotas'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>

                      {/* Workspace Settings */}
                      <Link
                        href={
                          workspaceType === 'admin'
                            ? '/admin/settings'
                            : workspaceType === 'creator'
                            ? '/creator/subscription'
                            : '/absorber/subscription'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#4B5563] flex items-center justify-center shrink-0">
                            <Settings className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#111827]">Workspace Settings</div>
                            <div className="text-[11px] text-[#6B7280]">Company profile, notifications & security</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* Demo Role Switcher */}
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                        <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#E8192C]" /> Switch Role (Demo)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { setProfileDropdownOpen(false); handleRoleSwitch('superadmin'); }}
                            className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-colors ${
                              workspaceType === 'admin'
                                ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-xs'
                                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
                            }`}
                          >
                            👑 Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProfileDropdownOpen(false); handleRoleSwitch('lead_creator'); }}
                            className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-colors ${
                              workspaceType === 'creator'
                                ? 'border-red-300 bg-red-50 text-[#E8192C] shadow-xs'
                                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
                            }`}
                          >
                            📋 Client
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProfileDropdownOpen(false); handleRoleSwitch('lead_absorber'); }}
                            className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-colors ${
                              workspaceType === 'absorber'
                                ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-xs'
                                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
                            }`}
                          >
                            ⚡ Partner
                          </button>
                        </div>
                      </div>

                      {/* Sign Out Button */}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors active:scale-98"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Sign Out of XPO</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Anchored Dropdown (>= sm) */}
                  <div className="hidden sm:block absolute right-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                    {/* User Info Card */}
                    <div className="px-4 py-3 border-b border-[#F3F4F6]">
                      <div className="text-xs font-bold text-[#111827] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#6B7280] truncate">{user.email}</div>
                      <div className="mt-1.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                          {theme.badgeText} Workspace
                        </span>
                      </div>
                    </div>

                    {/* Subscription & Plans */}
                    <div className="py-1">
                      <Link
                        href={
                          workspaceType === 'admin'
                            ? '/admin/subscriptions'
                            : workspaceType === 'creator'
                            ? '/creator/subscription'
                            : '/absorber/subscription'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 text-[#E8192C]" />
                          <div>
                            <span className="font-semibold block text-[#111827]">Subscription & Plans</span>
                            <span className="text-[10px] text-[#6B7280] block">
                              {workspaceType === 'creator'
                                ? 'Domestic RFQ Plan'
                                : workspaceType === 'absorber'
                                ? 'Partner Pass • ₹999/yr'
                                : 'Plan Pricing & Quotas'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </Link>

                      <Link
                        href={
                          workspaceType === 'admin'
                            ? '/admin/settings'
                            : workspaceType === 'creator'
                            ? '/creator/subscription'
                            : '/absorber/subscription'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#6B7280]" />
                        <span>Workspace Settings</span>
                      </Link>
                    </div>

                    {/* Quick Role Switch Section */}
                    <div className="py-2 border-t border-[#F3F4F6]">
                      <div className="px-4 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#E8192C]" /> Switch Role (Demo)
                      </div>
                      <div className="grid grid-cols-3 gap-1 px-3 py-1">
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch('superadmin')}
                          className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border transition-colors ${
                            workspaceType === 'admin'
                              ? 'border-purple-300 bg-purple-50 text-purple-800'
                              : 'border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          👑 Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch('lead_creator')}
                          className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border transition-colors ${
                            workspaceType === 'creator'
                              ? 'border-red-300 bg-red-50 text-[#E8192C]'
                              : 'border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          📋 Client
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch('lead_absorber')}
                          className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border transition-colors ${
                            workspaceType === 'absorber'
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          ⚡ Partner
                        </button>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-1 border-t border-[#F3F4F6]">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Sign Out of XPO</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Page Body */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* ---------------- MOBILE BOTTOM NAVIGATION BAR ---------------- */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1.5 flex justify-around items-center shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/creator/dashboard' &&
              item.href !== '/admin/dashboard' &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                isActive ? theme.bottomActiveColor : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isActive ? theme.bottomActiveBg : 'text-[#6B7280]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
