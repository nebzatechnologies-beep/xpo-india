'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  ContactSegment,
  WhatsAppCampaign,
  WhatsAppTemplateRecord,
} from '@/lib/types/domain';
import { Send, Loader2 } from 'lucide-react';

export default function AdminCampaignBroadcastsPage() {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateRecord[]>([]);

  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cRes, sRes, tRes] = await Promise.all([
      fetch('/api/admin/whatsapp/campaigns'),
      fetch('/api/crm/segments'),
      fetch('/api/admin/whatsapp/templates'),
    ]);
    if (cRes.ok) setCampaigns((await cRes.json()).campaigns || []);
    if (sRes.ok) {
      const segs: ContactSegment[] = (await sRes.json()).segments || [];
      setSegments(segs);
      if (segs.length && !segmentId) setSegmentId(segs[0].id);
    }
    if (tRes.ok) {
      const tpls: WhatsAppTemplateRecord[] = (
        (await tRes.json()).templates || []
      ).filter((t: WhatsAppTemplateRecord) => t.metaStatus === 'APPROVED');
      setTemplates(tpls);
      if (tpls.length && !templateId) setTemplateId(tpls[0].id);
    }
  }, [segmentId, templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setMsg(null);
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), segmentId, templateId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not create campaign');
      setName('');
      setMsg('Campaign draft staged with suppression check & cost estimate.');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setBusy(false);
    }
  }

  async function launchCampaign(campaignId: string) {
    try {
      setBusy(true);
      setMsg(null);
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch', campaignId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Launch failed');
      setMsg('Campaign approved & dispatched via Cloud Tasks / Meta Cloud API!');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Launch failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Approved WhatsApp Template Broadcast Engine
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Strictly enforces Meta APPROVED templates, active opt-in consent, and automatic
          suppression list exclusion.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          {msg}
        </div>
      )}

      <form
        onSubmit={createDraft}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
      >
        <input
          type="text"
          required
          placeholder="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-[#D1D5DB]"
        />
        <select
          required
          value={segmentId}
          onChange={(e) => setSegmentId(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white"
        >
          <option value="">Select CRM Segment</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.estimatedCount})
            </option>
          ))}
        </select>
        <select
          required
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white"
        >
          <option value="">Select APPROVED Template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold shadow-xs transition disabled:opacity-50"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{busy ? 'Creating...' : 'Create Campaign'}</span>
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3 text-xs">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="font-bold text-sm text-[#111827]">{c.name}</div>
              <div className="text-[#6B7280] mt-0.5">
                Segment: {c.segmentName} • Template: <span className="font-mono">{c.templateName}</span>{' '}
                • Eligible: <strong>{c.eligibleRecipientCount}</strong> (Suppressed skipped:{' '}
                {c.suppressedSkippedCount}) • Est. ₹{c.estimatedCostInr}
              </div>
              <div className="text-[11px] text-[#374151] mt-1">
                Status: <strong className="uppercase">{c.status}</strong> • Sent: {c.sentCount} •
                Delivered: {c.deliveredCount} • Replied: {c.repliedCount}
              </div>
            </div>

            {c.status === 'draft' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void launchCampaign(c.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold shrink-0 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{busy ? 'Dispatching...' : 'Approve & Dispatch'}</span>
              </button>
            )}
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-[#6B7280]">No WhatsApp broadcast campaigns staged yet.</p>
        )}
      </div>
    </div>
  );
}
