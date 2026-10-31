'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { TaxonomySector } from '@/lib/types/domain';
import { Plus, GitMerge } from 'lucide-react';

export default function AdminTaxonomySectorsPage() {
  const [sectors, setSectors] = useState<TaxonomySector[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/taxonomy/sectors');
    if (res.ok) {
      const d = await res.json();
      setSectors(d.sectors || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createSector(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    if (res.ok) {
      setName('');
      setDescription('');
      setMsg('Sector saved.');
      await load();
    }
  }

  async function mergeSectors(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    const res = await fetch('/api/taxonomy/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'merge', sourceId, targetId }),
    });
    if (res.ok) {
      setMsg('Duplicate sector merged cleanly.');
      setSourceId('');
      setTargetId('');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#111827]">Tier 1 — Sectors & Duplicate Merge</h1>
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={createSector}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3"
        >
          <div className="text-xs font-bold flex items-center gap-1.5 text-[#111827]">
            <Plus className="w-4 h-4 text-[#111827]" /> Add / Update Sector
          </div>
          <input
            type="text"
            required
            placeholder="Sector Name (e.g., Renewable Energy)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            Save Sector
          </button>
        </form>

        <form
          onSubmit={mergeSectors}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3"
        >
          <div className="text-xs font-bold flex items-center gap-1.5">
            <GitMerge className="w-4 h-4 text-amber-600" /> Merge Duplicate Sector
          </div>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Select Duplicate Source Sector</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
          >
            <option value="">Select Canonical Target Sector</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold"
          >
            Merge & Re-link Categories
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <div className="divide-y divide-[#F3F4F6] text-xs">
          {sectors.map((s) => (
            <div key={s.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold">{s.name}</span>{' '}
                <span className="font-mono text-[#6B7280]">{s.code}</span>
              </div>
              <span className={s.isActive ? 'text-emerald-700 font-bold' : 'text-red-600'}>
                {s.isActive ? 'Active' : 'Merged/Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
