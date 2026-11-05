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
      { label: 'Overview', href: '/superadmin', icon: LayoutDashboard },
      { label: 'Client Database', href: '/superadmin/clients', icon: Building2 },
      { label: 'Partner Database', href: '/superadmin/partners', icon: Briefcase },
      { label: 'Requirements & Leads', href: '/superadmin/leads', icon: FileText },
      { label: 'Verification & Trust', href: '/superadmin/verification', icon: ShieldCheck },
    ],
  },
  {
    title: 'Catalog & CRM Tools',
    items: [
      {
        label: 'Categories & Services',
        href: '/superadmin/taxonomy',
        icon: Layers,
        subItems: [
          { label: 'All Categories', href: '/superadmin/taxonomy' },
          { label: 'Sectors', href: '/superadmin/taxonomy/sectors' },
          { label: 'Categories', href: '/superadmin/taxonomy/categories' },
          { label: 'Subcategories', href: '/superadmin/taxonomy/subcategories' },
          { label: 'Skills & Tags', href: '/superadmin/taxonomy/tags' },
          { label: 'Custom Fields', href: '/superadmin/taxonomy/form-builder' },
          { label: 'Import & Export', href: '/superadmin/taxonomy/import-export' },
          { label: 'Change History', href: '/superadmin/taxonomy/history' },
        ],
      },
      {
        label: 'Unified CRM & Consent',
        href: '/superadmin/crm',
        icon: Database,
        subItems: [
          { label: 'All Contacts', href: '/superadmin/crm' },
          { label: 'Audience Segments', href: '/superadmin/crm/segments' },
          { label: 'Opt-Outs & Consent', href: '/superadmin/crm/consent' },
        ],
      },
      {
        label: 'Excel Uploads',
        href: '/superadmin/import/companies',
        icon: UploadCloud,
        subItems: [
          { label: 'Contact Uploads', href: '/superadmin/import/companies' },
          { label: 'Import Categories', href: '/superadmin/import/taxonomy' },
          { label: 'Upload History', href: '/superadmin/import/history' },
        ],
      },
    ],
  },
  {
    title: 'WhatsApp & Agent',
    items: [
      {
        label: 'WhatsApp Automation',
        href: '/superadmin/whatsapp',
        icon: MessageCircle,
        subItems: [
          { label: 'Overview', href: '/superadmin/whatsapp' },
          { label: 'API Settings', href: '/superadmin/whatsapp/connect' },
          { label: 'Conversation Flows', href: '/superadmin/whatsapp/builder' },
          { label: 'Message Templates', href: '/superadmin/whatsapp/templates' },
          { label: 'Support Inbox', href: '/superadmin/whatsapp/inbox' },
          { label: 'Simulator', href: '/superadmin/whatsapp/simulator' },
          { label: 'Activity Logs', href: '/superadmin/whatsapp/logs' },
        ],
      },
      {
        label: 'Invitations & Broadcasts',
        href: '/superadmin/campaigns',
        icon: Send,
      },
    ],
  },
  {
    title: 'Subscriptions & Settings',
    items: [
      {
        label: 'Plans & Quotas',
        href: '/superadmin/subscriptions',
        icon: CreditCard,
      },
      {
        label: 'Payment Transactions',
        href: '/superadmin/payments',
        icon: Receipt,
      },
      {
        label: 'Registered Accounts',
        href: '/superadmin/users',
        icon: Users,
      },
      {
        label: 'Audit Logs',
        href: '/superadmin/audit-logs',
        icon: ScrollText,
      },
      {
        label: 'Platform Settings',
        href: '/superadmin/settings',
        icon: Settings,
        subItems: [
          { label: 'General Settings', href: '/superadmin/settings' },
          { label: 'Payment & API Keys', href: '/superadmin/settings/gateways' },
          { label: 'Matching & Dispatch', href: '/superadmin/settings/matching' },
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

  if (pathname === '/admin/login' || pathname === '/superadmin/login') {
    return <>{children}</>;
  }

  // Normalize pathname so both /superadmin/* and /admin/* highlight the active item
  const normPath =
    pathname === '/admin' || pathname === '/admin/dashboard' || pathname === '/superadmin/dashboard'
      ? '/superadmin'
      : pathname.startsWith('/admin/')
      ? pathname.replace(/^\/admin/, '/superadmin')
      : pathname;

  const adminName = user?.displayName || 'Superadmin';
  const adminContact = user?.email || user?.phoneE164 || 'Platform Admin';

  let currentBreadcrumb = 'Overview';
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (normPath === item.href) {
        currentBreadcrumb = item.label;
        break;
      }
      if (item.subItems) {
        const sub = item.subItems.find((s) => s.href === normPath);
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
            <Link href="/superadmin" className="inline-flex items-center gap-2.5 group">
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
                        const isDirect = normPath === item.href;
                        const isSub = item.subItems?.some((s) => normPath === s.href);
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
                                  const isSubActive = normPath === sub.href;
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
              window.location.href = '/superadmin/login';
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
              href="/superadmin"
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
                    Agent keys to enable live production dispatch.
                  </span>
                </div>
                <Link
                  href="/superadmin/settings/gateways"
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
    </div>
  );
}
