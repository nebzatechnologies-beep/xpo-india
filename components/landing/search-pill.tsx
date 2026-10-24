'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Layers, Sparkles } from 'lucide-react';

export function SearchPill() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('all');
  const [region, setRegion] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (sector !== 'all') params.set('sector', sector);
    if (region !== 'all') params.set('region', region);
    router.push(`/absorber/opportunities?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-full p-2 border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all max-w-4xl mx-auto flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]"
    >
      {/* Segment 1: Need / Specification */}
      <div className="flex-1 px-5 py-2 w-full text-left">
        <label className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-0.5">
          What do you need?
        </label>
        <input
          type="text"
          placeholder="e.g. 5,000 custom packaging boxes, CNC parts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-xs sm:text-sm text-[#111827] placeholder-[#9CA3AF] bg-transparent focus:outline-hidden font-medium"
        />
      </div>

      {/* Segment 2: Sector */}
      <div className="px-5 py-2 w-full md:w-56 text-left">
        <label className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-0.5">
          Sector
        </label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-full text-xs sm:text-sm text-[#111827] bg-transparent focus:outline-hidden font-medium cursor-pointer"
        >
          <option value="all">Any Sector</option>
          <option value="MFG">Manufacturing & Engineering</option>
          <option value="TEX">Textiles & Apparel</option>
          <option value="PKG">Packaging & Printing</option>
          <option value="IT">IT & Software Development</option>
          <option value="AGR">Agriculture & Food Processing</option>
          <option value="LOG">Logistics & Supply Chain</option>
        </select>
      </div>

      {/* Segment 3: Scope / Region */}
      <div className="px-5 py-2 w-full md:w-52 text-left">
        <label className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-0.5">
          Scope / Delivery
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full text-xs sm:text-sm text-[#111827] bg-transparent focus:outline-hidden font-medium cursor-pointer"
        >
          <option value="all">Domestic & Global</option>
          <option value="domestic">India Domestic</option>
          <option value="export">International Export</option>
        </select>
      </div>

      {/* Action Search Button */}
      <div className="p-1 w-full md:w-auto flex justify-end">
        <button
          type="submit"
          className="w-full md:w-auto h-12 px-6 rounded-full bg-[#E8192C] hover:bg-[#C0111F] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group shrink-0"
        >
          <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>Find Leads</span>
        </button>
      </div>
    </form>
  );
}
