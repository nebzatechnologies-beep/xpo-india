'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InlineSubscriptionPanel } from '@/components/billing/inline-subscription-panel';
import type {
  CustomerRole,
  EntitlementLedgerEntry,
  PaymentEventRecord,
  PlatformSettingsBundle,
  UserSubscription,
} from '@/lib/types/domain';
import { CreditCard, History, Infinity as InfinityIcon, Loader2, Receipt } from 'lucide-react';

interface BillingStatusPayload {
  role: CustomerRole;
  subscriptions: UserSubscription[];
  paymentEvents: PaymentEventRecord[];
  ledger: EntitlementLedgerEntry[];
  quotas: {
    client: {
      freePartnerViewsRemaining: number;
      paidPartnerViewsRemaining: number;
      paidViewsUnlimited: boolean;
      totalPartnersViewed: number;
    } | null;
    partner: {
      freeClaimsRemaining: number;
      paidClaimsRemaining: number;
      paidClaimsUnlimited: boolean;
      totalValidClaims: number;
    } | null;
  };
  pricingConfig?: PlatformSettingsBundle['subscriptions'];
  billingCurrency?: 'INR' | 'USD';
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const verifiedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/subscriptions/status');
      if (res.ok) {
        setStatus(await res.json());
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to load subscription status');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Check URL params for gateway return & automatically verify
  useEffect(() => {
    const gateway = searchParams.get('gateway');
    const rzpSubId =
      searchParams.get('razorpay_subscription_id') || searchParams.get('subscription_id');
    const rzpPaymentId = searchParams.get('razorpay_payment_id');
    const rzpSig = searchParams.get('razorpay_signature');
    const ppSubId = searchParams.get('subscription_id');
    const retStatus = searchParams.get('status');

    if (verifiedRef.current) return;

    if (gateway === 'razorpay' && rzpSubId) {
      verifiedRef.current = true;
      setVerifying(true);
      fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'razorpay',
          subscriptionId: rzpSubId,
          paymentId: rzpPaymentId || undefined,
          signature: rzpSig || undefined,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setSuccessMsg('Razorpay AutoPay subscription verified and activated successfully!');
            router.replace('/dashboard/subscription');
            void load();
          } else {
            setErrorMsg(d.error || 'Could not verify Razorpay subscription');
          }
        })
        .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'Verification failed'))
        .finally(() => setVerifying(false));
    } else if (gateway === 'paypal' && (ppSubId || retStatus === 'returned')) {
      const pendingSub = status?.subscriptions.find(
        (s) => s.gateway === 'paypal' && s.status === 'pending_mandate'
      );
      const targetId = ppSubId || pendingSub?.gatewaySubscriptionId;
      if (targetId) {
        verifiedRef.current = true;
        setVerifying(true);
        fetch('/api/subscriptions/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway: 'paypal',
            subscriptionId: targetId,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.ok) {
              setSuccessMsg('PayPal subscription verified and activated successfully!');
              router.replace('/dashboard/subscription');
              void load();
            } else {
              setErrorMsg(d.error || 'Could not verify PayPal subscription');
            }
          })
          .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'Verification failed'))
          .finally(() => setVerifying(false));
      }
    }
  }, [searchParams, status, load, router]);

  async function cancelSubscription(subscriptionId: string) {
    try {
      setCancellingId(subscriptionId);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Cancellation failed');
      setSuccessMsg('Recurring AutoPay mandate cancelled cleanly.');
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to cancel');
    } finally {
      setCancellingId(null);
    }
  }

  const activeRole: CustomerRole = status?.role === 'partner' ? 'partner' : 'client';
  const cfg = status?.pricingConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Plan, Credits & Invoices</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          {activeRole === 'client'
            ? 'Posting requirements is 100% free. Track your Partner profile view credits and Client Plan subscription.'
            : 'Track your 5-minute lead application credits and Partner Plan subscription.'}
        </p>
      </div>

      {verifying && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Verifying payment mandate with payment gateway...
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Role Entitlement Balance Summary */}
      {activeRole === 'client' ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#111827]">
              View Credits Balance
            </h2>
            <CreditCard className="w-5 h-5 text-[#E8192C]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <div className="text-[#6B7280] font-medium">Free Views</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1">
                {status?.quotas?.client?.freePartnerViewsRemaining ??
                  cfg?.clientFreePartnerViews ??
                  5}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Unlock once, view forever
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50/40 border border-red-100">
              <div className="text-[#E8192C] font-medium">Plan Views</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1 flex items-center gap-1.5">
                {status?.quotas?.client?.paidViewsUnlimited ? (
                  <>
                    <InfinityIcon className="w-5 h-5 text-emerald-600" /> Unlimited
                  </>
                ) : (
                  status?.quotas?.client?.paidPartnerViewsRemaining ?? 0
                )}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Requirement posting is always free
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <div className="text-[#6B7280] font-medium">Unlocked Partners</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1">
                {status?.quotas?.client?.totalPartnersViewed ?? 0}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">Lifetime verified views</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#111827]">
              Claim Credits Balance
            </h2>
            <CreditCard className="w-5 h-5 text-[#E8192C]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <div className="text-[#6B7280] font-medium">Free Claims</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1">
                {status?.quotas?.partner?.freeClaimsRemaining ??
                  cfg?.partnerFreeClaims ??
                  5}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                {cfg?.partnerFreeClaims ?? 5} starter claims included
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50/40 border border-red-100">
              <div className="text-[#E8192C] font-medium">Plan Claims</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1 flex items-center gap-1.5">
                {status?.quotas?.partner?.paidClaimsUnlimited ? (
                  <>
                    <InfinityIcon className="w-5 h-5 text-emerald-600" /> Unlimited
                  </>
                ) : (
                  status?.quotas?.partner?.paidClaimsRemaining ?? 0
                )}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Auto-renews on verified billing
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <div className="text-[#6B7280] font-medium">Total Claims</div>
              <div className="text-2xl font-extrabold text-[#111827] mt-1">
                {status?.quotas?.partner?.totalValidClaims ?? 0}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">Zero commission on contracts</div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Subscription Activation Panel */}
      <InlineSubscriptionPanel
        role={activeRole}
        billingCurrency={status?.billingCurrency || 'INR'}
        inrPrice={
          activeRole === 'partner'
            ? cfg?.partnerInrMonthlyPrice ?? 299
            : cfg?.clientInrMonthlyPrice ?? 299
        }
        usdPrice={
          activeRole === 'partner'
            ? cfg?.partnerUsdMonthlyPrice ?? 9.99
            : cfg?.clientUsdMonthlyPrice ?? 9.99
        }
        monthlyAllowance={
          activeRole === 'partner'
            ? cfg?.partnerPaidMonthlyClaims ?? 30
            : cfg?.clientPaidMonthlyPartnerViews ?? 30
        }
        unlimited={
          activeRole === 'partner'
            ? Boolean(cfg?.partnerPlanUnlimited)
            : Boolean(cfg?.clientPlanUnlimited)
        }
      />

      {/* Active & Past Mandates */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-sm font-bold text-[#111827] mb-3">Active & Past Subscriptions</h2>
        {loading ? (
          <p className="text-xs text-[#6B7280]">Loading subscriptions...</p>
        ) : (status?.subscriptions || []).length === 0 ? (
          <p className="text-xs text-[#6B7280]">No paid subscriptions activated yet.</p>
        ) : (
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {(status?.subscriptions || []).map((sub) => (
              <div key={sub.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold uppercase">{sub.role} Plan</span> •{' '}
                  <span className="uppercase">{sub.gateway}</span> •{' '}
                  <strong>
                    {sub.currency === 'INR' ? `₹${sub.amountMonthly}` : `$${sub.amountMonthly}`}/mo
                  </strong>
                  <div className="text-[#6B7280] mt-0.5">
                    Status: <strong className="capitalize">{sub.status.replace('_', ' ')}</strong> •
                    Cycle ends {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
                {['active', 'authenticated', 'pending_mandate'].includes(sub.status) && (
                  <button
                    type="button"
                    disabled={cancellingId === sub.id}
                    onClick={() => void cancelSubscription(sub.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === sub.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{cancellingId === sub.id ? 'Cancelling...' : 'Cancel AutoPay'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credit Ledger History */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#6B7280]" />
          <h2 className="text-sm font-bold text-[#111827]">Credit Usage & Grant Ledger</h2>
        </div>
        {(status?.ledger || []).length === 0 ? (
          <p className="text-xs text-[#6B7280]">No credit transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2">Event</th>
                  <th className="py-2">Pool</th>
                  <th className="py-2">Change</th>
                  <th className="py-2">Balance After</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {(status?.ledger || []).slice(0, 15).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 font-medium text-[#111827]">{entry.summary}</td>
                    <td className="py-2.5 capitalize text-[#6B7280]">{entry.creditPool}</td>
                    <td
                      className={`py-2.5 font-bold ${
                        entry.delta >= 0 ? 'text-emerald-700' : 'text-[#111827]'
                      }`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td className="py-2.5 text-[#374151]">
                      Free: {entry.balanceAfter.freeRemaining} • Plan:{' '}
                      {entry.balanceAfter.unlimited ? 'Unlimited' : entry.balanceAfter.paidRemaining}
                    </td>
                    <td className="py-2.5 text-[#6B7280]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-[#6B7280]" />
          <h2 className="text-sm font-bold text-[#111827]">Verified Webhook Invoices</h2>
        </div>
        {(status?.paymentEvents || []).length === 0 ? (
          <p className="text-xs text-[#6B7280]">No billing events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Gateway</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Tax</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {(status?.paymentEvents || []).map((ev) => (
                  <tr key={ev.id}>
                    <td className="py-2.5 font-mono font-semibold">{ev.invoiceNumber || ev.id}</td>
                    <td className="py-2.5 uppercase">{ev.gateway}</td>
                    <td className="py-2.5 font-bold">
                      {ev.currency === 'INR' ? `₹${ev.amount}` : `$${ev.amount}`}
                    </td>
                    <td className="py-2.5">
                      {ev.currency === 'INR' ? `₹${ev.taxAmount}` : `$${ev.taxAmount}`}
                    </td>
                    <td className="py-2.5 capitalize">{ev.status.replace('_', ' ')}</td>
                    <td className="py-2.5">{new Date(ev.occurredAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionAndQuotasPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
          Loading subscription & quotas...
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
