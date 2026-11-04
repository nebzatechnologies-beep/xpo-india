'use client';

import React, { use } from 'react';
import { XpoPartnerApp, type PartnerScreenId } from '@/components/absorber/xpo-partner-app';

export default function AbsorberCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const first = slug?.[0] || 'opportunities';
  const second = slug?.[1];
  let initialScreen: PartnerScreenId = 'feed';
  if (first === 'opportunities' && second) initialScreen = 'opp';
  else if (first === 'my-responses' || first === 'claims') initialScreen = 'replies';
  else if (first === 'connections') initialScreen = 'conn';
  else if (first === 'subscription' || first === 'billing') initialScreen = 'billing';

  return <XpoPartnerApp initialScreen={initialScreen} initialOppId={second} />;
}
