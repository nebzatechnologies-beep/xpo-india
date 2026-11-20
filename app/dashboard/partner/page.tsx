import React from 'react';
import type { Metadata } from 'next';
import { XpoUnifiedWorkspace } from '@/components/absorber/xpo-unified-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'XPO India — Partner Workspace',
  description: 'Verified partner workspace for high-intent business leads.',
};

export default function PartnerOverviewPage() {
  return <XpoUnifiedWorkspace initialRole="partner" initialScreen="reqs" />;
}
