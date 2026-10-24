'use client';

import React from 'react';
import {
  Search,
  FileCheck2,
  Users,
  CreditCard,
} from 'lucide-react';
import { WorkspaceShell, NavGroup } from '@/components/shared/workspace-shell';

export default function AbsorberLayout({ children }: { children: React.ReactNode }) {
  const navGroups: NavGroup[] = [
    {
      title: 'Marketplace Opportunities',
      items: [
        { label: 'Requirements Exchange', href: '/absorber/opportunities', icon: Search, highlight: true },
        { label: 'My Expressed Interests', href: '/absorber/my-responses', icon: FileCheck2 },
      ],
    },
    {
      title: 'Direct Handshakes',
      items: [
        { label: 'Client Connections', href: '/absorber/connections', icon: Users },
      ],
    },
  ];

  return (
    <WorkspaceShell
      workspaceType="absorber"
      workspaceTitle="PARTNER"
      workspaceSubtitle="Partner & Fulfillment Hub"
      navGroups={navGroups}
      user={{
        name: 'Anil Patel',
        email: 'absorber@xpoindia.com',
        role: 'lead_absorber',
        avatarInitials: 'AP',
      }}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </WorkspaceShell>
  );
}
