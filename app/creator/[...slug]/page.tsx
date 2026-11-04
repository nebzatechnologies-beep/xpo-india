'use client';

import React, { use } from 'react';
import { XpoClientApp } from '@/components/creator/xpo-client-app';

export default function CreatorCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const first = slug?.[0] || 'dashboard';
  let initialScreen: 'home' | 'req' | 'requests' | 'conn' | 'billing' = 'home';
  if (first === 'my-leads' || first === 'requirements') initialScreen = 'requests';
  else if (first === 'responses' || first === 'claims') initialScreen = 'req';
  else if (first === 'connections') initialScreen = 'conn';
  else if (first === 'subscription' || first === 'billing') initialScreen = 'billing';

  return <XpoClientApp initialScreen={initialScreen} />;
}
