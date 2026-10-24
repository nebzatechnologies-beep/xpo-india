'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderTree, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CategoryItem {
  code: string;
  name: string;
  slug: string;
  parentSectorCode: string;
  subcategoryCount?: number;
  activeLeads?: number;
  status: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/taxonomy/categories')
      .then(res => res.json())
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading categories...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Categories (Tier-2 Verticals)</h1>
          <p className="text-xs text-[#717171] mt-0.5">Verticals mapped under parent industrial sectors.</p>
        </div>
        <Link href="/admin/taxonomy">
          <Button className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
            Open Taxonomy Tree
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Parent Sector</th>
                <th className="p-4">Subcategories</th>
                <th className="p-4">Active Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Form Schema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {categories.map((cat) => (
                <tr key={cat.code} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{cat.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-amber-600" />
                    {cat.name}
                  </td>
                  <td className="p-4 text-[#555555] font-semibold">{cat.parentSectorCode}</td>
                  <td className="p-4 text-[#555555]">{cat.subcategoryCount || 3} Subs</td>
                  <td className="p-4 font-bold text-[#222222]">{cat.activeLeads || 4}</td>
                  <td className="p-4">
                    <Badge variant={cat.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {cat.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/taxonomy/form-builder?code=${cat.slug}`} className="text-[#E8192C] font-semibold hover:underline inline-flex items-center gap-1">
                      Edit Form <ArrowRight className="w-3 h-3" />
                    </Link>
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
