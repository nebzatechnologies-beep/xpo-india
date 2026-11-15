'use client';

import React from 'react';
import { XpoUnifiedWorkspace } from '@/components/absorber/xpo-unified-workspace';

export type ClientScreen =
  | 'welcome'
  | 'home'
  | 'requests'
  | 'req'
  | 'notifs'
  | 'conn'
  | 'billing'
  | 'profile'
  | 'verify'
  | 'settings'
  | 'help'
  | 'account';

export interface PartnerReply {
  id: string;
  real: string;
  masked: string;
  city: string;
  verified: boolean;
  pitch: string;
  tags: string[];
  details: string;
  phone: string;
  st: 'locked' | 'waiting' | 'unlocked' | 'connected' | 'declined';
}

export interface ClientReqItem {
  code: string;
  title: string;
  sector: string;
  cat: string;
  sub: string;
  loc: string;
  timeline: string;
  budget: string;
  spec: string;
  posted: string;
  status: 'interested' | 'finding' | 'held' | 'rejected' | 'nomatch' | 'closed';
  closedReason?: string;
  wave: number;
  partners: PartnerReply[];
}

export function XpoClientApp({ initialScreen = 'home' }: { initialScreen?: any }) {
  let mapped = 'home';
  if (initialScreen === 'requests' || initialScreen === 'reqs') mapped = 'reqs';
  else if (initialScreen === 'req') mapped = 'req';
  else if (initialScreen === 'conn' || initialScreen === 'connections') mapped = 'conn';
  else if (initialScreen === 'billing' || initialScreen === 'plan') mapped = 'plan';

  return <XpoUnifiedWorkspace initialRole="client" initialScreen={mapped} />;
}
