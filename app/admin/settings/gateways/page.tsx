'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  MessageCircle,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  AiAgentCredentials,
  AiProviderType,
  MetaWhatsAppCredentials,
  PayPalCredentials,
  RazorpayCredentials,
} from '@/lib/types/domain';

type GatewayTab = 'whatsapp' | 'razorpay' | 'paypal' | 'ai';

interface MaskedGatewaysData {
  whatsapp: MetaWhatsAppCredentials & { maskedAccessToken: string; maskedAppSecret: string };
  razorpay: RazorpayCredentials & { maskedKeySecret: string; maskedWebhookSecret: string };
  paypal: PayPalCredentials & { maskedClientSecret: string };
  ai: AiAgentCredentials & { maskedGeminiApiKey: string; maskedOpenaiApiKey: string };
}

export default function AdminGatewaysControlPage() {
  const [activeTab, setActiveTab] = useState<GatewayTab>('whatsapp');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [wa, setWa] = useState<Partial<MetaWhatsAppCredentials>>({
    graphVersion: 'v21.0',
    wabaId: '',
    phoneNumberId: '',
    displayPhoneNumber: '',
    accessToken: '',
    appSecret: '',
    verifyToken: 'xpo_meta_verify_token',
  });
  const [rzp, setRzp] = useState<Partial<RazorpayCredentials>>({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    partnerPlanId: '',
    clientPlanId: '',
  });
  const [pp, setPp] = useState<Partial<PayPalCredentials>>({
    clientId: '',
    clientSecret: '',
    webhookId: '',
    partnerPlanId: '',
    clientPlanId: '',
    apiBaseUrl: 'https://api-m.paypal.com',
  });
  const [ai, setAi] = useState<Partial<AiAgentCredentials>>({
    provider: 'deterministic',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
  });

  const [rawMasked, setRawMasked] = useState<MaskedGatewaysData | null>(null);
  const [webhookUrls, setWebhookUrls] = useState({
    whatsapp: '',
    razorpay: '',
    paypal: '',
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/gateways');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load gateway credentials');

      const c: MaskedGatewaysData = data.credentials;
      setRawMasked(c);
      setWebhookUrls(data.webhookUrls || {});

      setWa({
        graphVersion: c.whatsapp.graphVersion || 'v21.0',
        wabaId: c.whatsapp.wabaId || '',
        phoneNumberId: c.whatsapp.phoneNumberId || '',
        displayPhoneNumber: c.whatsapp.displayPhoneNumber || '',
        accessToken: '',
        appSecret: '',
        verifyToken: c.whatsapp.verifyToken || 'xpo_meta_verify_token',
      });

      setRzp({
        keyId: c.razorpay.keyId || '',
        keySecret: '',
        webhookSecret: '',
        partnerPlanId: c.razorpay.partnerPlanId || '',
        clientPlanId: c.razorpay.clientPlanId || '',
      });

      setPp({
        clientId: c.paypal.clientId || '',
        clientSecret: '',
        webhookId: c.paypal.webhookId || '',
        partnerPlanId: c.paypal.partnerPlanId || '',
        clientPlanId: c.paypal.clientPlanId || '',
        apiBaseUrl: c.paypal.apiBaseUrl || 'https://api-m.paypal.com',
      });

      setAi({
        provider: c.ai?.provider || 'deterministic',
        geminiApiKey: '',
        geminiModel: c.ai?.geminiModel || 'gemini-2.5-flash',
        openaiApiKey: '',
        openaiModel: c.ai?.openaiModel || 'gpt-4o-mini',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      setTestResult(null);

      const payload: Record<string, unknown> = {};
      if (activeTab === 'whatsapp') {
        payload.whatsapp = {
          ...wa,
          accessToken: wa.accessToken ? wa.accessToken.trim() : undefined,
          appSecret: wa.appSecret ? wa.appSecret.trim() : undefined,
        };
      } else if (activeTab === 'razorpay') {
        payload.razorpay = {
          ...rzp,
          keySecret: rzp.keySecret ? rzp.keySecret.trim() : undefined,
          webhookSecret: rzp.webhookSecret ? rzp.webhookSecret.trim() : undefined,
        };
      } else if (activeTab === 'paypal') {
        payload.paypal = {
          ...pp,
          clientSecret: pp.clientSecret ? pp.clientSecret.trim() : undefined,
        };
      } else if (activeTab === 'ai') {
        payload.ai = {
          provider: ai.provider,
          geminiModel: ai.geminiModel,
          openaiModel: ai.openaiModel,
          geminiApiKey: ai.geminiApiKey ? ai.geminiApiKey.trim() : undefined,
          openaiApiKey: ai.openaiApiKey ? ai.openaiApiKey.trim() : undefined,
        };
      }

      const res = await fetch('/api/admin/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save gateway credentials');

      await load();
      setMessage('Credentials saved securely to Cloud Firestore and audit logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);
      const res = await fetch('/api/admin/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', gateway: activeTab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test request failed');
      setTestResult(data);
      await load();
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Gateway test failed',
      });
    } finally {
      setTesting(false);
    }
  }

  const activeMeta =
    activeTab === 'whatsapp'
      ? rawMasked?.whatsapp
      : activeTab === 'razorpay'
        ? rawMasked?.razorpay
        : activeTab === 'paypal'
          ? rawMasked?.paypal
          : rawMasked?.ai;

  const activeTestStatus = activeMeta?.testStatus;
  const activeLastTestedAt = activeMeta?.lastTestedAt;
  const activeTestMsg = activeMeta?.testMessage;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-[#E8192C] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Settings
          </Link>
          <h1 className="text-2xl font-extrabold text-[#111827] flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-[#E8192C]" />
            Gateways, Webhooks & AI Agent Keys
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure Meta WhatsApp Cloud API, Razorpay (INR Client & Partner Plans), PayPal (USD
            Client & Partner Plans), and your AI Agent provider.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold text-[#374151] hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3 text-xs">
        {[
          {
            id: 'whatsapp' as const,
            label: 'Meta WhatsApp v21.0',
            icon: MessageCircle,
            ready: Boolean(rawMasked?.whatsapp.phoneNumberId),
          },
          {
            id: 'razorpay' as const,
            label: 'Razorpay (INR Plans)',
            icon: CreditCard,
            ready: Boolean(rawMasked?.razorpay.keyId),
          },
          {
            id: 'paypal' as const,
            label: 'PayPal (USD Plans)',
            icon: Globe,
            ready: Boolean(rawMasked?.paypal.clientId),
          },
          {
            id: 'ai' as const,
            label: 'AI Agent (Gemini / OpenAI)',
            icon: Bot,
            ready: true,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setTestResult(null);
                setMessage(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
                isActive
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.ready && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading credentials...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] ${
                  activeTestStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeTestStatus === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activeTestStatus === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : activeTestStatus === 'failed' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                {activeTestStatus === 'success'
                  ? 'Connected & Verified'
                  : activeTestStatus === 'failed'
                    ? 'Connection Test Failed'
                    : 'Untested / Pending Verification'}
              </span>
              {activeLastTestedAt && (
                <span className="text-[11px] text-[#6B7280]">
                  Last verified: {new Date(activeLastTestedAt).toLocaleString()}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={testing || saving}
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] text-[#111827] font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-[#E8192C]" />
              )}
              {testing ? 'Testing Connection...' : 'Test Live Connection'}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <div>
                <strong>
                  {testResult.success ? 'Connection Succeeded:' : 'Connection Failed:'}
                </strong>{' '}
                {testResult.message}
              </div>
            </div>
          )}

          {!testResult && activeTestMsg && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-[#E5E7EB] text-xs text-[#4B5563]">
              <strong>Last Test Result:</strong> {activeTestMsg}
            </div>
          )}

          {/* Webhook Endpoint Callout (for WhatsApp / Razorpay / PayPal) */}
          {activeTab !== 'ai' && (
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111827]">
                  {activeTab === 'whatsapp'
                    ? 'Meta Webhook Callback URL'
                    : activeTab === 'razorpay'
                      ? 'Razorpay Webhook Endpoint URL'
                      : 'PayPal Webhook URL'}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrls[activeTab], `wh_${activeTab}`)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#D1D5DB] text-[#111827] font-bold text-[11px] hover:bg-gray-50"
                >
                  {copiedKey === `wh_${activeTab}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy URL
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[#111827] break-all bg-white p-2 rounded-lg border border-[#E5E7EB]">
                {webhookUrls[activeTab]}
              </div>
            </div>
          )}

          {/* Forms */}
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 text-xs"
          >
            {activeTab === 'whatsapp' && (
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-[#111827]">
                  Meta WhatsApp Business Cloud API v21.0
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Graph API Version
                    </label>
                    <input
                      type="text"
                      required
                      value={wa.graphVersion || 'v21.0'}
                      onChange={(e) => setWa({ ...wa, graphVersion: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      WhatsApp Business Account ID (WABA ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={wa.wabaId || ''}
                      onChange={(e) => setWa({ ...wa, wabaId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Meta Phone Number ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={wa.phoneNumberId || ''}
                      onChange={(e) => setWa({ ...wa, phoneNumberId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Display Business Number
                    </label>
                    <input
                      type="text"
                      value={wa.displayPhoneNumber || ''}
                      onChange={(e) => setWa({ ...wa, displayPhoneNumber: e.target.value })}
                      placeholder="+91 80000 00000"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">
                        System User Access Token *
                      </label>
                      {rawMasked?.whatsapp.maskedAccessToken && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.whatsapp.maskedAccessToken}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets['wa_token'] ? 'text' : 'password'}
                        value={wa.accessToken || ''}
                        onChange={(e) => setWa({ ...wa, accessToken: e.target.value })}
                        placeholder={
                          rawMasked?.whatsapp.maskedAccessToken
                            ? 'Leave blank to keep stored token'
                            : 'EAAG...'
                        }
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('wa_token')}
                        className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151]"
                      >
                        {showSecrets['wa_token'] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">Meta App Secret *</label>
                      {rawMasked?.whatsapp.maskedAppSecret && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.whatsapp.maskedAppSecret}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets['wa_secret'] ? 'text' : 'password'}
                        value={wa.appSecret || ''}
                        onChange={(e) => setWa({ ...wa, appSecret: e.target.value })}
                        placeholder={
                          rawMasked?.whatsapp.maskedAppSecret
                            ? 'Leave blank to keep stored app secret'
                            : 'Enter Meta App Secret'
                        }
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('wa_secret')}
                        className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151]"
                      >
                        {showSecrets['wa_secret'] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Webhook Verify Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={wa.verifyToken || ''}
                      onChange={(e) => setWa({ ...wa, verifyToken: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'razorpay' && (
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-[#111827]">
                  Razorpay Subscriptions AutoPay (INR Client & Partner Plans)
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Razorpay Key ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={rzp.keyId || ''}
                      onChange={(e) => setRzp({ ...rzp, keyId: e.target.value })}
                      placeholder="rzp_live_..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">Key Secret *</label>
                      {rawMasked?.razorpay.maskedKeySecret && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.razorpay.maskedKeySecret}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets['rzp_sec'] ? 'text' : 'password'}
                        value={rzp.keySecret || ''}
                        onChange={(e) => setRzp({ ...rzp, keySecret: e.target.value })}
                        placeholder={
                          rawMasked?.razorpay.maskedKeySecret
                            ? 'Leave blank to keep stored secret'
                            : 'Enter Razorpay Key Secret'
                        }
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('rzp_sec')}
                        className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#374151]"
                      >
                        {showSecrets['rzp_sec'] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">Webhook Secret *</label>
                      {rawMasked?.razorpay.maskedWebhookSecret && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.razorpay.maskedWebhookSecret}
                        </span>
                      )}
                    </div>
                    <input
                      type={showSecrets['rzp_wh'] ? 'text' : 'password'}
                      value={rzp.webhookSecret || ''}
                      onChange={(e) => setRzp({ ...rzp, webhookSecret: e.target.value })}
                      placeholder={
                        rawMasked?.razorpay.maskedWebhookSecret
                          ? 'Leave blank to keep stored secret'
                          : 'Secret configured in Razorpay Webhooks'
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1 text-[#374151]">
                        Partner Monthly Plan ID (RAZORPAY_PARTNER_PLAN_ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rzp.partnerPlanId || ''}
                        onChange={(e) => setRzp({ ...rzp, partnerPlanId: e.target.value })}
                        placeholder="plan_PartnerXXXX"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-[#374151]">
                        Client Monthly Plan ID (RAZORPAY_CLIENT_PLAN_ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rzp.clientPlanId || ''}
                        onChange={(e) => setRzp({ ...rzp, clientPlanId: e.target.value })}
                        placeholder="plan_ClientXXXX"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'paypal' && (
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-[#111827]">
                  PayPal Subscriptions AutoPay (USD Client & Partner Plans)
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      PayPal Client ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={pp.clientId || ''}
                      onChange={(e) => setPp({ ...pp, clientId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">Client Secret *</label>
                      {rawMasked?.paypal.maskedClientSecret && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.paypal.maskedClientSecret}
                        </span>
                      )}
                    </div>
                    <input
                      type={showSecrets['pp_sec'] ? 'text' : 'password'}
                      value={pp.clientSecret || ''}
                      onChange={(e) => setPp({ ...pp, clientSecret: e.target.value })}
                      placeholder={
                        rawMasked?.paypal.maskedClientSecret
                          ? 'Leave blank to keep stored secret'
                          : 'Enter PayPal Client Secret'
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      PayPal Webhook ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={pp.webhookId || ''}
                      onChange={(e) => setPp({ ...pp, webhookId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">API Base URL</label>
                    <select
                      value={pp.apiBaseUrl || 'https://api-m.paypal.com'}
                      onChange={(e) => setPp({ ...pp, apiBaseUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white font-mono"
                    >
                      <option value="https://api-m.paypal.com">
                        https://api-m.paypal.com (Live)
                      </option>
                      <option value="https://api-m.sandbox.paypal.com">
                        https://api-m.sandbox.paypal.com (Sandbox)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Partner USD Plan ID (PAYPAL_PARTNER_PLAN_ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pp.partnerPlanId || ''}
                      onChange={(e) => setPp({ ...pp, partnerPlanId: e.target.value })}
                      placeholder="P-PARTNERXXXX"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">
                      Client USD Plan ID (PAYPAL_CLIENT_PLAN_ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pp.clientPlanId || ''}
                      onChange={(e) => setPp({ ...pp, clientPlanId: e.target.value })}
                      placeholder="P-CLIENTXXXX"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-[#111827]">
                    XPO Hybrid AI Agent Engine (WhatsApp, Customer Workspaces & Admin Copilot)
                  </h2>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Powers natural-language requirement drafting, CRM-aware onboarding, Partner
                    profile setup, and Superadmin database queries. Automatically falls back to the
                    Deterministic Smart Agent if no external key is set.
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#374151]">
                    Active Agent Provider
                  </label>
                  <select
                    value={ai.provider || 'deterministic'}
                    onChange={(e) =>
                      setAi({ ...ai, provider: e.target.value as AiProviderType })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
                  >
                    <option value="gemini">Google Gemini (Recommended — Fast Structured JSON)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="deterministic">
                      Built-in Deterministic Smart Agent (No External API Key Needed)
                    </option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">Google Gemini API Key</label>
                      {rawMasked?.ai?.maskedGeminiApiKey && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.ai.maskedGeminiApiKey}
                        </span>
                      )}
                    </div>
                    <input
                      type={showSecrets['ai_gemini'] ? 'text' : 'password'}
                      value={ai.geminiApiKey || ''}
                      onChange={(e) => setAi({ ...ai, geminiApiKey: e.target.value })}
                      placeholder={
                        rawMasked?.ai?.maskedGeminiApiKey
                          ? 'Leave blank to keep stored Gemini key'
                          : 'AIzaSy...'
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">Gemini Model</label>
                    <input
                      type="text"
                      value={ai.geminiModel || 'gemini-2.5-flash'}
                      onChange={(e) => setAi({ ...ai, geminiModel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#374151]">OpenAI API Key</label>
                      {rawMasked?.ai?.maskedOpenaiApiKey && (
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          Stored: {rawMasked.ai.maskedOpenaiApiKey}
                        </span>
                      )}
                    </div>
                    <input
                      type={showSecrets['ai_openai'] ? 'text' : 'password'}
                      value={ai.openaiApiKey || ''}
                      onChange={(e) => setAi({ ...ai, openaiApiKey: e.target.value })}
                      placeholder={
                        rawMasked?.ai?.maskedOpenaiApiKey
                          ? 'Leave blank to keep stored OpenAI key'
                          : 'sk-...'
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#374151]">OpenAI Model</label>
                    <input
                      type="text"
                      value={ai.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) => setAi({ ...ai, openaiModel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Changes apply immediately across Web, WhatsApp, and Cloud Functions.
              </div>
              <button
                type="submit"
                disabled={saving || testing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white font-bold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
