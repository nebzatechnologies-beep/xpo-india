'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { InlineSubscriptionPanel } from '@/components/billing/inline-subscription-panel';
import { useAuth } from '@/lib/auth/auth-context';
import type { ClientLeadClaimView, ClientRoleProfile, PlatformSettingsBundle } from '@/lib/types/domain';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Filter,
  Handshake,
  Lock,
  Loader2,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';

interface EnrichedClaimView extends ClientLeadClaimView {
  requirementTitle?: string;
  categoryName?: string;
  workLocation?: string;
}

function ClientClaimsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqIdFilter = searchParams.get('reqId');

  const { user, profiles, refreshSession } = useAuth();
  const clientProfile = profiles.client as ClientRoleProfile | null;

  const [claims, setClaims] = useState<EnrichedClaimView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PlatformSettingsBundle['subscriptions'] | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/claims?role=client');
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to load claims');
      }

      const statusRes = await fetch('/api/subscriptions/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.pricingConfig) {
          setPricingConfig(statusData.pricingConfig);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error loading claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unlockPartner(claimId: string) {
    try {
      setBusyId(claimId);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/claims/${claimId}/unlock`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.status === 402) {
        setUpgradeReason(
          data.error ||
            'Your starter free Partner views are used up. Activate the XPO Client Plan to continue unlocking interested Partners.'
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Could not unlock Partner profile');
      }
      setUpgradeReason(null);
      setSuccessMsg(
        data.alreadyUnlocked
          ? 'Partner profile already unlocked (0 credits deducted).'
          : `Partner profile unlocked! You can now review ${data.claim?.partnerBusinessName || 'their profile'} and request a mutual connection.`
      );
      await Promise.all([load(), refreshSession()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setBusyId(null);
    }
  }

  async function requestConnection(claimId: string) {
    try {
      setBusyId(claimId);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplaceType: 'service',
          claimOrApplicationId: claimId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not initiate connection');
      }
      setSuccessMsg('Mutual connection request sent! Partner has been notified on WhatsApp & Web.');
      await load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusyId(null);
    }
  }

  const freeViews = clientProfile?.freePartnerViewsRemaining ?? 5;
  const paidViews = clientProfile?.paidPartnerViewsRemaining ?? 0;
  const unlimitedViews = Boolean(clientProfile?.paidViewsUnlimited);

  const filteredClaims = reqIdFilter
    ? claims.filter((c) => c.reqId === reqIdFilter)
    : claims;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Partner Responses</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Review verified partners interested in your requirements. Unlock a profile once to view full details and request a direct connection.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs">
          <Eye className="w-4 h-4 text-[#E8192C]" />
          <span className="text-[#6B7280]">Partner Views:</span>
          <strong className="text-[#111827]">
            {unlimitedViews ? 'Unlimited Plan' : `${freeViews} Free • ${paidViews} Plan`}
          </strong>
        </div>
      </div>

      {reqIdFilter && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="font-semibold text-[#111827]">Filtered by Requirement:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[#111827]">
              {reqIdFilter}
            </code>
            <span className="text-[#6B7280]">
              ({filteredClaims.length} partner{filteredClaims.length === 1 ? '' : 's'} responded)
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/client/claims')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8192C] hover:underline"
          >
            <X className="w-3.5 h-3.5" /> Show All
          </button>
        </div>
      )}

      {upgradeReason && (
        <InlineSubscriptionPanel
          role="client"
          billingCurrency={user?.billingCurrency || 'INR'}
          inrPrice={pricingConfig?.clientInrMonthlyPrice ?? 399}
          usdPrice={pricingConfig?.clientUsdMonthlyPrice ?? 9.99}
          monthlyAllowance={pricingConfig?.clientPaidMonthlyPartnerViews ?? 30}
          unlimited={Boolean(pricingConfig?.clientPlanUnlimited)}
          reason={upgradeReason}
          onDismiss={() => setUpgradeReason(null)}
        />
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

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
          Loading interested Partners...
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
          <p className="text-sm font-bold text-[#111827]">
            {reqIdFilter ? 'No partners responded to this requirement yet' : 'No interested Partners yet'}
          </p>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {reqIdFilter
              ? 'When matched partners claim within the 5-minute window, they will appear here.'
              : 'As soon as a matched Partner expresses interest within the 5-minute window, their card appears here.'}
          </p>
          {reqIdFilter && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/client/claims')}
              className="mt-3 text-xs font-semibold text-[#111827] underline"
            >
              View all interested Partners across all requirements
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const isUnlocked = Boolean(claim.unlockedByClient);

            return (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-[#111827] flex items-center gap-1.5">
                      {!isUnlocked && <Lock className="w-3.5 h-3.5 text-[#6B7280]" />}
                      {claim.partnerBusinessName} ({claim.partnerCity})
                    </span>
                    {claim.partnerVerificationStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> KYC Verified
                      </span>
                    )}
                    {isUnlocked && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#374151] text-[10px] font-bold">
                        Unlocked
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#4B5563]">
                    Requirement: <strong>{claim.requirementTitle || claim.xpoCode}</strong>
                    {claim.categoryName ? ` • ${claim.categoryName}` : ''}
                  </div>

                  {isUnlocked ? (
                    <>
                      {claim.capabilityNote && (
                        <p className="text-xs text-[#374151] bg-[#F9FAFB] p-2.5 rounded-xl border border-[#F3F4F6]">
                          &ldquo;{claim.capabilityNote}&rdquo;
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                        <span>Responded {new Date(claim.claimedAt).toLocaleString()}</span>
                        {claim.partnerUid && (
                          <Link
                            href={`/trust/${claim.partnerUid}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                          >
                            Verified Trust Profile <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {claim.partnerPortfolioUrl && (
                          <a
                            href={claim.partnerPortfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#111827] font-semibold hover:underline"
                          >
                            Portfolio <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-[#6B7280]">
                      Partner identity, capabilities, and portfolio are protected until unlocked.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isUnlocked ? (
                    <button
                      type="button"
                      disabled={busyId === claim.id}
                      onClick={() => void unlockPartner(claim.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black disabled:opacity-50"
                    >
                      {busyId === claim.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      <span>{busyId === claim.id ? 'Unlocking...' : 'View Partner Profile (1 Credit)'}</span>
                    </button>
                  ) : claim.status === 'connected' ? (
                    <Link
                      href="/dashboard/connections"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4" /> View Direct Contact
                    </Link>
                  ) : claim.status === 'connection_requested' || claim.connectionId ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                        Awaiting Partner Confirmation
                      </span>
                      <Link
                        href="/dashboard/connections"
                        className="text-xs text-[#6B7280] font-semibold hover:text-[#111827] underline"
                      >
                        View
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === claim.id}
                      onClick={() => void requestConnection(claim.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-xs font-bold hover:bg-[#C91424] disabled:opacity-50"
                    >
                      {busyId === claim.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Handshake className="w-4 h-4" />
                      )}
                      <span>{busyId === claim.id ? 'Requesting...' : 'Request Mutual Connection'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ClientClaimsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
          Loading interested Partners...
        </div>
      }
    >
      <ClientClaimsContent />
    </Suspense>
  );
}
