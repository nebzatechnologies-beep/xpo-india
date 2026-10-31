'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { TaxonomyTag } from '@/lib/types/domain';
import { Plus, GitMerge } from 'lucide-react';

export default function AdminTaxonomyTagsPage() {
  const [tags, setTags] = useState<TaxonomyTag[]>([]);
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/taxonomy/tags');
    if (res.ok) {
      const d = await res.json();
      setTags(d.tags || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setName('');
      setMsg('Skill/Capability tag saved.');
      await load();
    }
  }

  async function mergeTags(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    const res = await fetch('/api/taxonomy/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'merge', sourceId, targetId }),
    });
    if (res.ok) {
      setMsg('Duplicate tag merged.');
      setSourceId('');
      setTargetId('');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">
        Tier 4 — Capability & Skill Tags ({tags.length})
      </h1>
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={addTag}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex gap-2"
        >
          <input
            type="text"
            required
            placeholder="New Skill or Capability Tag"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Tag
          </button>
        </form>

        <form
          onSubmit={mergeTags}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-wrap gap-2"
        >
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Duplicate Tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Target Tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold"
          >
            <GitMerge className="w-4 h-4" /> Merge
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="px-3 py-1 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold"
          >
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}
