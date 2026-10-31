'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { TaxonomyCategory, TaxonomySector } from '@/lib/types/domain';
import { Plus, GitMerge } from 'lucide-react';

export default function AdminTaxonomyCategoriesPage() {
  const [sectors, setSectors] = useState<TaxonomySector[]>([]);
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [sectorId, setSectorId] = useState('');
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/taxonomy/tree?includeInactive=true');
    if (res.ok) {
      const d = await res.json();
      setSectors(d.sectors || []);
      setCategories(d.categories || []);
      if (d.sectors?.length && !sectorId) setSectorId(d.sectors[0].id);
    }
  }, [sectorId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectorId, name: name.trim() }),
    });
    if (res.ok) {
      setName('');
      setMsg('Category saved.');
      await load();
    }
  }

  async function mergeCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    const res = await fetch('/api/taxonomy/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'merge', sourceId, targetId }),
    });
    if (res.ok) {
      setMsg('Category merged cleanly.');
      setSourceId('');
      setTargetId('');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">
        Tier 2 — Categories & Duplicate Merge
      </h1>
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={createCategory}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3"
        >
          <div className="text-xs font-bold flex items-center gap-1.5 text-[#111827]">
            <Plus className="w-4 h-4 text-[#111827]" /> Add Category
          </div>
          <select
            required
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            Save Category
          </button>
        </form>

        <form
          onSubmit={mergeCategory}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3"
        >
          <div className="text-xs font-bold flex items-center gap-1.5">
            <GitMerge className="w-4 h-4 text-amber-600" /> Merge Duplicate Category
          </div>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Duplicate Source Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Canonical Target Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold"
          >
            Execute Merge
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 divide-y divide-[#F3F4F6] text-xs">
        {categories.map((c) => (
          <div key={c.id} className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold">{c.name}</span>{' '}
              <span className="font-mono text-[#6B7280]">{c.code}</span>
            </div>
            <span>{c.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
