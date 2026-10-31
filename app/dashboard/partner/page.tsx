'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CustomerAgentPanel } from '@/components/agent/customer-agent-panel';
import { InlineSubscriptionPanel } from '@/components/billing/inline-subscription-panel';
import { useAuth } from '@/lib/auth/auth-context';
import type { PartnerRoleProfile, WhatsAppLeadOffer } from '@/lib/types/domain';
import { ArrowRight, CheckCircle2, CreditCard, Loader2, Power, Zap } from 'lucide-react';

export default function PartnerOverviewPage() {
  const { user, profiles, refreshSession } = useAuth();
  const partnerProfile = profiles.partner as PartnerRoleProfile | null;

  const [offers, setOffers] = useState<WhatsAppLeadOffer[]>([]);
  const [toggling, setToggling] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/offers');
    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleAvailability() {
    if (!partnerProfile) return;
    const currentlyPaused =
      partnerProfile.notificationsPaused || partnerProfile.availability === 'paused';
    try {
      setToggling(true);
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          role: 'partner',
          profileUpdates: {
            notificationsPaused: !currentlyPaused,
            availability: currentlyPaused ? 'available' : 'paused',
          },
        }),
      });
      await refreshSession();
    } finally {
      setToggling(false);
    }
  }

  const freeRemaining = partnerProfile?.freeClaimsRemaining ?? 5;
  const paidRemaining = partnerProfile?.paidClaimsRemaining ?? 0;
  const unlimitedClaims = Boolean(
    partnerProfile?.paidClaimsUnlimited && partnerProfile?.activeSubscriptionId
  );
  const liveOffers = offers.filter((o) => ['dispatched', 'delivered'].includes(o.status));
  const alertsActive =
    !partnerProfile?.notificationsPaused && partnerProfile?.availability !== 'paused';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Partner Workspace</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Receive matching Client opportunities on WhatsApp & Web. Zero deductions on ignored or declined leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={toggling}
            onClick={() => void toggleAvailability()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border disabled:opacity-50 ${
              alertsActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            <span>
              {toggling
                ? 'Updating...'
                : alertsActive
                ? 'Alerts Active'
                : 'Alerts Paused'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowUpgrade((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold"
          >
            <CreditCard className="w-3.5 h-3.5" /> {showUpgrade ? 'Hide Plan' : 'Partner Plan'}
          </button>
        </div>
      </div>

      {showUpgrade && (
        <InlineSubscriptionPanel
          role="partner"
          billingCurrency={user?.billingCurrency || 'INR'}
          onDismiss={() => setShowUpgrade(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="text-xs font-semibold text-[#6B7280]">Free Claims</div>
          <div className="mt-2 text-3xl font-extrabold text-[#111827]">{freeRemaining}</div>
          <div className="mt-1 text-[11px] text-[#6B7280]">Available starter credits</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="text-xs font-semibold text-[#6B7280]">Plan Claims</div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600">
            {unlimitedClaims ? 'Unlimited' : paidRemaining}
          </div>
          <div className="mt-1 text-[11px] text-[#6B7280]">
            {unlimitedClaims ? 'Partner Plan Unlimited Active' : 'Monthly plan credits'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
            <span>Active Offers</span>
            <Zap className="w-4 h-4 text-[#E8192C]" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-[#E8192C]">{liveOffers.length}</div>
          <div className="mt-1 text-[11px] text-[#6B7280]">Awaiting your response</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
            <span>Total Claims</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-[#111827]">
            {partnerProfile?.totalValidClaims ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-[#6B7280]">Claimed opportunities</div>
        </div>
      </div>

      {/* Conversational Partner Agent */}
      <CustomerAgentPanel
        role="partner"
        compact
        onActionCompleted={() => {
          void load();
          void refreshSession();
        }}
      />

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Live 5-Minute Opportunity Queue</h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Review matched Client requirements and express interest before the 5-minute window
            redirects to the next eligible Partner.
          </p>
        </div>
        <Link
          href="/dashboard/partner/offers"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-xs font-bold shrink-0"
        >
          Open Live Leads ({liveOffers.length}) <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
