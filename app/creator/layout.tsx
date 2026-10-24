'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MessageSquare,
  Users,
  CreditCard,
} from 'lucide-react';
import { WorkspaceShell, NavGroup } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import { PostRequirementModal } from '@/components/creator/post-requirement-modal';

function AutoOpenPostModal({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('openPost') === 'true') {
      onOpen();
      const url = new URL(window.location.href);
      url.searchParams.delete('openPost');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [searchParams, onOpen]);

  return null;
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const [postModalOpen, setPostModalOpen] = useState(false);

  // Vertical navbar links - Post Requirement is in top header
  const navGroups: NavGroup[] = [
    {
      title: 'Commercial Requirements',
      items: [
        { label: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
        { label: 'My Requirements', href: '/creator/my-leads', icon: FileText },
      ],
    },
    {
      title: 'Partners & Connections',
      items: [
        { label: 'Interested Partners', href: '/creator/responses', icon: MessageSquare },
        { label: 'Direct Handshakes', href: '/creator/connections', icon: Users },
      ],
    },
  ];

  const headerActions = (
    <Button
      size="sm"
      onClick={() => setPostModalOpen(true)}
      className="rounded-full bg-[#E8192C] hover:bg-[#C0111F] text-white font-bold text-xs px-2.5 sm:px-3.5 py-1.5 h-8 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
    >
      <PlusCircle className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">Post a Requirement</span>
      <span className="inline sm:hidden">Post RFQ</span>
    </Button>
  );

  return (
    <>
      <WorkspaceShell
        workspaceType="creator"
        workspaceTitle="CLIENT"
        workspaceSubtitle="Client & Requirement Hub"
        navGroups={navGroups}
        headerActions={headerActions}
        user={{
          name: 'Rajesh Sharma',
          email: 'creator@xpoindia.com',
          role: 'lead_creator',
          avatarInitials: 'RS',
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </WorkspaceShell>

      {/* Auto open if routed with ?openPost=true */}
      <Suspense fallback={null}>
        <AutoOpenPostModal onOpen={() => setPostModalOpen(true)} />
      </Suspense>

      {/* Post Requirement Pop-up Modal */}
      <PostRequirementModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />
    </>
  );
}
