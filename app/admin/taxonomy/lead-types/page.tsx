'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Layers, ToggleLeft, ToggleRight } from 'lucide-react';

interface LeadTypeItem {
  code: string;
  name: string;
  description: string;
  mappedSectorsCount?: number;
  activeLeads?: number;
  status: string;
}

export default function LeadTypesPage() {
  const [leadTypes, setLeadTypes] = useState<LeadTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeadTypeItem | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' });

  useEffect(() => {
    fetch('/api/taxonomy/lead-types')
      .then(res => res.json())
      .then(res => {
        if (res.success) setLeadTypes(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (type?: LeadTypeItem) => {
    if (type) {
      setEditingType(type);
      setForm({ code: type.code, name: type.name, description: type.description, status: type.status });
    } else {
      setEditingType(null);
      setForm({ code: '', name: '', description: '', status: 'active' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/lead-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setLeadTypes(data.data);
      setModalOpen(false);
    }
  };

  const toggleStatus = async (type: LeadTypeItem) => {
    const updated = { ...type, status: type.status === 'active' ? 'inactive' : 'active' };
    const res = await fetch('/api/taxonomy/lead-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (data.success) setLeadTypes(data.data);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading lead types...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Lead Types Management</h1>
          <p className="text-xs text-[#717171] mt-0.5">Top-level commercial intent modes defining lead exchange behaviors.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Lead Type
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Lead Type Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Mapped Sectors</th>
                <th className="p-4">Active Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {leadTypes.map((type) => (
                <tr key={type.code} className="hover:bg-[#FDFDFD] transition-colors">
                  <td className="p-4 font-mono font-bold text-[#222222]">{type.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E8192C]" />
                    {type.name}
                  </td>
                  <td className="p-4 text-[#717171] max-w-xs truncate">{type.description}</td>
                  <td className="p-4 font-semibold text-[#555555]">{type.mappedSectorsCount || 6} Sectors</td>
                  <td className="p-4 font-bold text-[#222222]">{type.activeLeads || 12}</td>
                  <td className="p-4">
                    <Badge variant={type.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {type.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => toggleStatus(type)} className="text-[#717171] hover:text-[#222222] transition-colors">
                      {type.status === 'active' ? <ToggleRight className="w-5 h-5 text-emerald-600 inline" /> : <ToggleLeft className="w-5 h-5 text-neutral-400 inline" />}
                    </button>
                    <button onClick={() => handleOpenModal(type)} className="text-[#717171] hover:text-[#E8192C] transition-colors font-medium">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">{editingType ? 'Edit Lead Type' : 'Add New Lead Type'}</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. buy, sell, invest"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Direct Procurement / Buy"
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
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Lead Type</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
