'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { ContactSegment, CrmDatabaseType } from '@/lib/types/domain';
import { Plus } from 'lucide-react';

export default function AdminCrmSegmentsPage() {
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [name, setName] = useState('');
  const [databaseType, setDatabaseType] = useState<CrmDatabaseType>('partner');
  const [city, setCity] = useState('');
  const [consentStatus, setConsentStatus] = useState<'opted_in' | 'none'>('opted_in');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/crm/segments');
    if (res.ok) {
      const d = await res.json();
      setSegments(d.segments || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/crm/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        filters: {
          databaseType,
          roles: [databaseType],
          city: city.trim() || undefined,
          consentStatus,
        },
      }),
    });
    if (res.ok) {
      setName('');
      setCity('');
      setMsg('Audience segment saved with live recipient count.');
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Audience Segments</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Build targeted, consent-verified Client or Partner segments for approved Meta WhatsApp
          broadcasts.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-5 grid grid-cols-1 sm:grid-cols-6 gap-3"
      >
        <input
          type="text"
          required
          placeholder="Segment Name (e.g., Mumbai Consented Partners)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <select
          value={databaseType}
          onChange={(e) => setDatabaseType(e.target.value as CrmDatabaseType)}
          className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
        >
          <option value="partner">Partner Database</option>
          <option value="client">Client Database</option>
        </select>
        <select
          value={consentStatus}
          onChange={(e) => setConsentStatus(e.target.value as 'opted_in' | 'none')}
          className="px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
        >
          <option value="opted_in">Opted-In Only</option>
          <option value="none">Missing Consent</option>
        </select>
        <input
          type="text"
          placeholder="City Filter (Optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" /> Create Segment
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 divide-y divide-[#F3F4F6] text-xs">
        {segments.map((seg) => (
          <div key={seg.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-[#111827]">{seg.name}</div>
              <div className="text-[#6B7280] mt-0.5">
                Database:{' '}
                <strong className="uppercase">
                  {seg.filters.databaseType || (seg.filters.roles || []).join(', ') || 'All'}
                </strong>{' '}
                • City: {seg.filters.city || 'Any'} • Consent:{' '}
                {seg.filters.consentStatus || 'Any'}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold text-[11px]">
              {seg.estimatedCount} Contacts
            </span>
          </div>
        ))}
        {segments.length === 0 && (
          <p className="text-[#6B7280]">No audience segments created yet.</p>
        )}
      </div>
    </div>
  );
}
