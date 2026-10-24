'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Users, Send, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AudienceSegmentsPage() {
  const [segments, setSegments] = useState([
    { id: 'seg_1', name: 'Precision Machining Vendors (Maharashtra)', count: 42, filters: 'Sector: Manufacturing, City: Pune/Mumbai, Opt-In: Yes' },
    { id: 'seg_2', name: 'Global Importers & Sourcing Heads', count: 18, filters: 'Country: USA/Germany/UAE, Status: Registered' },
    { id: 'seg_3', name: 'Textile Mill Owners (Gujarat)', count: 27, filters: 'Sector: Textiles, State: Gujarat, Consent: Active' },
    { id: 'seg_4', name: 'Hot Leads - Not Yet Registered', count: 65, filters: 'Lifecycle: Responded/Interested, Registration: False' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newSeg, setNewSeg] = useState({ name: '', sector: 'Manufacturing', country: 'India' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSegments([
      ...segments,
      {
        id: `seg_${Date.now()}`,
        name: newSeg.name,
        count: Math.floor(Math.random() * 30) + 10,
        filters: `Sector: ${newSeg.sector}, Country: ${newSeg.country}`
      }
    ]);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Audience Segments</h1>
          <p className="text-xs text-[#717171] mt-0.5">Dynamic target groups compiled for tailored bulk WhatsApp campaigns and acquisition.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create New Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments.map(seg => (
          <Card key={seg.id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#222222] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E8192C]" />
                {seg.name}
              </h3>
              <Badge variant="primary" className="text-xs font-bold">
                {seg.count} Prospects
              </Badge>
            </div>

            <p className="text-xs text-[#717171] bg-neutral-50 p-2.5 rounded-xl border border-[#EBEBEB]">
              <span className="font-semibold text-[#555555]">Query Criteria: </span>
              {seg.filters}
            </p>

            <div className="pt-2 flex items-center justify-between">
              <Link href={`/admin/whatsapp/campaigns/create?segment=${seg.id}`}>
                <Button size="sm" variant="outline" className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" /> Launch WhatsApp Campaign
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">Create Audience Segment</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Segment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune CNC Suppliers"
                  value={newSeg.name}
                  onChange={e => setNewSeg({ ...newSeg, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Target Sector</label>
                <select
                  value={newSeg.sector}
                  onChange={e => setNewSeg({ ...newSeg, sector: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                >
                  <option value="Manufacturing">Manufacturing & Industrial</option>
                  <option value="Chemicals">Raw Materials & Chemicals</option>
                  <option value="Textiles">Textiles & Apparel</option>
                  <option value="IT">Information Technology</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Segment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
