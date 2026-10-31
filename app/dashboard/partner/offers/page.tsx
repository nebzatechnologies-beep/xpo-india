'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { InlineSubscriptionPanel } from '@/components/billing/inline-subscription-panel';
import { useAuth } from '@/lib/auth/auth-context';
import type { LeadClaim, WhatsAppLeadOffer } from '@/lib/types/domain';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Handshake,
  Loader2,
  MapPin,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';

interface EnrichedOffer extends WhatsAppLeadOffer {
  requirementSummary?: {
    id: string;
    xpoCode: string;
    title: string;
    categoryName: string;
    subcategoryName?: string | null;
    specifications: string;
    workLocation: string;
    timeline: string;
    estimatedBudget?: string | null;
    clientVerificationStatus?: string;
  } | null;
}

interface EnrichedPartnerClaim extends LeadClaim {
  requirementTitle?: string;
  categoryName?: string;
  workLocation?: string;
}

function formatRemainingCountdown(expiresAt: string | null | undefined, nowMs: number): string {
  if (!expiresAt) return 'Awaiting Delivery Clock';
  const diffSec = Math.max(0, Math.floor((new Date(expiresAt).getTime() - nowMs) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function PartnerLeadOffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'applied' ? 'applied' : 'live';

  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'live' | 'applied'>(initialTab);

  // Live offers state
  const [offers, setOffers] = useState<EnrichedOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  // Applied claims state
  const [claims, setClaims] = useState<EnrichedPartnerClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    try {
      setOffersLoading(true);
      const res = await fetch('/api/offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } finally {
      setOffersLoading(false);
    }
  }, []);

  const loadClaims = useCallback(async () => {
    try {
      setClaimsLoading(true);
      setClaimsError(null);
      const res = await fetch('/api/claims?role=partner');
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      } else {
        const err = await res.json();
        setClaimsError(err.error || 'Unable to load applied leads');
      }
    } catch (err) {
      setClaimsError(err instanceof Error ? err.message : 'Network error loading applied leads');
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'applied') {
      setActiveTab('applied');
    } else if (tabParam === 'live') {
      setActiveTab('live');
    }
  }, [searchParams]);

  useEffect(() => {
    void loadOffers();
    void loadClaims();
    const poll = setInterval(() => {
      void loadOffers();
      void loadClaims();
    }, 15000);
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [loadOffers, loadClaims]);

  function handleTabChange(tab: 'live' | 'applied') {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search);
  }

  async function respondToOffer(offerId: string, action: 'claim' | 'decline') {
    try {
      setBusyId(offerId);
      setFeedback(null);
      const res = await fetch(`/api/offers/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          capabilityNote: notes[offerId] || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setUpgradeReason(
          data.error ||
            'You have completed your free starter applications. Activate the XPO Partner Plan to continue claiming opportunities.'
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Could not process offer response');
      }
      setUpgradeReason(null);
      setFeedback(
        action === 'claim'
          ? 'Interest submitted! Your Partner profile is shortlisted for the Client.'
          : 'Opportunity declined — zero credits deducted. Redirected to next eligible Partner.'
      );
      await Promise.all([loadOffers(), loadClaims(), refreshSession()]);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const liveOffers = offers.filter((o) => ['dispatched', 'delivered'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Lead Offers</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            {activeTab === 'live'
              ? 'Review matched client requirements. Express interest or decline with zero credit deduction.'
              : 'Review your claimed client leads and track mutual connection requests.'}
          </p>
        </div>

        {/* Sub-Tabs: Live Offers & Applied */}
        <div className="inline-flex p-1 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] self-start sm:self-auto select-none">
          <button
            type="button"
            onClick={() => handleTabChange('live')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${liveOffers.length > 0 ? 'text-[#E8192C]' : 'text-gray-400'}`} />
            Live Offers
            {liveOffers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E8192C] text-white text-[10px] font-extrabold">
                {liveOffers.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('applied')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'applied'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${claims.length > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
            Applied
            {claims.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-gray-200 text-[#111827] text-[10px] font-bold">
                {claims.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {upgradeReason && (
        <InlineSubscriptionPanel
          role="partner"
          billingCurrency={user?.billingCurrency || 'INR'}
          reason={upgradeReason}
          onDismiss={() => setUpgradeReason(null)}
        />
      )}

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
          {feedback}
        </div>
      )}

      {/* TAB 1: LIVE OFFERS */}
      {activeTab === 'live' && (
        <>
          {offersLoading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
              Checking active 5-minute offer rounds...
            </div>
          ) : liveOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
              <p className="text-sm font-bold text-[#111827]">No active lead offers in your queue</p>
              <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
                Keep your services, categories, and locations updated in Services & Profile so XPO
                routes matching Client requirements to your queue.
              </p>
              {claims.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('applied')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
                >
                  View Your {claims.length} Applied Leads <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {liveOffers.map((offer) => {
                const req = offer.requirementSummary;
                const isLive = ['dispatched', 'delivered'].includes(offer.status);
                const countdown = formatRemainingCountdown(offer.expiresAt, nowMs);

                return (
                  <div
                    key={offer.id}
                    className={`bg-white rounded-2xl border p-6 ${
                      isLive ? 'border-[#E8192C] ring-1 ring-red-100' : 'border-[#E5E7EB] opacity-85'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[11px] font-mono font-bold">
                          {req?.xpoCode || offer.xpoCode}
                        </span>
                        <span className="text-xs font-semibold text-[#6B7280]">
                          Round {offer.round}
                        </span>
                        {req?.clientVerificationStatus === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="w-3 h-3" /> Verified Client
                          </span>
                        )}
                      </div>

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#E8192C] text-xs font-extrabold">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> {countdown}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#4B5563] capitalize">
                          {offer.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-extrabold text-[#111827]">
                      {req?.title || 'Service Requirement'}
                    </h2>
                    <p className="mt-1.5 text-xs text-[#374151] leading-relaxed">
                      {req?.specifications}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#6B7280]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {req?.workLocation || 'India'}
                      </span>
                      <span>Category: {req?.categoryName}</span>
                      <span>Timeline: {req?.timeline}</span>
                      <span>Budget: {req?.estimatedBudget || 'To be discussed'}</span>
                    </div>

                    {isLive && (
                      <div className="mt-4 pt-4 border-t border-[#F3F4F6] space-y-3">
                        <input
                          type="text"
                          placeholder="Optional capability note for the Client (shown once unlocked)..."
                          value={notes[offer.id] || ''}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [offer.id]: e.target.value }))
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={busyId === offer.id}
                            onClick={() => void respondToOffer(offer.id, 'claim')}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === offer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>{busyId === offer.id ? 'Submitting...' : "I'm Interested"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={busyId === offer.id}
                            onClick={() => void respondToOffer(offer.id, 'decline')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-50"
                          >
                            {busyId === offer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span>Pass (0 Credit Deducted)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: APPLIED LEADS */}
      {activeTab === 'applied' && (
        <>
          {claimsError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {claimsError}
            </div>
          )}

          {claimsLoading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-xs text-[#6B7280]">
              Loading applied leads...
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
              <p className="text-sm font-bold text-[#111827]">No applied leads yet</p>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                When client requirements matching your services arrive, express interest to shortlist
                your profile for the client.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('live')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-black"
              >
                <Zap className="w-3.5 h-3.5 text-[#E8192C]" />
                Check Live Offers
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#6B7280]">{c.xpoCode}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                        {c.entitlementUsed} quota
                      </span>
                    </div>
                    <h2 className="mt-1 text-base font-bold text-[#111827]">
                      {c.requirementTitle || c.xpoCode}
                    </h2>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {c.categoryName} • {c.workLocation} • Claimed{' '}
                      {new Date(c.claimedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.connectionId ? (
                      <Link
                        href="/dashboard/connections"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        Review & Respond to Request →
                      </Link>
                    ) : c.unlockedByClient ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Reviewed by Client • Awaiting Request
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] text-[#6B7280] text-xs font-semibold border border-[#E5E7EB]">
                        <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Shortlisted • Awaiting Client Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PartnerLeadOffersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[200px] flex items-center justify-center text-xs text-[#6B7280]">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#E8192C]" /> Loading Lead Offers...
        </div>
      }
    >
      <PartnerLeadOffersContent />
    </Suspense>
  );
}
