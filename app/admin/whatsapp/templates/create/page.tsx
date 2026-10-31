'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WhatsAppTemplateRecord } from '@/lib/types/domain';

export default function AdminCreateWhatsAppTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<WhatsAppTemplateRecord['category']>('UTILITY');
  const [purpose, setPurpose] = useState<WhatsAppTemplateRecord['purpose']>('opportunity_alert');
  const [bodyText, setBodyText] = useState('');
  const [variablesText, setVariablesText] = useState('name, xpo_code');
  const [metaStatus, setMetaStatus] = useState<WhatsAppTemplateRecord['metaStatus']>('APPROVED');
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          purpose,
          bodyText: bodyText.trim(),
          variables: variablesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          metaStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create template');
      }
      router.push('/admin/whatsapp/templates');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">Register Meta WhatsApp Template</h1>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs"
      >
        <div>
          <label className="block font-bold mb-1">Template Name (snake_case) *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="xpo_partner_offer_v2"
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-mono"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as WhatsAppTemplateRecord['category'])}
            className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
          >
            <option value="UTILITY">UTILITY</option>
            <option value="MARKETING">MARKETING</option>
            <option value="AUTHENTICATION">AUTHENTICATION</option>
          </select>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as WhatsAppTemplateRecord['purpose'])}
            className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
          >
            <option value="client_invitation">Client Invitation</option>
            <option value="partner_invitation">Partner Invitation</option>
            <option value="opportunity_alert">Opportunity Alert (5-Min)</option>
            <option value="connection_request">Connection Request</option>
            <option value="subscription_reminder">Subscription Reminder</option>
            <option value="registration">Registration / Onboarding</option>
            <option value="campaign_broadcast">Campaign Broadcast</option>
            <option value="support_notification">Support Notification</option>
            <option value="account_update">Account Update</option>
          </select>
          <select
            value={metaStatus}
            onChange={(e) => setMetaStatus(e.target.value as WhatsAppTemplateRecord['metaStatus'])}
            className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white"
          >
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
        <div>
          <label className="block font-bold mb-1">
            Template Body ({'{{1}}, {{2}}'} placeholders) *
          </label>
          <textarea
            rows={4}
            required
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Variable Labels (comma-separated)</label>
          <input
            type="text"
            value={variablesText}
            onChange={(e) => setVariablesText(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold shadow-xs transition"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </form>
    </div>
  );
}
