'use client';

import React from 'react';
import {
  InlineSubscriptionPanel,
  type InlineSubscriptionPanelProps,
} from '@/components/billing/inline-subscription-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CustomerRole } from '@/lib/types/domain';
import { Lock, Zap } from 'lucide-react';

interface PaywallPanelProps extends Omit<InlineSubscriptionPanelProps, 'role'> {
  isOpen: boolean;
  onClose: () => void;
  role?: CustomerRole;
  title?: string;
  description?: string;
}

/**
 * Non-blocking inline subscription upgrade panel (replaces legacy modal overlay).
 */
export function PaywallModal({
  isOpen,
  onClose,
  description,
  role = 'partner',
  billingCurrency = 'INR',
  inrPrice = 299,
  usdPrice = 9.99,
  monthlyAllowance = 30,
  unlimited = false,
}: PaywallPanelProps) {
  if (!isOpen) return null;

  return (
    <InlineSubscriptionPanel
      role={role}
      billingCurrency={billingCurrency}
      inrPrice={inrPrice}
      usdPrice={usdPrice}
      monthlyAllowance={monthlyAllowance}
      unlimited={unlimited}
      reason={description}
      onDismiss={onClose}
    />
  );
}

export function PaywallCard({
  role = 'partner',
  onUnlockClick,
}: {
  role?: CustomerRole;
  onUnlockClick: () => void;
}) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="primary" className="bg-[#E8192C] text-white">
          <Lock className="w-3 h-3 mr-1" /> Monthly Plan
        </Badge>
        <span className="text-xs font-semibold text-[#6B7280]">₹299/mo or $9.99/mo</span>
      </div>
      <h4 className="text-base font-bold text-[#111827]">
        {role === 'partner'
          ? 'Activate XPO Partner Plan'
          : 'Activate XPO Client Plan'}
      </h4>
      <p className="text-xs text-[#6B7280] mt-1 mb-4 leading-relaxed">
        {role === 'partner'
          ? 'Continue claiming matched 5-minute Client opportunities after your free starter applications.'
          : 'Continue unlocking interested Partner profiles after your free starter views.'}
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onUnlockClick}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
      >
        <Zap className="w-3.5 h-3.5" /> View Upgrade Options
      </Button>
    </div>
  );
}
