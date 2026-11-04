'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminCopilotDrawer } from '@/components/agent/admin-copilot-drawer';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Bot,
  LayoutDashboard,
  Layers,
  Database,
  UploadCloud,
  MessageCircle,
  FileText,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Receipt,
  Send,
  Users,
  Settings,
  ScrollText,
  ChevronDown,
  ChevronRight,
  LogOut,
  ExternalLink,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: Array<{ label: string; href: string }>;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Databases',
    items: [
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Client Database', href: '/admin/clients', icon: Building2 },
      { label: 'Partner Database', href: '/admin/partners', icon: Briefcase },
      { label: 'Requirements & Leads', href: '/admin/leads', icon: FileText },
      { label: 'Verification & Trust', href: '/admin/verification', icon: ShieldCheck },
    ],
  },
  {
    title: 'Catalog & CRM Tools',
    items: [
      {
        label: 'Categories & Services',
        href: '/admin/taxonomy',
        icon: Layers,
        subItems: [
          { label: 'All Categories', href: '/admin/taxonomy' },
          { label: 'Sectors', href: '/admin/taxonomy/sectors' },
          { label: 'Categories', href: '/admin/taxonomy/categories' },
          { label: 'Subcategories', href: '/admin/taxonomy/subcategories' },
          { label: 'Skills & Tags', href: '/admin/taxonomy/tags' },
          { label: 'Custom Fields', href: '/admin/taxonomy/form-builder' },
          { label: 'Import & Export', href: '/admin/taxonomy/import-export' },
          { label: 'Change History', href: '/admin/taxonomy/history' },
        ],
      },
      {
        label: 'Unified CRM & Consent',
        href: '/admin/crm',
        icon: Database,
        subItems: [
          { label: 'All Contacts', href: '/admin/crm' },
          { label: 'Audience Segments', href: '/admin/crm/segments' },
          { label: 'Opt-Outs & Consent', href: '/admin/crm/consent' },
        ],
      },
      {
        label: 'Excel Uploads',
        href: '/admin/import/companies',
        icon: UploadCloud,
        subItems: [
          { label: 'Contact Uploads', href: '/admin/import/companies' },
          { label: 'Import Categories', href: '/admin/import/taxonomy' },
          { label: 'Upload History', href: '/admin/import/history' },
        ],
      },
    ],
  },
  {
    title: 'WhatsApp & Agent',
    items: [
      {
        label: 'WhatsApp Automation',
        href: '/admin/whatsapp',
        icon: MessageCircle,
        subItems: [
          { label: 'Overview', href: '/admin/whatsapp' },
          { label: 'API Settings', href: '/admin/whatsapp/connect' },
          { label: 'Conversation Flows', href: '/admin/whatsapp/builder' },
          { label: 'Message Templates', href: '/admin/whatsapp/templates' },
          { label: 'Support Inbox', href: '/admin/whatsapp/inbox' },
          { label: 'Simulator', href: '/admin/whatsapp/simulator' },
          { label: 'Activity Logs', href: '/admin/whatsapp/logs' },
        ],
      },
      {
        label: 'Invitations & Broadcasts',
        href: '/admin/campaigns',
        icon: Send,
      },
    ],
  },
  {
    title: 'Subscriptions & Settings',
    items: [
      {
        label: 'Plans & Quotas',
        href: '/admin/subscriptions',
        icon: CreditCard,
      },
      {
        label: 'Payment Transactions',
        href: '/admin/payments',
        icon: Receipt,
      },
      {
        label: 'Registered Accounts',
        href: '/admin/users',
        icon: Users,
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: ScrollText,
      },
      {
        label: 'Platform Settings',
        href: '/admin/settings',
        icon: Settings,
        subItems: [
          { label: 'General Settings', href: '/admin/settings' },
          { label: 'Payment & API Keys', href: '/admin/settings/gateways' },
          { label: 'Matching & Dispatch', href: '/admin/settings/matching' },
        ],
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, configured, signOut } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Core Databases': true,
    'Catalog & CRM Tools': true,
    'WhatsApp & Agent': true,
    'Subscriptions & Settings': true,
  });
  const [copilotOpen, setCopilotOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const adminName = user?.displayName || 'Superadmin';
  const adminContact = user?.email || user?.phoneE164 || 'Platform Admin';

  let currentBreadcrumb = 'Overview';
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href) {
        currentBreadcrumb = item.label;
        break;
      }
      if (item.subItems) {
        const sub = item.subItems.find((s) => s.href === pathname);
        if (sub) {
          currentBreadcrumb = `${item.label} / ${sub.label}`;
          break;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F6F4] text-[#15171C] flex flex-col lg:flex-row antialiased">
      <aside className="w-64 bg-white border-r border-[#E4E5E9] shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="h-14 px-5 border-b border-[#E4E5E9] flex items-center justify-between shrink-0">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2.5 group">
              <img
                src="/xpo-logo.png"
                alt="XPO"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1E9FB] text-[#5B21B6] uppercase tracking-wider">
              SUPERADMIN
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {NAV_SECTIONS.map((sec) => {
              const isOpen = openSections[sec.title] ?? true;
              return (
                <div key={sec.title} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({ ...prev, [sec.title]: !isOpen }))
                    }
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-[#8A8E97] uppercase tracking-wider hover:text-[#15171C]"
                  >
                    <span>{sec.title}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="space-y-0.5">
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isDirect = pathname === item.href;
                        const isSub = item.subItems?.some((s) => pathname === s.href);
                        const isActive = isDirect || isSub;

                        return (
                          <div key={item.href}>
                            <Link
                              href={item.href}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                                isActive
                                  ? 'bg-[#15171C] text-white font-semibold shadow-xs'
                                  : 'text-[#4A4F59] hover:text-[#15171C] hover:bg-[#EDEDEA]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? 'text-white' : 'text-[#8A8E97]'
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>
                            </Link>

                            {item.subItems && isActive && (
                              <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-[#E4E5E9] ml-4 my-1">
                                {item.subItems.map((sub) => {
                                  const isSubActive = pathname === sub.href;
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={`block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
                                        isSubActive
                                          ? 'text-[#15171C] font-bold bg-[#EDEDEA]'
                                          : 'text-[#4A4F59] hover:text-[#15171C] hover:bg-[#FBFBFA]'
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

        <div className="p-3 border-t border-[#E4E5E9] space-y-1">
          <Link
            href="/dashboard/client"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#4A4F59] hover:bg-[#EDEDEA] transition-colors"
          >
            <span>Client Workspace</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8E97]" />
          </Link>
          <Link
            href="/dashboard/partner"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#4A4F59] hover:bg-[#EDEDEA] transition-colors"
          >
            <span>Partner Workspace</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8E97]" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#C8102E] hover:bg-[#FDECEE] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#E4E5E9] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/admin/dashboard"
              className="text-[#8A8E97] hover:text-[#15171C] font-medium"
            >
              Superadmin
            </Link>
            <span className="text-[#CFD1D6]">/</span>
            <span className="font-bold text-[#15171C]">{currentBreadcrumb}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-[#15171C]">{adminName}</div>
              <div className="text-[11px] text-[#8A8E97]">{adminContact}</div>
            </div>
            <button
              type="button"
              onClick={() => setCopilotOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-colors shadow-xs ${
                copilotOpen
                  ? 'bg-[#15171C] text-white border-[#15171C]'
                  : 'bg-white text-[#15171C] border-[#CFD1D6] hover:bg-[#FBFBFA]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#C8102E]" />
              XPO Agent
            </button>
            <Link
              href="/admin/whatsapp/simulator"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-[#E3F2E8] text-[#14532D] font-semibold text-xs hover:opacity-90 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              WhatsApp Simulator
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
            {!configured && (
              <div className="mb-6 p-3.5 rounded-xl bg-[#FFF4DF] border border-[#F59E0B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7A4A00]">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>
                    <strong>Setup Pending:</strong> Configure your WhatsApp, Payment Gateway, and AI
                    Agent keys in{' '}
                    <Link
                      href="/admin/settings/gateways"
                      className="underline font-bold"
                    >
                      Settings &gt; Gateways
                    </Link>
                    .
                  </span>
                </div>
                <Link
                  href="/admin/settings/gateways"
                  className="shrink-0 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#15171C] text-white font-semibold text-xs"
                >
                  Configure Gateways →
                </Link>
              </div>
            )}
            {children}
          </main>

          <AdminCopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
        </div>
      </div>

      {/* Prototype Quick-Switch Bar (matching XPO End-to-End UX) */}
      <div className="fixed right-3.5 bottom-3.5 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-[#15171C] text-white shadow-xl text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-[#C8102E] ml-2" />
        <span className="px-1.5 text-[11.5px] text-white/80">Superadmin</span>
        <Link
          href="/dashboard/client"
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11.5px] transition-colors"
        >
          Client app →
        </Link>
        <Link
          href="/dashboard/partner"
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11.5px] transition-colors"
        >
          Partner app →
        </Link>
      </div>
    </div>
  );
}
