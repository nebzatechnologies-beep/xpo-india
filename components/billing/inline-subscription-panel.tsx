'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustomerRole } from '@/lib/types/domain';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe2,
  Infinity as InfinityIcon,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface InlineSubscriptionPanelProps {
  role: CustomerRole;
  billingCurrency?: 'INR' | 'USD';
  inrPrice?: number;
  usdPrice?: number;
  monthlyAllowance?: number;
  unlimited?: boolean;
  reason?: string;
  onDismiss?: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function InlineSubscriptionPanel({
  role,
  billingCurrency = 'INR',
  inrPrice = 299,
  usdPrice = 9.99,
  monthlyAllowance = 30,
  unlimited = false,
  reason,
  onDismiss,
}: InlineSubscriptionPanelProps) {
  const [gateway, setGateway] = useState<'razorpay' | 'paypal'>(
    billingCurrency === 'INR' ? 'razorpay' : 'paypal'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isInr = gateway === 'razorpay';
  const priceDisplay = isInr ? `₹${inrPrice}` : `$${usdPrice}`;
  const gatewayLabel = isInr ? 'Razorpay AutoPay (UPI / Cards)' : 'PayPal Subscriptions';
  const allowanceText = unlimited
    ? role === 'partner'
      ? 'Unlimited Lead Claims'
      : 'Unlimited Partner Views'
    : role === 'partner'
      ? `${monthlyAllowance} Lead Claims / Month`
      : `${monthlyAllowance} Partner Views / Month`;

  const benefits =
    role === 'partner'
      ? [
          unlimited
            ? 'Unlimited business lead claims every month'
            : `${monthlyAllowance} business lead claims every month`,
          'Priority WhatsApp opportunity alerts in your categories',
          'Zero credits deducted on ignored or declined lead notifications',
          'Mutual-consent direct Client phone & WhatsApp release',
          'Zero platform commission — keep 100% of your project value',
        ]
      : [
          'Post unlimited business & service requirements 100% free',
          unlimited
            ? 'Unlock unlimited partner profiles every month'
            : `Unlock ${monthlyAllowance} partner profiles every month`,
          'Unlock once, view forever — zero repeat deductions for the same Partner',
          'Mutual-consent direct Partner phone, WhatsApp & portfolio access',
          'Cancel recurring plan anytime before next billing cycle',
        ];

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, gateway }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Unable to start subscription checkout');
      }

      if (gateway === 'paypal' && data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }

      if (gateway === 'razorpay') {
        const loaded = await loadRazorpayScript();
        const RazorpayCtor = (
          window as unknown as { Razorpay?: new (opts: unknown) => { open: () => void } }
        ).Razorpay;

        if (loaded && RazorpayCtor && data.keyId && data.gatewaySubscriptionId) {
          const rzp = new RazorpayCtor({
            key: data.keyId,
            subscription_id: data.gatewaySubscriptionId,
            name: 'XPO Marketplace',
            description: `${role === 'partner' ? 'Partner Plan' : 'Client Plan'} — ₹${inrPrice}/mo AutoPay`,
            theme: { color: '#E8192C' },
            handler: async (response: {
              razorpay_payment_id?: string;
              razorpay_subscription_id?: string;
              razorpay_signature?: string;
            }) => {
              try {
                setLoading(true);
                const verifyRes = await fetch('/api/subscriptions/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gateway: 'razorpay',
                    subscriptionId:
                      response.razorpay_subscription_id || data.gatewaySubscriptionId,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (verifyRes.ok && verifyData.ok) {
                  window.location.href = `/dashboard/subscription?status=verified&gateway=razorpay&razorpay_subscription_id=${data.gatewaySubscriptionId}`;
                } else {
                  throw new Error(verifyData.error || 'Mandate verification failed');
                }
              } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : 'Mandate verification failed');
                setLoading(false);
              }
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
              },
            },
          });
          rzp.open();
          return;
        }

        if (data.shortUrl) {
          window.location.href = data.shortUrl;
          return;
        }
      }

      window.location.href = '/dashboard/subscription';
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Subscription checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-[#E8192C]">
                <Lock className="w-3 h-3" /> {role === 'partner' ? 'XPO PARTNER PLAN' : 'XPO CLIENT PLAN'}
              </span>
              {unlimited && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                  <InfinityIcon className="w-3 h-3" /> Unlimited Tier
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-[#111827] tracking-tight">
              {allowanceText}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {reason ||
                (role === 'partner'
                  ? 'Continue claiming matched 5-minute Client opportunities seamlessly.'
                  : 'Reveal interested Partner identities, capabilities, and initiate direct connections.')}
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
              aria-label="Close upgrade panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 p-1 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setGateway('razorpay')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              isInr ? 'bg-white text-[#111827] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#E8192C]" />
            <span>India (₹{inrPrice}/mo)</span>
          </button>
          <button
            type="button"
            onClick={() => setGateway('paypal')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isInr ? 'bg-white text-[#111827] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Global (${usdPrice}/mo)</span>
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#111827]">{priceDisplay}</span>
              <span className="text-xs text-[#6B7280] font-medium">/ month</span>
            </div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">
              {isInr ? '+ 18% GST • UPI / Card AutoPay' : 'International PayPal AutoPay'}
            </div>
          </div>
          <Badge variant="outline" className="border-gray-300 text-[#111827] bg-white font-bold">
            {unlimited ? 'Unlimited / mo' : `${monthlyAllowance} / month`}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#374151]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#F3F4F6]">
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Webhook-verified activation • Cancel anytime</span>
          </div>
          <Button
            variant="primary"
            size="md"
            className="font-bold text-xs flex items-center justify-center gap-2"
            onClick={() => void handleCheckout()}
            isLoading={loading}
          >
            <span>Activate {priceDisplay}/mo via {gatewayLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
