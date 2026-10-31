'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { TaxonomyCategory, TaxonomySubcategory } from '@/lib/types/domain';
import { Plus } from 'lucide-react';

export default function AdminTaxonomySubcategoriesPage() {
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [subcategories, setSubcategories] = useState<TaxonomySubcategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/taxonomy/tree?includeInactive=true');
    if (res.ok) {
      const d = await res.json();
      setCategories(d.categories || []);
      setSubcategories(d.subcategories || []);
      if (d.categories?.length && !categoryId) setCategoryId(d.categories[0].id);
    }
  }, [categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const res = await fetch('/api/taxonomy/subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectorId: cat.sectorId,
        categoryId: cat.id,
        name: name.trim(),
      }),
    });
    if (res.ok) {
      setName('');
      setMsg('Subcategory saved.');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">Tier 3 — Subcategories</h1>
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row gap-3"
      >
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          required
          placeholder="Subcategory Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Add Subcategory
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 divide-y divide-[#F3F4F6] text-xs">
        {subcategories.map((sc) => (
          <div key={sc.id} className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold">{sc.name}</span>{' '}
              <span className="font-mono text-[#6B7280]">{sc.code}</span>
            </div>
            <span>{sc.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
