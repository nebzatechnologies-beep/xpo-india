'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  TaxonomyCategory,
  TaxonomySector,
  TaxonomySubcategory,
  TaxonomyTag,
} from '@/lib/types/domain';
import { Layers, UploadCloud, Sliders } from 'lucide-react';

export default function AdminTaxonomyTreePage() {
  const [sectors, setSectors] = useState<TaxonomySector[]>([]);
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [subcategories, setSubcategories] = useState<TaxonomySubcategory[]>([]);
  const [tags, setTags] = useState<TaxonomyTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/taxonomy/tree?includeInactive=true');
        if (res.ok) {
          const d = await res.json();
          setSectors(d.sectors || []);
          setCategories(d.categories || []);
          setSubcategories(d.subcategories || []);
          setTags(d.tags || []);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">
            4-Tier Marketplace Taxonomy Engine
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Canonical Sector → Category → Subcategory → Skill/Capability Tags hierarchy powering
            Web forms, WhatsApp Menus, and Deterministic Matching.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/taxonomy/form-builder"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold"
          >
            <Sliders className="w-3.5 h-3.5" /> Form Builder
          </Link>
          <Link
            href="/admin/taxonomy/import-export"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Import / Export
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/admin/taxonomy/sectors"
          className="bg-white p-4 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <div className="text-xs text-[#6B7280] font-semibold">Sectors</div>
          <div className="text-2xl font-black mt-1">{loading ? '—' : sectors.length}</div>
        </Link>
        <Link
          href="/admin/taxonomy/categories"
          className="bg-white p-4 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <div className="text-xs text-[#6B7280] font-semibold">Categories</div>
          <div className="text-2xl font-black mt-1">{loading ? '—' : categories.length}</div>
        </Link>
        <Link
          href="/admin/taxonomy/subcategories"
          className="bg-white p-4 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <div className="text-xs text-[#6B7280] font-semibold">Subcategories</div>
          <div className="text-2xl font-black mt-1">{loading ? '—' : subcategories.length}</div>
        </Link>
        <Link
          href="/admin/taxonomy/tags"
          className="bg-white p-4 rounded-2xl border border-[#E5E7EB] hover:border-gray-400 transition-colors shadow-xs"
        >
          <div className="text-xs text-[#6B7280] font-semibold">Skill & Tags</div>
          <div className="text-2xl font-black mt-1">{loading ? '—' : tags.length}</div>
        </Link>
      </div>

      <div className="space-y-4">
        {sectors.map((sec) => {
          const secCats = categories.filter((c) => c.sectorId === sec.id);
          return (
            <div key={sec.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#111827]" />
                  <span className="font-bold text-sm text-[#111827]">{sec.name}</span>
                  <span className="text-[11px] font-mono text-[#6B7280]">({sec.code})</span>
                </div>
                <span className="text-xs text-[#6B7280]">{secCats.length} Categories</span>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {secCats.map((cat) => {
                  const catSubs = subcategories.filter((s) => s.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                      <div className="font-bold text-[#111827]">{cat.name}</div>
                      <div className="text-[11px] text-[#6B7280] mt-1">
                        {catSubs.map((s) => s.name).join(' • ') || 'No subcategories'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
