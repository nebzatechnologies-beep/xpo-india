'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface SubcategoryItem {
  code: string;
  name: string;
  parentCategoryCode: string;
  sectorCode: string;
  mappedTags?: string[];
  status: string;
}

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/taxonomy/subcategories')
      .then(res => res.json())
      .then(res => {
        if (res.success) setSubcategories(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading subcategories...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Subcategories (Tier-3 Specialities)</h1>
        <p className="text-xs text-[#717171] mt-0.5">High-precision niche specialities used for exact opportunity matching.</p>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Subcategory Code</th>
                <th className="p-4">Subcategory Name</th>
                <th className="p-4">Parent Category</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Mapped Tags</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {subcategories.map((sub) => (
                <tr key={sub.code} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{sub.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#E8192C]" />
                    {sub.name}
                  </td>
                  <td className="p-4 text-[#555555]">{sub.parentCategoryCode}</td>
                  <td className="p-4 font-semibold text-[#555555]">{sub.sectorCode}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {sub.mappedTags?.slice(0, 3).map((t: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] text-[#555555]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={sub.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {sub.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
