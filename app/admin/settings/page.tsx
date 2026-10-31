'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Save, Settings, Shield } from 'lucide-react';
import type { PlatformSettingsBundle } from '@/lib/types/domain';

export default function AdminPlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettingsBundle | null>(null);
  const [keywordsText, setKeywordsText] = useState('');
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
      if (!res.ok) throw new Error(data.error || 'Failed to load platform settings');
      setSettings(data.settings);
      setKeywordsText((data.settings?.moderation?.blockedKeywords || []).join(', '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings');
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
      const blockedKeywords = keywordsText
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roles: settings.roles,
          moderation: {
            ...settings.moderation,
            blockedKeywords,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save platform settings');
      setSettings(data.settings);
      setMessage('Platform role availability & moderation rules saved and audit logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#111827]" />
            General Settings
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage Client & Partner availability, auto-moderation rules, and regional scope.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings/gateways"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-black shadow-xs"
          >
            Payment & API Keys <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/settings/matching"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-gray-700 border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-xs"
          >
            Matching & Dispatch <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
          <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading settings...
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6 text-xs"
        >
          {/* Role Enablement */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827]">
              Active Customer Roles (WhatsApp & Web)
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {(
                [
                  ['clientEnabled', 'Clients — Post Requirements & Connect'],
                  ['partnerEnabled', 'Partners — Receive Business Leads'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 cursor-pointer"
                >
                  <span className="font-bold text-[#111827]">{label}</span>
                  <input
                    type="checkbox"
                    checked={settings.roles[key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        roles: { ...settings.roles, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#111827]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Moderation & KYC Policy */}
          <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
            <h2 className="text-sm font-extrabold text-[#111827] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#111827]" />
              Moderation, KYC & Geography Scope
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] cursor-pointer">
                <span>
                  <strong className="block text-[#111827]">
                    Auto-Approve Clean Client Requirements
                  </strong>
                  <span className="text-[11px] text-[#6B7280]">
                    Immediately start 5-minute Partner matching if no blocked keywords trigger
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.moderation.autoApproveCleanRequirements}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      moderation: {
                        ...settings.moderation,
                        autoApproveCleanRequirements: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#111827]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] cursor-pointer">
                <span>
                  <strong className="block text-[#111827]">
                    Require Approved KYC Before Partner Claims
                  </strong>
                  <span className="text-[11px] text-[#6B7280]">
                    When off, phone-verified Partners can claim; KYC grants Verified Trust Badge
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.moderation.requirePartnerKycForClaims}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      moderation: {
                        ...settings.moderation,
                        requirePartnerKycForClaims: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#111827]"
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-[#374151] mb-1">
                  Launch Geography Scope
                </label>
                <select
                  value={settings.moderation.launchGeographyScope}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      moderation: {
                        ...settings.moderation,
                        launchGeographyScope: e.target.value as 'india_and_global' | 'india_only',
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
                >
                  <option value="india_and_global">
                    India-First + Global Expansion (INR Razorpay + USD PayPal)
                  </option>
                  <option value="india_only">India Domestic Only (+91 INR)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#374151] mb-1">
                  Auto-Hold Blocked Moderation Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="crypto, gambling, whatsapp group link, ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white font-bold text-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save General Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
