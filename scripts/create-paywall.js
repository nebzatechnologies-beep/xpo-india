const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`Created: ${relPath}`);
}

writeFile('components/ui/paywall.tsx', `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  CreditCard,
  RefreshCw,
  Globe2,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  role?: 'creator' | 'absorber';
  onSuccess?: () => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  title,
  description,
  role = 'absorber',
  onSuccess,
}: PaywallModalProps) {
  const router = useRouter();
  const [region, setRegion] = useState<'domestic' | 'international'>('domestic');
  const [isAutoPay, setIsAutoPay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isDomestic = region === 'domestic';
  const priceDisplay = isDomestic ? '₹999' : '$49';
  const period = '/ year';
  const gatewayName = isDomestic ? 'Razorpay' : 'PayPal';
  const planSlug = role === 'creator'
    ? (isDomestic ? 'creator-annual-inr' : 'creator-annual-usd')
    : (isDomestic ? 'absorber-annual-inr' : 'absorber-annual-usd');

  const benefits = role === 'creator'
    ? [
        'Post up to 50 active leads per month',
        'Instant WhatsApp & Email broadcast to qualified suppliers',
        'View complete supplier identities & verified portfolios',
        'Zero commission on commercial deals — keep 100% value',
        'Direct WhatsApp & phone unmasking for rapid handshakes',
      ]
    : [
        'Direct unmasked access to high-intent buyer phone & WhatsApp',
        'Submit unlimited proposals & commercial quotes',
        'Priority quote badge with Verified Provider checkmark',
        'Real-time WhatsApp alerts for new matching leads in your sector',
        'Zero broker cuts — complete direct buyer relationships',
      ];

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch the plan ID
      const plansRes = await fetch('/api/subscriptions/plans');
      const plansData = await plansRes.json();
      const targetPlan = plansData.plans?.find((p: any) => p.slug === planSlug) || {
        _id: '67489a12bcde34567890abcd',
        name: isDomestic ? 'Annual India Plan' : 'Annual Global Plan',
        price: isDomestic ? 999 : 49,
        currency: isDomestic ? 'INR' : 'USD',
      };

      // 1. Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan._id,
          gateway: isDomestic ? 'razorpay' : 'paypal',
          isAutoPay,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate gateway checkout');
      }

      // 2. Complete payment verification (simulates gateway modal callback)
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: isDomestic ? 'razorpay' : 'paypal',
          planId: targetPlan._id,
          razorpay_payment_id: isDomestic ? \`pay_rzp_\${Date.now()}\` : undefined,
          razorpay_order_id: orderData.orderId,
          paypal_order_id: !isDomestic ? orderData.orderId : undefined,
          isAutoPay,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      setCompleted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        router.refresh();
      }, 1800);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EBEBEB] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {completed ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 text-[#E8192C] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[#222222]">Access Unlocked!</h3>
            <p className="text-[#717171] text-sm mt-2 max-w-sm">
              Your annual subscription is active with {gatewayName}. Direct contact details and full proposals are now instantly unmasked.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4" /> Ready to connect directly
            </div>
          </div>
        ) : (
          <div className="p-7 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#E8192C]">
                <Lock className="w-3 h-3" /> DIRECT CONTACT PASS
              </span>
              <span className="text-xs text-[#717171]">Sector-Agnostic Access</span>
            </div>

            <h2 className="text-2xl font-bold text-[#222222] tracking-tight">
              {title || (role === 'creator' ? 'Connect With Verified Providers' : 'Unlock Direct Buyer Contacts')}
            </h2>
            <p className="text-sm text-[#717171] mt-1.5">
              {description || 'XPO India does not cut commissions. A single annual membership gives you 100% unmasked access.'}
            </p>

            {/* Region / Gateway Selector Tabs */}
            <div className="mt-6 grid grid-cols-2 p-1 bg-[#F7F7F7] rounded-2xl border border-[#EBEBEB]">
              <button
                type="button"
                onClick={() => setRegion('domestic')}
                className={\`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all \${
                  isDomestic
                    ? 'bg-white text-[#222222] shadow-sm'
                    : 'text-[#717171] hover:text-[#222222]'
                }\`}
              >
                <CreditCard className="w-4 h-4 text-[#E8192C]" />
                India (Razorpay - ₹999)
              </button>
              <button
                type="button"
                onClick={() => setRegion('international')}
                className={\`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all \${
                  !isDomestic
                    ? 'bg-white text-[#222222] shadow-sm'
                    : 'text-[#717171] hover:text-[#222222]'
                }\`}
              >
                <Globe2 className="w-4 h-4 text-blue-600" />
                Global (PayPal - $49)
              </button>
            </div>

            {/* Pricing Banner */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-red-50/60 to-orange-50/40 border border-red-100 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-[#222222]">{priceDisplay}</span>
                  <span className="text-sm text-[#717171] font-medium">{period}</span>
                </div>
                <div className="text-xs text-[#717171] mt-0.5">
                  {isDomestic ? 'Billed via UPI / Cards / NetBanking' : 'Billed internationally via PayPal / Cards'}
                </div>
              </div>
              <Badge variant="outline" className="border-red-200 text-[#E8192C] bg-white font-medium">
                Best Value
              </Badge>
            </div>

            {/* Benefits */}
            <div className="mt-5 space-y-2.5">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#484848]">
                  <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* AutoPay Recurring Toggle */}
            <div className="mt-6 p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw className={\`w-4 h-4 \${isAutoPay ? 'text-[#E8192C] animate-spin-slow' : 'text-[#717171]'}\`} />
                <div>
                  <div className="text-xs font-semibold text-[#222222]">AutoPay Recurring Billing</div>
                  <div className="text-[11px] text-[#717171]">Automatic renewal each year. Cancel anytime with 1 click.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoPay(!isAutoPay)}
                className={\`w-11 h-6 rounded-full transition-colors relative focus:outline-none \${
                  isAutoPay ? 'bg-[#E8192C]' : 'bg-gray-300'
                }\`}
              >
                <span
                  className={\`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform \${
                    isAutoPay ? 'translate-x-5' : 'translate-x-0'
                  }\`}
                />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold text-sm flex items-center justify-center gap-2"
                onClick={handleCheckout}
                isLoading={loading}
              >
                <span>Pay {priceDisplay} via {gatewayName}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-center gap-4 text-[11px] text-[#717171] mt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted</span>
                <span>•</span>
                <span>Zero Middleman Cuts</span>
                <span>•</span>
                <span>Official GST Invoicing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PaywallCard({
  role = 'absorber',
  onUnlockClick,
}: {
  role?: 'creator' | 'absorber';
  onUnlockClick: () => void;
}) {
  return (
    <div className="p-6 bg-gradient-to-br from-red-50/60 via-white to-orange-50/30 rounded-3xl border border-red-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="default" className="bg-[#E8192C] text-white">
          <Lock className="w-3 h-3 mr-1" /> Contact Protected
        </Badge>
        <span className="text-xs font-semibold text-[#717171]">Domestic ₹999 / Global $49</span>
      </div>
      <h4 className="text-base font-bold text-[#222222]">
        {role === 'creator' ? 'Review & Connect with Suppliers' : 'Unlock Direct Buyer WhatsApp & Phone'}
      </h4>
      <p className="text-xs text-[#717171] mt-1 mb-4 leading-relaxed">
        XPO India members connect directly with zero commission cuts. Choose between domestic India payment via Razorpay or international access via PayPal.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onUnlockClick}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
      >
        <Zap className="w-3.5 h-3.5" /> Unlock Direct Connections Now
      </Button>
    </div>
  );
}
`);
console.log('components/ui/paywall.tsx created successfully!');
