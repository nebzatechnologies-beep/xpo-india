'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Workflow,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Key,
  Globe,
  Radio,
  SlidersHorizontal,
  FileCode2,
  Trash2,
  ArrowLeft,
  Zap,
  ExternalLink,
} from 'lucide-react';

export default function N8nIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'header' | 'basic' | 'bearer'>('header');
  const [authHeaderName, setAuthHeaderName] = useState('X-N8N-API-KEY');
  const [authHeaderValue, setAuthHeaderValue] = useState('');
  const [basicUsername, setBasicUsername] = useState('');
  const [basicPassword, setBasicPassword] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [inboundApiKey, setInboundApiKey] = useState('');
  const [subscribedEvents, setSubscribedEvents] = useState<string[]>([
    'lead.created',
    'interest.created',
    'connection.requested',
    'connection.accepted',
    'payment.captured',
    'subscription.activated',
  ]);

  // Status & logs
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'untested'>('untested');
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalEventsEmitted: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageLatencyMs: 0,
  });

  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'docs'>('settings');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations/n8n');
      const data = await res.json();
      if (data.success && data.config) {
        const c = data.config;
        setEnabled(Boolean(c.enabled));
        setWebhookUrl(c.webhookUrl || '');
        setAuthType(c.authType || 'header');
        setAuthHeaderName(c.authHeaderName || 'X-N8N-API-KEY');
        setAuthHeaderValue(c.authHeaderValueMasked || c.authHeaderValue || '');
        setBasicUsername(c.basicUsername || '');
        setBasicPassword(c.basicPasswordMasked || c.basicPassword || '');
        setBearerToken(c.bearerTokenMasked || c.bearerToken || '');
        setSigningSecret(c.signingSecretMasked || c.signingSecret || '');
        setInboundApiKey(c.inboundApiKeyMasked || c.inboundApiKey || '');
        if (Array.isArray(c.subscribedEvents)) {
          setSubscribedEvents(c.subscribedEvents);
        }
        setStatus(c.status || 'disconnected');
        setLastTestedAt(c.lastTestedAt || null);
        setLastTestResult(c.lastTestResult || null);
      }
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.recentLogs)) setLogs(data.recentLogs);
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load n8n configuration' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (overrideEnabled?: boolean) => {
    try {
      setSaving(true);
      setNotice(null);

      const targetEnabled = overrideEnabled !== undefined ? overrideEnabled : enabled;

      const payload = {
        enabled: targetEnabled,
        webhookUrl,
        authType,
        authHeaderName,
        authHeaderValue: authHeaderValue.includes('••••') ? undefined : authHeaderValue,
        basicUsername,
        basicPassword: basicPassword.includes('••••') ? undefined : basicPassword,
        bearerToken: bearerToken.includes('••••') ? undefined : bearerToken,
        subscribedEvents,
      };

      const res = await fetch('/api/admin/integrations/n8n', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setEnabled(targetEnabled);
        setNotice({
          type: 'success',
          message: targetEnabled
            ? 'Hostinger n8n Integration saved & enabled successfully!'
            : 'Hostinger n8n Integration saved (disabled).',
        });
        await fetchConfig();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setNotice(null);

      const payload = {
        webhookUrl,
        authType,
        authHeaderName,
        authHeaderValue: authHeaderValue.includes('••••') ? undefined : authHeaderValue,
        basicUsername,
        basicPassword: basicPassword.includes('••••') ? undefined : basicPassword,
        bearerToken: bearerToken.includes('••••') ? undefined : bearerToken,
      };

      const res = await fetch('/api/admin/integrations/n8n/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('connected');
        setNotice({
          type: 'success',
          message: `Connected to Hostinger n8n successfully! Latency: ${data.result?.latencyMs || 0}ms`,
        });
      } else {
        setStatus('disconnected');
        setNotice({
          type: 'error',
          message: `Test failed: ${data.result?.message || 'Could not reach Hostinger n8n Webhook URL'}`,
        });
      }
      await fetchConfig();
    } catch (err: any) {
      setStatus('disconnected');
      setNotice({ type: 'error', message: err.message || 'Connection test error' });
    } finally {
      setTesting(false);
    }
  };

  const handleRotateKey = async (target: 'signingSecret' | 'inboundApiKey') => {
    try {
      const res = await fetch('/api/admin/integrations/n8n/rotate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (data.success && data.newKey) {
        if (target === 'signingSecret') setSigningSecret(data.newKey);
        if (target === 'inboundApiKey') setInboundApiKey(data.newKey);
        setNotice({ type: 'success', message: `${data.message}: ${data.newKey}` });
        copyToClipboard(data.newKey, target);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to regenerate key' });
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/admin/integrations/n8n/events', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        setNotice({ type: 'success', message: 'Event logs cleared' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to clear logs' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleEvent = (event: string) => {
    setSubscribedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header breadcrumb & title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#717171] mb-1">
          <Link href="/admin/settings" className="hover:text-[#222222] transition-colors">
            Settings
          </Link>
          <span>/</span>
          <Link href="/admin/settings/integrations" className="hover:text-[#222222] transition-colors">
            Integrations
          </Link>
          <span>/</span>
          <span className="text-[#E8192C]">n8n Automation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#222222] tracking-tight flex items-center gap-3">
              <Workflow className="w-7 h-7 text-[#E8192C]" />
              Hostinger n8n Automation Bridge
            </h1>
            <p className="text-xs text-[#717171] mt-0.5">
              Firebase remains the main database; Hostinger n8n handles silent background workflows (WhatsApp, Emails, Reminders, Reports).
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-[#EBEBEB] shadow-sm">
            <span className="text-xs font-bold text-[#222222]">Integration Status:</span>
            <button
              onClick={() => {
                const nextState = !enabled;
                setEnabled(nextState);
                handleSave(nextState);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${enabled ? 'text-emerald-700' : 'text-gray-500'}`}>
              {enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs text-gray-500 hover:text-black font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Status & Connection Test Bar */}
      <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F2F2]">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl flex items-center justify-center ${
                status === 'connected'
                  ? 'bg-emerald-50 text-emerald-600'
                  : status === 'disconnected'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#222222]">Hostinger n8n Server Status:</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                    status === 'connected'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : status === 'disconnected'
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-amber-300 bg-amber-50 text-amber-700'
                  }`}
                >
                  {status}
                </Badge>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">
                {lastTestedAt
                  ? `Last connection test: ${new Date(lastTestedAt).toLocaleString()}`
                  : 'Not tested yet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleTestConnection}
              isLoading={testing}
              className="rounded-2xl border-[#EBEBEB] text-xs font-semibold gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Connect / Test Connection
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSave()}
              isLoading={saving}
              className="rounded-2xl text-xs font-semibold px-6 shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[11px] font-medium text-[#717171]">Total Events Emitted</p>
            <p className="text-lg font-black text-[#222222] mt-0.5">{stats.totalEventsEmitted || 0}</p>
          </div>
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <p className="text-[11px] font-medium text-emerald-800">Successful Deliveries</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{stats.successfulDeliveries || 0}</p>
          </div>
          <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100">
            <p className="text-[11px] font-medium text-rose-800">Failed Deliveries</p>
            <p className="text-lg font-black text-rose-700 mt-0.5">{stats.failedDeliveries || 0}</p>
          </div>
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            <p className="text-[11px] font-medium text-blue-800">Avg Latency</p>
            <p className="text-lg font-black text-blue-700 mt-0.5">{stats.averageLatencyMs || 0} ms</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[#EBEBEB] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-[#E8192C] text-[#E8192C]'
              : 'border-transparent text-[#717171] hover:text-[#222222]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Connection & Security Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-[#E8192C] text-[#E8192C]'
              : 'border-transparent text-[#717171] hover:text-[#222222]'
          }`}
        >
          <Radio className="w-4 h-4" /> Delivery Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'docs'
              ? 'border-[#E8192C] text-[#E8192C]'
              : 'border-transparent text-[#717171] hover:text-[#222222]'
          }`}
        >
          <FileCode2 className="w-4 h-4" /> n8n Workflow Guide & Inbound API
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Outbound Webhook Configuration */}
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
            <h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#E8192C]" /> Outbound Webhook Settings (XPO → Hostinger n8n)
            </h3>
            <p className="text-xs text-[#717171]">
              Whenever events occur on XPO, Firebase records the data first and XPO asynchronously sends the signed event payload to your Hostinger n8n Webhook URL.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#222222] block mb-1">
                  Hostinger n8n Webhook URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.your-hostinger-domain.com/webhook/xpo-events"
                  className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                />
                <p className="text-[11px] text-[#717171] mt-1">
                  Copy the Webhook URL from your Hostinger n8n workflow Webhook trigger node.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#222222] block mb-1">Authentication Method</label>
                  <select
                    value={authType}
                    onChange={(e: any) => setAuthType(e.target.value)}
                    className="w-full rounded-xl border border-[#EBEBEB] p-2.5 text-xs bg-white focus:outline-none focus:border-[#222222]"
                  >
                    <option value="header">Custom Header (API Key)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth (Username & Password)</option>
                    <option value="none">No Credentials (Header Only Signature)</option>
                  </select>
                </div>

                {authType === 'header' && (
                  <div>
                    <label className="text-xs font-bold text-[#222222] block mb-1">Header Name</label>
                    <Input
                      value={authHeaderName}
                      onChange={(e) => setAuthHeaderName(e.target.value)}
                      placeholder="X-N8N-API-KEY"
                      className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {authType === 'header' && (
                <div>
                  <label className="text-xs font-bold text-[#222222] block mb-1">Header Value / Secret Key</label>
                  <Input
                    type="password"
                    value={authHeaderValue}
                    onChange={(e) => setAuthHeaderValue(e.target.value)}
                    placeholder="Enter auth header value for Hostinger n8n"
                    className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                  />
                </div>
              )}

              {authType === 'bearer' && (
                <div>
                  <label className="text-xs font-bold text-[#222222] block mb-1">Bearer Token</label>
                  <Input
                    type="password"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                  />
                </div>
              )}

              {authType === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#222222] block mb-1">Basic Username</label>
                    <Input
                      value={basicUsername}
                      onChange={(e) => setBasicUsername(e.target.value)}
                      className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#222222] block mb-1">Basic Password</label>
                    <Input
                      type="password"
                      value={basicPassword}
                      onChange={(e) => setBasicPassword(e.target.value)}
                      className="rounded-xl border-[#EBEBEB] text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Subscribed Events Selection */}
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
            <h3 className="text-base font-bold text-[#222222]">Automated Business Events Triggered to n8n</h3>
            <p className="text-xs text-[#717171]">
              Select which platform actions will automatically trigger outbound events to Hostinger n8n.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  event: 'lead.created',
                  label: 'Client Posts a Requirement (lead.created)',
                  desc: 'Fires when a Client submits a requirement. n8n fetches audience & sends WhatsApp/Email alerts to Partners.',
                },
                {
                  event: 'interest.created',
                  label: 'Partner Clicks "I\'m Interested" (interest.created)',
                  desc: 'Fires when a Partner expresses interest in a lead. n8n notifies the Client.',
                },
                {
                  event: 'connection.requested',
                  label: 'Client Sends Connection Request (connection.requested)',
                  desc: 'Fires when Client invites Partner. n8n sends connection notification to Partner.',
                },
                {
                  event: 'connection.accepted',
                  label: 'Partner Accepts Connection (connection.accepted)',
                  desc: 'Fires when Partner accepts. XPO creates connection & n8n sends confirmation to both parties.',
                },
                {
                  event: 'payment.captured',
                  label: 'Payment Verified & Captured (payment.captured)',
                  desc: 'Fires when Razorpay/PayPal payment is verified in XPO.',
                },
                {
                  event: 'subscription.activated',
                  label: 'Subscription Plan Activated (subscription.activated)',
                  desc: 'Fires when ₹999 or $49 subscription is activated. n8n sends subscription receipt & welcome package.',
                },
                {
                  event: 'lead.status_changed',
                  label: 'Superadmin Moderates Lead (lead.status_changed)',
                  desc: 'Fires when Superadmin approves, rejects, or updates a lead status.',
                },
              ].map((item) => (
                <div
                  key={item.event}
                  onClick={() => toggleEvent(item.event)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    subscribedEvents.includes(item.event)
                      ? 'border-[#E8192C] bg-rose-50/40'
                      : 'border-[#EBEBEB] bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#222222]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={subscribedEvents.includes(item.event)}
                      onChange={() => {}}
                      className="rounded text-[#E8192C] focus:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-[#717171] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Security & Inbound Machine API Credentials */}
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
            <h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#E8192C]" /> Security & Inbound API Bridge Credentials
            </h3>
            <p className="text-xs text-[#717171]">
              Use HMAC signing to verify outbound XPO webhooks in n8n, and use the Machine API Key for Hostinger n8n to safely access XPO data endpoints.
            </p>

            <div className="space-y-4 pt-2">
              {/* HMAC Signing Secret */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#E8192C]" /> Outbound Webhook HMAC Signing Secret
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRotateKey('signingSecret')}
                    className="text-[11px] text-[#E8192C] font-semibold h-7 px-2"
                  >
                    Regenerate Secret
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={signingSecret}
                    className="rounded-xl border-[#EBEBEB] text-xs font-mono bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(signingSecret, 'signingSecret')}
                    className="rounded-xl border-[#EBEBEB] shrink-0 h-10 px-3"
                  >
                    {copiedKey === 'signingSecret' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-[#717171]">
                  XPO signs every webhook request with header <code className="font-mono bg-gray-200 px-1 rounded text-black">X-XPO-Signature: sha256=...</code>
                </p>
              </div>

              {/* Inbound API Key for n8n */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-emerald-600" /> Inbound Machine API Key (for Hostinger n8n)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRotateKey('inboundApiKey')}
                    className="text-[11px] text-[#E8192C] font-semibold h-7 px-2"
                  >
                    Regenerate API Key
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inboundApiKey}
                    className="rounded-xl border-[#EBEBEB] text-xs font-mono bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inboundApiKey, 'inboundApiKey')}
                    className="rounded-xl border-[#EBEBEB] shrink-0 h-10 px-3"
                  >
                    {copiedKey === 'inboundApiKey' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-[#717171]">
                  Hostinger n8n must pass header <code className="font-mono bg-gray-200 px-1 rounded text-black">X-XPO-Api-Key: {inboundApiKey.substring(0, 12)}...</code> when querying XPO inbound read APIs.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: LOGS */}
      {activeTab === 'logs' && (
        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#222222]">Event Delivery History Log</h3>
              <p className="text-xs text-[#717171]">Real-time record of outbound event dispatches from XPO to Hostinger n8n.</p>
            </div>
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="rounded-xl text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </Button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Radio className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#222222]">No event delivery logs recorded yet</p>
              <p className="text-[11px] text-[#717171] mt-0.5">
                Click "Connect / Test Connection" above or trigger a platform event to record execution logs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[#717171] font-semibold bg-gray-50/50">
                    <th className="p-3 rounded-l-xl">Status</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Delivery ID</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Attempts</th>
                    <th className="p-3">Occurred At</th>
                    <th className="p-3 rounded-r-xl">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            log.status === 'success'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-rose-300 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {log.status === 'success' ? '200 OK' : 'FAILED'}
                        </Badge>
                      </td>
                      <td className="p-3 font-bold text-[#222222] font-sans">{log.event}</td>
                      <td className="p-3 text-gray-500 text-[11px]">{log.eventId}</td>
                      <td className="p-3 text-gray-700">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
                      <td className="p-3 text-gray-700">{log.attempts || 1}</td>
                      <td className="p-3 text-gray-500 font-sans text-[11px]">
                        {new Date(log.occurredAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-sans text-[11px] text-gray-600 max-w-xs truncate">
                        {log.error || log.payloadSummary || 'Event delivered'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: DOCS & API REFERENCE */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
            <h3 className="text-base font-bold text-[#222222]">Hostinger n8n Outbound Payload & HMAC Verification</h3>
            <p className="text-xs text-[#717171]">
              XPO dispatches signed JSON envelopes to your Hostinger n8n Webhook node. Example payload:
            </p>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto">
{`{
  "id": "evt_1728231000_a1b2c3",
  "event": "lead.created",
  "version": "1.0",
  "occurredAt": "${new Date().toISOString()}",
  "source": "xpo-india",
  "environment": "production",
  "data": {
    "leadId": "lead_1001",
    "xpoId": "XPO-84920",
    "title": "Need 5000 Metres High-Grade Aluminium Alloy Sheets",
    "category": { "code": "cat_metal", "name": "Aluminium Fabrication" },
    "country": "India",
    "budgetOpenForDiscussion": true,
    "creator": {
      "name": "Rajesh Sharma",
      "company": "Client Enterprise Ltd",
      "email": "creator@xpoindia.com",
      "phone": "+91 9820011223"
    }
  }
}`}
            </pre>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-[#222222] mb-1">Verifying HMAC Signature in n8n (Code Node):</h4>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto">
{`const crypto = require('crypto');
const secret = '${signingSecret || 'YOUR_SIGNING_SECRET'}';

const rawBody = JSON.stringify($json.body);
const headerSignature = $request.headers['x-xpo-signature']; // "sha256=..."

const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

if (headerSignature === expectedSignature) {
  return [{ json: { verified: true, event: $json.body.event, data: $json.body.data } }];
} else {
  throw new Error('Invalid HMAC Signature from XPO');
}`}
              </pre>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white space-y-4">
            <h3 className="text-base font-bold text-[#222222]">Secure Inbound XPO Read APIs for Hostinger n8n</h3>
            <p className="text-xs text-[#717171]">
              Hostinger n8n can query these scoped endpoints to retrieve required platform data for automated notifications & reports.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  method: 'GET',
                  endpoint: '/api/integrations/n8n/audience',
                  desc: 'Fetch target Partner audience with contacts for a new lead or category. Query params: ?leadId=... &categoryCode=... &country=...',
                },
                {
                  method: 'GET',
                  endpoint: '/api/integrations/n8n/leads',
                  desc: 'Query live, unanswered, or expiring leads. Query params: ?status=live &inactiveDays=3 &createdSince=...',
                },
                {
                  method: 'GET',
                  endpoint: '/api/integrations/n8n/subscriptions/expiring',
                  desc: 'Query subscription plans expiring within N days for expiry reminders. Query params: ?days=7',
                },
                {
                  method: 'GET',
                  endpoint: '/api/integrations/n8n/summary/daily',
                  desc: 'Fetch 24-hour XPO platform metrics & revenue for automated daily Superadmin WhatsApp/Email report.',
                },
                {
                  method: 'POST',
                  endpoint: '/api/integrations/n8n/callback',
                  desc: 'Send execution status or WhatsApp delivery confirmation back to XPO.',
                },
              ].map((api, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-900 text-white font-mono text-[10px]">
                      {api.method}
                    </Badge>
                    <code className="text-xs font-mono font-bold text-[#222222]">{api.endpoint}</code>
                  </div>
                  <p className="text-[11px] text-[#717171] mt-1">{api.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
