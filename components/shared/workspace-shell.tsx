'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole } from '@/lib/types/domain';
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
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
  workspaceType: CustomerRole | 'admin';
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
  const { user: authUser, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleTheme = () => {
    switch (workspaceType) {
      case 'admin':
        return {
          badgeText: 'Superadmin',
          badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
          avatarBg: 'bg-[#111827] text-white',
          activeNavBg: 'bg-gray-900 text-white font-medium',
          activeIconColor: 'text-white',
          bottomActiveColor: 'text-gray-900',
          bottomActiveBg: 'bg-gray-100 text-gray-900',
        };
      case 'partner':
        return {
          badgeText: 'Partner',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          avatarBg: 'bg-[#111827] text-white',
          activeNavBg: 'bg-red-50 text-[#E8192C] font-semibold',
          activeIconColor: 'text-[#E8192C]',
          bottomActiveColor: 'text-[#E8192C]',
          bottomActiveBg: 'bg-red-50 text-[#E8192C]',
        };
      case 'client':
      default:
        return {
          badgeText: 'Client',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          avatarBg: 'bg-[#E8192C] text-white',
          activeNavBg: 'bg-red-50 text-[#E8192C] font-semibold',
          activeIconColor: 'text-[#E8192C]',
          bottomActiveColor: 'text-[#E8192C]',
          bottomActiveBg: 'bg-red-50 text-[#E8192C]',
        };
    }
  };

  const theme = getRoleTheme();

  let currentBreadcrumb = 'Workspace';
  for (const group of navGroups) {
    const matched = group.items.find(
      (i) => pathname === i.href || pathname.startsWith(i.href + '/')
    );
    if (matched) {
      currentBreadcrumb = matched.label;
      break;
    }
  }

  const getBottomNavItems = () => {
    switch (workspaceType) {
      case 'partner':
        return [
          { label: 'Overview', href: '/dashboard/partner', icon: LayoutDashboard },
          { label: 'Offers', href: '/dashboard/partner/offers', icon: Search },
          { label: 'Connections', href: '/dashboard/connections', icon: Users },
        ];
      case 'admin':
        return [
          { label: 'Monitor', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Clients', href: '/admin/clients', icon: Users },
          { label: 'Partners', href: '/admin/partners', icon: Shield },
          { label: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle },
          { label: 'Taxonomy', href: '/admin/taxonomy', icon: Layers },
        ];
      case 'client':
      default:
        return [
          { label: 'Overview', href: '/dashboard/client', icon: LayoutDashboard },
          { label: 'Post', href: '/dashboard/client/post-requirement', icon: FileText },
          { label: 'Responses', href: '/dashboard/client/claims', icon: FileCheck2 },
          { label: 'Connections', href: '/dashboard/connections', icon: Users },
        ];
    }
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col h-full overflow-hidden">
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
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 bg-red-50 text-[#E8192C]">
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

        <div className="p-3 border-t border-[#E5E7EB] shrink-0">
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Public Marketplace
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-3.5 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/dashboard" className="inline-flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
                X
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-[#111827]">
                    XPO <span className="text-[#E8192C]">{workspaceTitle}</span>
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${theme.badgeBg}`}
                  >
                    {theme.badgeText}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] font-medium hidden sm:inline">
                  {currentBreadcrumb}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerActions}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all bg-white"
              >
                <span className="text-xs font-bold text-[#111827] max-w-[130px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${theme.avatarBg}`}
                >
                  {user.avatarInitials}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 select-none">
                  <div className="px-4 py-3 border-b border-[#F3F4F6]">
                    <div className="text-xs font-bold text-[#111827] truncate">{user.name}</div>
                    <div className="text-[11px] text-[#6B7280] truncate">{user.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}
                      >
                        {theme.badgeText} Account
                      </span>
                      {authUser?.verificationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    {workspaceType === 'partner' && (
                      <Link
                        href="/dashboard/partner/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB]"
                      >
                        <UserCog className="w-4 h-4 text-[#111827]" />
                        Services & Profile
                      </Link>
                    )}
                    <Link
                      href="/dashboard/subscription"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#E8192C]" />
                        Subscription & Credits
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/verification"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      KYC & Trust Badge
                    </Link>
                    <Link
                      href="/dashboard/support"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      <Settings className="w-4 h-4 text-[#6B7280]" />
                      Support & Privacy
                    </Link>
                    {authUser?.isSuperadmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#111827] hover:bg-gray-50"
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
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Sign Out of XPO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1.5 flex justify-around items-center shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive ? theme.bottomActiveColor : 'text-[#6B7280]'
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${
                  isActive ? theme.bottomActiveBg : 'text-[#6B7280]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
