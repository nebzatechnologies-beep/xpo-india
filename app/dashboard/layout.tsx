'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { WorkspaceShell, type NavGroup } from '@/components/shared/workspace-shell';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole } from '@/lib/types/domain';
import {
  LayoutDashboard,
  FilePlus2,
  FolderKanban,
  UserCheck,
  Zap,
  CheckCircle2,
  Users,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

function getNavGroupsForRole(role: CustomerRole): {
  title: string;
  subtitle: string;
  groups: NavGroup[];
} {
  if (role === 'partner') {
    return {
      title: 'Partner',
      subtitle: 'Leads & Clients',
      groups: [
        {
          title: 'Partner Workspace',
          items: [
            { label: 'Overview & Agent', href: '/dashboard/partner', icon: LayoutDashboard },
            {
              label: 'Lead Offers',
              href: '/dashboard/partner/offers',
              icon: Zap,
              badge: 'LIVE',
              highlight: true,
            },
            { label: 'Connections', href: '/dashboard/connections', icon: Users },
          ],
        },
      ],
    };
  }

  return {
    title: 'Client',
    subtitle: 'Find Verified Partners',
    groups: [
      {
        title: 'Client Workspace',
        items: [
          { label: 'Overview & Agent', href: '/dashboard/client', icon: LayoutDashboard },
          {
            label: 'Post Requirement',
            href: '/dashboard/client/post-requirement',
            icon: FilePlus2,
            highlight: true,
          },
          {
            label: 'Requirements',
            href: '/dashboard/client/requirements',
            icon: FolderKanban,
          },
          {
            label: 'Partner Responses',
            href: '/dashboard/client/claims',
            icon: UserCheck,
          },
          { label: 'Connections', href: '/dashboard/connections', icon: Users },
        ],
      },
    ],
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, configured, user, profiles } = useAuth();

  // Strictly enforce single customer role per account
  const activeRole: CustomerRole = user?.role || 'client';

  const isCrossRoleMismatch =
    !loading &&
    Boolean(user) &&
    !user?.isSuperadmin &&
    ((user?.role === 'client' && pathname.startsWith('/dashboard/partner')) ||
      (user?.role === 'partner' && pathname.startsWith('/dashboard/client')));

  useEffect(() => {
    if (loading) return;
    if (configured && !user) {
      router.replace('/login');
      return;
    }
    if (!user || user.isSuperadmin) return;
    if (user.role === 'client' && pathname.startsWith('/dashboard/partner')) {
      router.replace('/dashboard/client');
    } else if (user.role === 'partner' && pathname.startsWith('/dashboard/client')) {
      router.replace('/dashboard/partner');
    }
  }, [loading, configured, user, pathname, router]);

  if (loading || (configured && !user) || isCrossRoleMismatch) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-medium text-[#6B7280]">
        Loading your XPO workspace...
      </div>
    );
  }

  const nav = getNavGroupsForRole(activeRole);

  const getRoleInitials = (name?: string | null) => {
    if (!name) return 'XP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || 'XP';
    return `${parts[0]?.charAt(0) || ''}${parts[1]?.charAt(0) || ''}`.toUpperCase();
  };

  const getCompanyOrDisplayName = () => {
    if (activeRole === 'partner' && profiles.partner?.businessName) {
      return `${user?.displayName || 'Partner'} (${profiles.partner.businessName})`;
    }
    if (activeRole === 'client' && profiles.client?.businessName) {
      return `${user?.displayName || 'Client'} (${profiles.client.businessName})`;
    }
    return user?.displayName || 'XPO Member';
  };

  const freeBadge =
    activeRole === 'partner' ? (
      <Link
        href="/dashboard/subscription"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-[#111827] transition"
      >
        <CreditCard className="w-3.5 h-3.5 text-[#E8192C]" />
        {profiles.partner?.paidClaimsUnlimited
          ? 'Partner Plan: Unlimited Claims'
          : `${(profiles.partner?.freeClaimsRemaining ?? 0) + (profiles.partner?.paidClaimsRemaining ?? 0)} Claims`}
      </Link>
    ) : (
      <Link
        href="/dashboard/subscription"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-[#111827] transition"
      >
        <CreditCard className="w-3.5 h-3.5 text-[#E8192C]" />
        {profiles.client?.paidViewsUnlimited
          ? 'Client Plan: Unlimited Views'
          : `${(profiles.client?.freePartnerViewsRemaining ?? 0) + (profiles.client?.paidPartnerViewsRemaining ?? 0)} View Credits`}
      </Link>
    );

  return (
    <WorkspaceShell
      workspaceType={activeRole}
      workspaceTitle={nav.title}
      workspaceSubtitle={nav.subtitle}
      navGroups={nav.groups}
      headerActions={freeBadge}
      user={{
        name: getCompanyOrDisplayName(),
        email: user?.email || user?.phoneE164 || '',
        avatarInitials: getRoleInitials(user?.displayName),
        role: nav.title,
      }}
    >
      {user?.verificationStatus === 'unverified' && activeRole === 'partner' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Partner Trust Badge Recommended:</strong> Submit your business or KYC proof
              to earn the Verified Partner badge shown on Client teaser cards.
            </span>
          </div>
          <Link
            href="/dashboard/verification"
            className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold shrink-0 transition"
          >
            Verify Profile
          </Link>
        </div>
      )}

      {children}
    </WorkspaceShell>
  );
}
