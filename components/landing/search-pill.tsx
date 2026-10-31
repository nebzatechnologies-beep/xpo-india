'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchPill() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    router.push(`/categories?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-full p-2 border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-2xl mx-auto flex flex-col sm:flex-row items-center"
    >
      <div className="flex-1 px-5 py-2 w-full text-left">
        <label className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-0.5">
          Search Services, Products, Categories or Skills
        </label>
        <input
          type="text"
          placeholder="e.g. CNC Turning, Next.js SaaS, Solar EPC, Corrugated Packaging..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-xs sm:text-sm text-[#111827] placeholder-[#9CA3AF] bg-transparent focus:outline-hidden font-medium"
        />
      </div>

      <div className="p-1 w-full sm:w-auto flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#E8192C] hover:bg-[#C0111F] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
        >
          <Search className="w-4 h-4 text-white" />
          <span>Explore Categories</span>
        </button>
      </div>
    </form>
  );
}
