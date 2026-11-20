import React from 'react';
import type { Metadata } from 'next';
import { XpoUnifiedWorkspace } from '@/components/absorber/xpo-unified-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'XPO India — Client Workspace',
  description: 'Verified client requirement workspace with 5-minute wave matching.',
};

export default function ClientOverviewPage() {
  return <XpoUnifiedWorkspace initialRole="client" initialScreen="home" />;
}
