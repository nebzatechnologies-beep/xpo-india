'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Users,
  Sliders,
  Settings,
  Database,
  UploadCloud,
  Send,
  MessageCircle,
  Network,
  Tag,
  FolderTree,
  FileSpreadsheet,
  Layers,
  History,
  Inbox,
  Workflow,
  BarChart3,
  PlugZap,
  Sparkles,
  CheckCircle2,
  LogOut,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckSquare,
  Building2,
  FileCode2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
    badge?: string;
    subItems?: { label: string; href: string }[];
  }[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Keep sections open by default or track open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Executive Operations': true,
    'Plans & Deployment Demos': true,
    'Database & Acquisitions': true,
    'Communications & Taxonomy': true,
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const navSections: NavSection[] = [
    {
      title: 'Executive Operations',
      items: [
        { label: 'Executive Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Moderate Leads', href: '/admin/leads', icon: FileText },
        { label: 'User Directory', href: '/admin/users', icon: Users },
        { label: 'Transaction Records', href: '/admin/payments', icon: CreditCard, highlight: true, badge: 'Ledger' },
      ],
    },
    {
      title: 'Plans & Deployment Demos',
      items: [
        { label: 'Plan Pricing & Quotas', href: '/admin/subscriptions', icon: Sliders, badge: 'IN / Global' },
        { label: 'Deployment Demos', href: '/admin/demos', icon: Sparkles, badge: 'Live Demo' },
      ],
    },
    {
      title: 'Database & Acquisitions',
      items: [
        {
          label: 'Company CRM',
          href: '/admin/crm',
          icon: Database,
          subItems: [
            { label: 'All Contacts', href: '/admin/crm' },
            { label: 'Companies Directory', href: '/admin/crm/companies' },
            { label: 'Audience Segments', href: '/admin/crm/segments' },
            { label: 'Consent Audit', href: '/admin/crm/consent' },
          ],
        },
        {
          label: 'Excel Import Centre',
          href: '/admin/import/companies',
          icon: UploadCloud,
          subItems: [
            { label: 'Import Companies', href: '/admin/import/companies' },
            { label: 'Import Taxonomy', href: '/admin/import/taxonomy' },
            { label: 'Import History', href: '/admin/import/history' },
          ],
        },
      ],
    },
    {
      title: 'Communications & Taxonomy',
      items: [
        {
          label: 'WhatsApp Centre',
          href: '/admin/whatsapp',
          icon: MessageCircle,
          badge: 'WABA',
          subItems: [
            { label: 'WABA Overview', href: '/admin/whatsapp' },
            { label: 'Bulk Campaigns', href: '/admin/whatsapp/campaigns' },
            { label: 'Live Inbox', href: '/admin/whatsapp/inbox' },
            { label: 'Message Templates', href: '/admin/whatsapp/templates' },
            { label: 'Automations', href: '/admin/whatsapp/automations' },
          ],
        },
        {
          label: 'Taxonomy Engine',
          href: '/admin/taxonomy',
          icon: Network,
          badge: 'V4',
          subItems: [
            { label: 'Taxonomy Tree', href: '/admin/taxonomy' },
            { label: 'Sectors & Categories', href: '/admin/taxonomy/categories' },
            { label: 'Dynamic Form Builder', href: '/admin/taxonomy/form-builder' },
          ],
        },
        {
          label: 'Platform Settings',
          href: '/admin/settings',
          icon: Settings,
          subItems: [
            { label: 'System & Gateways', href: '/admin/settings' },
            { label: 'n8n Automation', href: '/admin/settings/integrations/n8n' },
          ],
        },
      ],
    },
  ];

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
        window.location.reload();
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#EBEBEB] flex flex-col justify-between shrink-0 hidden lg:flex select-none">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Header */}
          <div className="p-5 border-b border-[#EBEBEB] shrink-0">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                X
              </span>
              <div>
                <span className="text-base font-black tracking-tight text-[#222222]">
                  XPO <span className="text-[#E8192C]">ADMIN</span>
                </span>
                <span className="block text-[10px] text-[#717171] uppercase tracking-wider font-semibold">
                  Enterprise Suite V4
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links Scrollable */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
            {navSections.map((section) => {
              const isOpen = openSections[section.title] ?? true;
              return (
                <div key={section.title} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-[#999999] uppercase tracking-wider hover:text-[#555555] transition-colors"
                  >
                    <span>{section.title}</span>
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>

                  {isOpen && (
                    <div className="space-y-0.5 pt-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isDirectActive = pathname === item.href;
                        const isSubActive = item.subItems?.some(s => pathname === s.href);
                        const isActive = isDirectActive || isSubActive;

                        return (
                          <div key={item.href} className="space-y-0.5">
                            <Link
                              href={item.href}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                                isActive
                                  ? 'bg-red-50 text-[#E8192C] font-semibold'
                                  : 'text-[#555555] hover:text-[#222222] hover:bg-[#F7F7F7]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E8192C]' : 'text-[#717171]'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                                  item.badge === 'Ledger'
                                    ? 'bg-red-100 text-[#E8192C]'
                                    : item.badge === 'WABA'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-neutral-100 text-neutral-700'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </Link>

                            {/* Sub items dropdown if active */}
                            {item.subItems && isActive && (
                              <div className="pl-7 pr-2 py-1 space-y-0.5 border-l-2 border-red-100 ml-4 my-0.5">
                                {item.subItems.map((sub) => {
                                  const isCurrentSub = pathname === sub.href;
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={`block px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                                        isCurrentSub
                                          ? 'text-[#E8192C] font-bold bg-red-50/60'
                                          : 'text-[#717171] hover:text-[#222222] hover:bg-[#F5F5F5]'
                                      }`}
                                    >
                                      {sub.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
            <span className="text-[10px] text-[#9CA3AF]">↗</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Top Header (Uncluttered) */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Left: Clean Breadcrumbs */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              👑 Admin Console
            </span>
            <span className="text-xs text-[#9CA3AF]">/</span>
            <span className="text-xs font-bold text-[#111827]">
              {pathname.includes('/taxonomy')
                ? 'Taxonomy Engine'
                : pathname.includes('/whatsapp')
                ? 'WhatsApp Centre'
                : pathname.includes('/crm') || pathname.includes('/import')
                ? 'Database & Acquisition'
                : pathname.includes('/payments')
                ? 'Transaction Records'
                : pathname.includes('/leads')
                ? 'Lead Moderation'
                : pathname.includes('/settings')
                ? 'Platform Settings'
                : 'Executive Overview'}
            </span>
          </div>

          {/* Right: Pure Profile Tab with Dropdown (Sign Out & Settings inside) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-xs transition-all bg-white"
            >
              <span className="text-xs font-bold text-[#111827] max-w-[130px] truncate hidden sm:inline">
                Super Admin
              </span>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold bg-purple-600 text-white">
                SA
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                {/* User Info Card */}
                <div className="px-4 py-3 border-b border-[#F3F4F6]">
                  <div className="text-xs font-bold text-[#111827]">Super Admin</div>
                  <div className="text-[11px] text-[#6B7280]">admin@xpoindia.com</div>
                  <div className="mt-1.5">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Superadmin Mode
                    </span>
                  </div>
                </div>

                {/* Settings & Configuration */}
                <div className="py-1">
                  <Link
                    href="/admin/subscriptions"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-purple-700" />
                      <div>
                        <span className="font-semibold block text-[#111827]">Subscription Plans & Quotas</span>
                        <span className="text-[10px] text-[#6B7280] block">Domestic & International Pricing</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Manage
                    </span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#6B7280]" />
                    <span>Gateway & Platform Settings</span>
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-[#6B7280]" />
                    <span>View Live Marketplace ↗</span>
                  </Link>
                </div>

                {/* Reset Demo Accounts */}
                <div className="px-3 py-1.5 border-t border-[#F3F4F6]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeed}
                    isLoading={seeding}
                    className="w-full text-[11px] font-semibold border-red-200 text-[#E8192C] hover:bg-red-50 flex items-center justify-center gap-1.5 rounded-xl h-8"
                  >
                    {seedSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Data Seeded!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Reset Demo Accounts</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Role Switch Section */}
                <div className="py-1 border-t border-[#F3F4F6]">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#E8192C]" /> Switch Role
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-3 py-1">
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('superadmin')}
                      className="py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border border-purple-300 bg-purple-50 text-purple-800"
                    >
                      👑 Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('lead_creator')}
                      className="py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"
                    >
                      📋 Creator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('lead_absorber')}
                      className="py-1.5 px-1 rounded-xl text-center text-[10px] font-bold border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"
                    >
                      ⚡ Absorber
                    </button>
                  </div>
                </div>

                {/* Sign Out Button (Not hanging outside!) */}
                <div className="pt-1 border-t border-[#F3F4F6]">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/demo-switch', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ role: 'logout' }),
                        });
                        window.location.href = '/login';
                      } catch {
                        signOut({ callbackUrl: '/login' });
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Sign Out of Admin Console</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ---------------- MOBILE BOTTOM NAVIGATION BAR ---------------- */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1.5 flex justify-around items-center shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
      >
        {[
          { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Leads', href: '/admin/leads', icon: Shield },
          { label: 'CRM', href: '/admin/crm', icon: Users },
          { label: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle },
          { label: 'Taxonomy', href: '/admin/taxonomy', icon: Layers },
        ].map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                isActive ? 'text-purple-700' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-700' : 'text-[#6B7280]'
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