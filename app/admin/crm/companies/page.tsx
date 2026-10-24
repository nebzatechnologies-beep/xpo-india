'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Search } from 'lucide-react';

export default function CompaniesDirectoryPage() {
  const [filter, setFilter] = useState<'all' | 'india' | 'global'>('all');
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/crm/contacts')
      .then(res => res.json())
      .then(res => {
        if (res.success) setContacts(res.data);
      });
  }, []);

  const filtered = contacts.filter(c => {
    if (filter === 'india') return c.country === 'India';
    if (filter === 'global') return c.country !== 'India';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Companies Directory</h1>
          <p className="text-xs text-[#717171] mt-0.5">Enterprise Client (Requirement Poster) and Partner (Solution Provider) accounts mapped by domestic and international origin.</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'all' ? 'bg-white text-[#222222] shadow-xs' : 'text-[#717171]'}`}
          >
            All Companies
          </button>
          <button
            onClick={() => setFilter('india')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'india' ? 'bg-white text-[#E8192C] shadow-xs' : 'text-[#717171]'}`}
          >
            🇮🇳 India Domestic
          </button>
          <button
            onClick={() => setFilter('global')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'global' ? 'bg-white text-blue-600 shadow-xs' : 'text-[#717171]'}`}
          >
            🌐 Global Overseas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none hover:border-neutral-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center font-bold text-base">
                {c.company.charAt(0)}
              </div>
              <Badge variant={c.country === 'India' ? 'primary' : 'neutral'} className="text-[10px]">
                {c.country}
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#222222]">{c.company}</h3>
              <p className="text-xs text-[#717171] mt-0.5">{c.city ? `${c.city}, ` : ''}{c.industry}</p>
            </div>

            <div className="pt-2 border-t border-[#EBEBEB] flex items-center justify-between text-xs text-[#555555]">
              <span>Key Contact:</span>
              <span className="font-semibold text-[#222222]">{c.name}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
