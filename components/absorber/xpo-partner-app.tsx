'use client';

import React from 'react';
import { XpoUnifiedWorkspace } from '@/components/absorber/xpo-unified-workspace';

export type PartnerScreenId =
  | 'feed'
  | 'opp'
  | 'replies'
  | 'conn'
  | 'billing'
  | 'cats'
  | 'profile'
  | 'support';

export interface PartnerOpportunity {
  id: string;
  ref: string;
  title: string;
  cat: string;
  loc: string;
  when: string;
  budget: string;
  posted: string;
  clientLabel: string;
  clientName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail: string;
  waveBadge?: string;
  isOverseas?: boolean;
  matched: boolean;
  brief: string;
  myReplyStatus: 'none' | 'sent_waiting' | 'client_requested' | 'connected' | 'declined';
  myPitch?: string;
  myTimeline?: string;
  myQuote?: string;
  repliedAt?: string;
}

export function XpoPartnerApp({
  initialScreen = 'feed',
  initialOppId,
}: {
  initialScreen?: any;
  initialOppId?: string;
}) {
  let mapped = 'reqs';
  if (initialScreen === 'opp' || initialScreen === 'lead') mapped = 'lead';
  else if (
    initialScreen === 'replies' ||
    initialScreen === 'my-responses' ||
    initialScreen === 'claims'
  )
    mapped = 'replies';
  else if (initialScreen === 'conn' || initialScreen === 'connections') mapped = 'conn';
  else if (
    initialScreen === 'billing' ||
    initialScreen === 'subscription' ||
    initialScreen === 'plan'
  )
    mapped = 'plan';
  else if (initialScreen === 'cats' || initialScreen === 'categories') mapped = 'cats';

  return (
    <XpoUnifiedWorkspace
      initialRole="partner"
      initialScreen={mapped}
      initialOppId={initialOppId}
    />
  );
}
