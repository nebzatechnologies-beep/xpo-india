'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole } from '@/lib/types/domain';

const ROLE_ROUTE_MAP: Record<CustomerRole, string> = {
  client: '/dashboard/client',
  partner: '/dashboard/partner',
};

export default function DashboardRootRedirectPage() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.isSuperadmin) {
      router.replace('/admin/dashboard');
      return;
    }
    const role = user?.role || 'client';
    router.replace(ROLE_ROUTE_MAP[role] || '/dashboard/client');
  }, [loading, user, router]);

  return (
    <div className="py-16 text-center text-sm text-[#6B7280]">
      Opening your XPO workspace...
    </div>
  );
}
