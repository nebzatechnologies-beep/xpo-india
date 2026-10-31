'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import type { PlatformSettingsBundle, UserSubscription } from '@/lib/types/domain';

type SubSettings = PlatformSettingsBundle['subscriptions'];

export default function AdminSubscriptionsPage() {
  const [settings, setSettings] = useState<SubSettings | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'partner'>('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load subscription settings');
      setSettings(data.subscriptionSettings);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription settings');
      setSettings(data.subscriptionSettings);
      setMessage('Client & Partner quota and subscription rules saved to Firestore.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const filteredSubs = subscriptions.filter((s) =>
    roleFilter === 'all' ? true : s.role === roleFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#E8192C]" />
            Plans & Quota Control
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Control initial free allowances (default 5), monthly plan allowances, Unlimited toggles,
            and pricing for both Clients and Partners.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings/gateways"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-black shadow-xs"
          >
            Payment Gateways
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#374151] hover:bg-gray-50 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {loading || !settings ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading subscription rules...
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6 text-xs"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Plan Rules */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[#111827]">
                    Client Plan (Partner Profile Views)
                  </h2>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Posting requirements is always free. Credits apply when unlocking interested
                    Partners.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#E8192C] font-bold text-[10px] shrink-0">
                  Client Quota
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Initial Free Partner Views
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.clientFreePartnerViews}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clientFreePartnerViews: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Monthly Plan Partner Views
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={settings.clientPlanUnlimited}
                    value={settings.clientPaidMonthlyPartnerViews}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clientPaidMonthlyPartnerViews: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    India Monthly Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={settings.clientInrMonthlyPrice}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clientInrMonthlyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Global Monthly Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={settings.clientUsdMonthlyPrice}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clientUsdMonthlyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#374151] pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(settings.clientPlanUnlimited)}
                  onChange={(e) =>
                    setSettings({ ...settings, clientPlanUnlimited: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#111827]"
                />
                Grant Unlimited Partner Views while Client Plan is active
              </label>
            </div>

            {/* Partner Plan Rules */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[#111827]">
                    Partner Plan (Valid Lead Applications)
                  </h2>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Zero deduction on ignored or declined 5-min alerts. Deducts only on valid
                    application.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-gray-900 text-white font-bold text-[10px] shrink-0">
                  Partner Quota
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Initial Free Applications
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.partnerFreeClaims}
                    onChange={(e) =>
                      setSettings({ ...settings, partnerFreeClaims: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Monthly Plan Applications
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={settings.partnerPlanUnlimited}
                    value={settings.partnerPaidMonthlyClaims}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        partnerPaidMonthlyClaims: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    India Monthly Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={settings.partnerInrMonthlyPrice}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        partnerInrMonthlyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Global Monthly Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={settings.partnerUsdMonthlyPrice}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        partnerUsdMonthlyPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#374151] pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(settings.partnerPlanUnlimited)}
                  onChange={(e) =>
                    setSettings({ ...settings, partnerPlanUnlimited: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-[#111827]"
                />
                Grant Unlimited Lead Applications while Partner Plan is active
              </label>
            </div>
          </div>

          {/* Shared Commercial Policies */}
          <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-[#E5E7EB]">
            <div>
              <label className="block font-bold text-[#374151] mb-1">India GST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={50}
                value={settings.gstPercentInr}
                onChange={(e) =>
                  setSettings({ ...settings, gstPercentInr: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Client Daily Requirement Anti-Spam Cap (0 = Unlimited)
              </label>
              <input
                type="number"
                min={0}
                value={settings.clientFreeDailyRequirementLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    clientFreeDailyRequirementLimit: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2.5 cursor-pointer font-bold text-[#374151]">
                <input
                  type="checkbox"
                  checked={settings.unusedPaidAllowanceRollover}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      unusedPaidAllowanceRollover: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-[#111827]"
                />
                Roll over unused monthly paid allowances
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#374151] mb-1">
              Cancellation & AutoPay Policy Summary
            </label>
            <textarea
              rows={2}
              value={settings.cancellationPolicySummary}
              onChange={(e) =>
                setSettings({ ...settings, cancellationPolicySummary: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Entitlements activate strictly via verified Razorpay / PayPal webhook signatures.
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white font-bold shadow-xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Quota & Plan Rules'}
            </button>
          </div>
        </form>
      )}

      {/* Live AutoPay Mandates Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#111827]">
              Active & Historical Subscriptions ({filteredSubs.length})
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Client & Partner subscriptions across Razorpay (INR) and PayPal (USD).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {(['all', 'client', 'partner'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize ${
                  roleFilter === r
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Subscription ID</th>
                <th className="px-4 py-3">User UID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Plan Amount</th>
                <th className="px-4 py-3">Monthly Quota</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Current Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B7280]">
                    No Client or Partner subscriptions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-[#111827]">
                      {sub.gatewaySubscriptionId || sub.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#4B5563]">{sub.uid}</td>
                    <td className="px-4 py-3 capitalize font-bold text-[#111827]">{sub.role}</td>
                    <td className="px-4 py-3 uppercase font-semibold text-[#4B5563]">
                      {sub.gateway}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#111827]">
                      {sub.currency === 'INR' ? `₹${sub.amountMonthly}` : `$${sub.amountMonthly}`}/mo
                    </td>
                    <td className="px-4 py-3 text-[#374151]">
                      {sub.unlimitedAllowance ? 'Unlimited' : `${sub.monthlyAllowance}/mo`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sub.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'past_due'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
