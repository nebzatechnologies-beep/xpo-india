'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlugZap,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  KeyRound,
  Activity,
  FlaskConical,
  Save,
} from 'lucide-react';

export default function ConnectWhatsAppPage() {
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    mode: 'simulated' as 'simulated' | 'meta',
    wabaId: 'WABA_8819200192931',
    phoneNumberId: 'PNID_5528190021',
    displayNumber: '+91 98200 99881',
    accessToken: '',
    webhookVerifyToken: 'XPO_WHATSAPP_WEBHOOK_SECRET_KEY_2026',
    webhookSecret: '',
    webhookUrl: 'https://xpoindia.com/api/webhooks/whatsapp',
  });

  useEffect(() => {
    fetch('/api/whatsapp/connect')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setForm((prev) => ({
            ...prev,
            mode: res.data.mode || 'simulated',
            wabaId: res.data.wabaId || prev.wabaId,
            phoneNumberId: res.data.phoneNumberId || prev.phoneNumberId,
            displayNumber: res.data.displayPhoneNumber || prev.displayNumber,
            webhookVerifyToken: res.data.webhookVerifyToken || prev.webhookVerifyToken,
          }));
        }
      });
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', ...form }),
      });
      const data = await res.json();
      setTestResult(data);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncTemplates = async () => {
    setSyncing(true);
    const res = await fetch('/api/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    });
    const data = await res.json();
    if (data.success) {
      setSyncResult(data.message);
      setTimeout(() => setSyncResult(null), 3000);
    }
    setSyncing(false);
  };

  const isLiveMeta = form.mode === 'meta' && Boolean(form.accessToken);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">
          Connect WhatsApp Cloud API & Provider Mode
        </h1>
        <p className="text-xs text-[#717171] mt-0.5">
          Meta WhatsApp Business Account (WABA) configuration, idempotent webhook verification, and Simulated vs Live adapter switch.
        </p>
      </div>

      {/* Connection Status Card — Never misrepresents simulated mode as real Meta delivery */}
      <Card
        className={`p-6 rounded-2xl border flex items-center justify-between ${
          isLiveMeta ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/40'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center ${
              isLiveMeta ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            {isLiveMeta ? <Smartphone className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#222222]">{form.displayNumber}</span>
              <Badge variant={isLiveMeta ? 'success' : 'outline'} className="text-[10px]">
                {isLiveMeta ? 'LIVE META CLOUD API' : 'SIMULATED PROVIDER (SANDBOX)'}
              </Badge>
            </div>
            <div className="text-xs text-[#555555] mt-0.5">
              {isLiveMeta
                ? 'Meta Graph API v20.0 • Live Outbound & Webhook Verification Active'
                : 'Pre-Meta Sandbox Active • Simulated messages are explicitly tagged [SIMULATED] and never marked as real Meta-delivered'}
            </div>
          </div>
        </div>

        <Badge variant={isLiveMeta ? 'success' : 'outline'} className="text-xs font-bold px-3 py-1">
          <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" />
          {isLiveMeta ? 'LIVE META' : 'SIMULATED MODE'}
        </Badge>
      </Card>

      {/* Configuration Form */}
      <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
          <div className="font-bold text-sm text-[#222222] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#E8192C]" /> WhatsApp Provider & Meta Credentials
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#717171]">Adapter Mode:</span>
            <select
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as 'simulated' | 'meta' })}
              className="px-3 py-1 rounded-xl border border-[#EBEBEB] font-bold text-[#222222]"
            >
              <option value="simulated">Simulated Provider (Pre-Meta Testing)</option>
              <option value="meta">Live Meta WhatsApp Cloud API</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={form.wabaId}
                onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] font-mono outline-none focus:border-[#E8192C]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={form.phoneNumberId}
                onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] font-mono outline-none focus:border-[#E8192C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">
              Permanent System User Access Token (Leave blank for Simulated Mode)
            </label>
            <input
              type="password"
              placeholder="EAAG9... (Supply when connecting live Meta Business Account)"
              value={form.accessToken}
              onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] font-mono outline-none focus:border-[#E8192C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">
                Webhook Callback URL
              </label>
              <input
                type="text"
                disabled
                value={form.webhookUrl}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] bg-neutral-50 text-[#717171] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={form.webhookVerifyToken}
                onChange={(e) => setForm({ ...form, webhookVerifyToken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] font-mono outline-none focus:border-[#E8192C]"
              />
            </div>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{testResult.message}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono">
              {testResult.mode ? `Mode: ${testResult.mode.toUpperCase()}` : '200 OK'}
            </span>
          </div>
        )}

        {syncResult && (
          <div className="p-3 bg-blue-50 text-blue-800 text-xs font-semibold rounded-xl border border-blue-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {syncResult}
          </div>
        )}

        <div className="pt-4 border-t border-[#EBEBEB] flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncTemplates}
            isLoading={syncing}
            className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Synchronise Message Templates
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveConfig}
              isLoading={saving}
              className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleTestConnection}
              isLoading={testing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 px-4"
            >
              <PlugZap className="w-3.5 h-3.5" /> TEST ADAPTER HANDSHAKE
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
