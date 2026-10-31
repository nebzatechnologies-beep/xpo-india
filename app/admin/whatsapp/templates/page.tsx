'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { WhatsAppTemplateRecord } from '@/lib/types/domain';
import { RefreshCw, Plus } from 'lucide-react';

export default function AdminWhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplateRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/whatsapp/templates');
    if (res.ok) {
      const d = await res.json();
      setTemplates(d.templates || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncMeta() {
    try {
      setSyncing(true);
      setMsg(null);
      const res = await fetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_meta' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Meta template sync failed');
      setMsg(`Synced ${d.syncedCount ?? 0} templates from Official Meta Graph API.`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">
            Meta WhatsApp Message Templates
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Approved Utility, Authentication & Marketing templates required outside the 24-hour
            customer service window.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void syncMeta()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {syncing ? 'Syncing...' : 'Sync from Meta'}
          </button>
          <Link
            href="/admin/whatsapp/templates/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Register Template
          </Link>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#111827]">{t.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  t.metaStatus === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {t.metaStatus} • {t.category}
              </span>
            </div>
            <p className="text-xs text-[#374151] whitespace-pre-line">{t.bodyText}</p>
            <div className="text-[11px] text-[#6B7280]">
              Purpose: {t.purpose.replace(/_/g, ' ')} • Variables: {(t.variables || []).join(', ') || 'None'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
