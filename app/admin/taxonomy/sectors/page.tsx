'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Building2 } from 'lucide-react';

interface SectorItem {
  code: string;
  name: string;
  description: string;
  categoriesCount?: number;
  activeLeads?: number;
  status: string;
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' });

  useEffect(() => {
    fetch('/api/taxonomy/sectors')
      .then(res => res.json())
      .then(res => {
        if (res.success) setSectors(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setSectors(data.data);
      setModalOpen(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading sectors...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Sectors (Tier-1 Classification)</h1>
          <p className="text-xs text-[#717171] mt-0.5">Core industrial and commercial sectors across Indian and Global trade.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Sector
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Sector Code</th>
                <th className="p-4">Sector Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Categories</th>
                <th className="p-4">Active Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {sectors.map((sec) => (
                <tr key={sec.code} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{sec.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E8192C]" />
                    {sec.name}
                  </td>
                  <td className="p-4 text-[#717171] max-w-xs truncate">{sec.description}</td>
                  <td className="p-4 font-semibold text-[#555555]">{sec.categoriesCount || 3} Categories</td>
                  <td className="p-4 font-bold text-[#222222]">{sec.activeLeads || 8}</td>
                  <td className="p-4">
                    <Badge variant={sec.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {sec.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[#717171] hover:text-[#E8192C] transition-colors">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">Add New Sector</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. TEXTILE, LOGISTICS"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Sector Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Textiles, Apparel & Garments"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Sector</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
