'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Loader2, Save } from 'lucide-react';
import type { PlatformSettingsBundle } from '@/lib/types/domain';

type LeadDistSettings = PlatformSettingsBundle['leadDistribution'];

export default function AdminMatchingSettingsPage() {
  const [dist, setDist] = useState<LeadDistSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load matching settings');
      setDist(data.settings.leadDistribution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load matching settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dist) return;
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadDistribution: dist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save matching settings');
      setDist(data.settings.leadDistribution);
      setMessage('Lead Distribution & Fairness Engine rules saved and audit logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#111827]" />
            Lead Distribution & Matching Rules
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure partner wave sizes, response timeouts, and fairness match weights.
          </p>
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

      {loading || !dist ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading matching rules...
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 text-xs"
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Partners Notified Per Wave
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dist.partnersPerRound}
                onChange={(e) =>
                  setDist({ ...dist, partnersPerRound: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Response Window (Seconds)
              </label>
              <input
                type="number"
                min={60}
                max={3600}
                value={dist.responseWindowSeconds}
                onChange={(e) =>
                  setDist({ ...dist, responseWindowSeconds: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
              <span className="text-[11px] text-[#6B7280]">300s = 5 minutes</span>
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Interested Partner Target
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dist.interestedPartnerTarget}
                onChange={(e) =>
                  setDist({ ...dist, interestedPartnerTarget: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-[#E5E7EB]">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#374151] mb-1">
                Clock Start Policy
              </label>
              <select
                value={dist.clockStartPolicy}
                onChange={(e) =>
                  setDist({
                    ...dist,
                    clockStartPolicy: e.target.value as LeadDistSettings['clockStartPolicy'],
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
              >
                <option value="on_delivered_with_60s_fallback">
                  Start on Meta &quot;delivered&quot; receipt (with dispatch fallback)
                </option>
                <option value="on_dispatched">Start immediately on outbound API dispatch</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Delivery Receipt Fallback (Sec)
              </label>
              <input
                type="number"
                min={15}
                max={300}
                value={dist.deliveryFallbackSeconds}
                onChange={(e) =>
                  setDist({ ...dist, deliveryFallbackSeconds: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-[#E5E7EB]">
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Quota Units Deducted on Valid Claim
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={dist.deductOnClaim}
                onChange={(e) => setDist({ ...dist, deductOnClaim: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1">
                Max Outbound WhatsApp Retries
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={dist.maxNotificationRetries}
                onChange={(e) =>
                  setDist({ ...dist, maxNotificationRetries: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[#E5E7EB]">
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] cursor-pointer">
              <span className="font-bold text-[#111827]">
                Permit duplicate offers to the same Partner for the same requirement
              </span>
              <input
                type="checkbox"
                checked={dist.duplicateOffersPermitted}
                onChange={(e) =>
                  setDist({ ...dist, duplicateOffersPermitted: e.target.checked })
                }
                className="w-4 h-4 accent-[#111827]"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] cursor-pointer">
              <span className="font-bold text-[#111827]">
                Deduct Partner quota on expired offers (Recommended: Off)
              </span>
              <input
                type="checkbox"
                checked={dist.deductOnExpired}
                onChange={(e) => setDist({ ...dist, deductOnExpired: e.target.checked })}
                className="w-4 h-4 accent-[#111827]"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] cursor-pointer">
              <span className="font-bold text-[#111827]">
                Deduct Partner quota on declined offers (Recommended: Off)
              </span>
              <input
                type="checkbox"
                checked={dist.deductOnDeclined}
                onChange={(e) => setDist({ ...dist, deductOnDeclined: e.target.checked })}
                className="w-4 h-4 accent-[#111827]"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold shadow-xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
