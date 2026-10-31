'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, KeyRound, Save } from 'lucide-react';

export default function AdminWhatsAppConnectPage() {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('');
  const [verifyToken, setVerifyToken] = useState('xpo_meta_verify_token');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [maskedAccess, setMaskedAccess] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('/api/webhooks/whatsapp');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/whatsapp/config');
      if (res.ok) {
        const d = await res.json();
        const c = d.config;
        if (c) {
          setPhoneNumberId(c.phoneNumberId || '');
          setBusinessAccountId(c.businessAccountId || '');
          setDisplayPhoneNumber(c.displayPhoneNumber || '');
          setVerifyToken(c.verifyToken || 'xpo_meta_verify_token');
          setMaskedAccess(c.maskedAccessToken || '');
          if (c.webhookCallbackUrl) setWebhookUrl(c.webhookCallbackUrl);
        }
      }
    }
    void load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);
      const res = await fetch('/api/admin/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId,
          businessAccountId,
          displayPhoneNumber,
          verifyToken,
          accessToken: accessToken || undefined,
          appSecret: appSecret || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save Meta WABA config');
      setAccessToken('');
      setAppSecret('');
      setMsg('Official Meta WhatsApp Business Cloud API v21.0 configuration saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Official Meta WhatsApp Business Cloud API Configuration
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Configure your WABA Phone Number ID, Business Account ID, System User Access Token, and
          HMAC-SHA256 App Secret (`X-Hub-Signature-256`).
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#111827]" />
          <span className="font-semibold text-gray-900">
            Unified API Gateways available: Manage Meta WhatsApp, Razorpay, and PayPal credentials with live connection testing.
          </span>
        </div>
        <Link
          href="/admin/settings/gateways"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold shadow-xs"
        >
          Open Gateways Hub <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
        <div className="font-bold text-gray-900">Meta Webhook Callback URL</div>
        <div className="font-mono text-gray-700">{webhookUrl}</div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">Meta Phone Number ID *</label>
            <input
              type="text"
              required
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="109283746501928"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] font-mono"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">WhatsApp Business Account ID (WABA) *</label>
            <input
              type="text"
              required
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="203948576102938"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">Display Business WhatsApp Number</label>
            <input
              type="text"
              value={displayPhoneNumber}
              onChange={(e) => setDisplayPhoneNumber(e.target.value)}
              placeholder="+91 80000 00000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB]"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Webhook Verify Token *</label>
            <input
              type="text"
              required
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1">
            Permanent System User Access Token {maskedAccess ? `(Stored: ${maskedAccess})` : ''}
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="EAAG... (Leave blank to keep stored token)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold mb-1">
            Meta App Secret (HMAC-SHA256 Webhook Verification)
          </label>
          <input
            type="password"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            placeholder="Leave blank to keep stored secret"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold shadow-xs transition"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
