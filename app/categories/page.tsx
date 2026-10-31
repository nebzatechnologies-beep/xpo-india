'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Search, Layers, Tag, ArrowRight, AlertCircle } from 'lucide-react';

interface TaxonomyNode {
  id: string;
  name: string;
  code?: string;
  categories?: Array<{
    id: string;
    name: string;
    subcategories?: Array<{
      id: string;
      name: string;
      tags?: Array<{ id: string; name: string }>;
    }>;
  }>;
}

function CategoriesDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [tree, setTree] = useState<TaxonomyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [configPending, setConfigPending] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTaxonomy() {
      try {
        setLoading(true);
        const res = await fetch('/api/categories');
        if (res.status === 503) {
          if (active) setConfigPending(true);
          return;
        }
        const data = await res.json();
        if (active && Array.isArray(data.tree)) {
          setTree(data.tree);
        }
      } catch {
        // Handled via empty state
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTaxonomy();
    return () => {
      active = false;
    };
  }, []);

  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((sector) => {
        const sectorMatches = sector.name.toLowerCase().includes(q);
        const matchedCategories = (sector.categories || []).filter((cat) => {
          if (sectorMatches || cat.name.toLowerCase().includes(q)) return true;
          return (cat.subcategories || []).some(
            (sub) =>
              sub.name.toLowerCase().includes(q) ||
              (sub.tags || []).some((t) => t.name.toLowerCase().includes(q))
          );
        });
        if (sectorMatches || matchedCategories.length > 0) {
          return {
            ...sector,
            categories: sectorMatches ? sector.categories : matchedCategories,
          };
        }
        return null;
      })
      .filter(Boolean) as TaxonomyNode[];
  }, [tree, query]);

  return (
    <main className="flex-1 bg-[#F8F9FA]">
      <section className="bg-white border-b border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E8192C]">
              <Layers className="w-4 h-4" /> 4-Tier Marketplace Taxonomy
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#111827]">
              Explore Sectors, Categories, Subcategories & Skill Tags
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#6B7280]">
              Every Client requirement and Partner service profile maps cleanly onto XPO&apos;s
              4-tier industry taxonomy for fast, accurate 5-minute matching.
            </p>
          </div>

          <div className="mt-6 max-w-xl relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sectors, categories, subcategories, or tags..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm focus:outline-none focus:border-[#111827]"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {configPending && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Cloud Firestore Credentials Pending</p>
              <p className="mt-1 text-amber-800">
                Add your production Firebase service account credentials to <code>.env.local</code>{' '}
                to automatically seed and render the live 4-tier taxonomy tree.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
            <p className="text-base font-semibold text-[#111827]">
              No matching taxonomy categories found.
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Try clearing your search filter or post a custom requirement directly.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold hover:bg-[#F3F4F6]"
              >
                Reset Filter
              </button>
              <Link
                href="/dashboard/client/post-requirement"
                className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-semibold hover:bg-black"
              >
                Post Requirement Free
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredTree.map((sector) => (
              <div
                key={sector.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3F4F6]">
                  <div>
                    <h2 className="text-xl font-bold text-[#111827]">{sector.name}</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {(sector.categories || []).length} Categories active
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/client/post-requirement?sectorId=${encodeURIComponent(sector.id)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8192C] text-white text-xs font-semibold hover:bg-[#C0111F]"
                    >
                      Post Requirement Free <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/register?role=partner"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-[#111827] text-xs font-semibold hover:bg-[#F3F4F6]"
                    >
                      Join as Partner
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(sector.categories || []).map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]"
                    >
                      <h3 className="font-bold text-sm text-[#111827]">{cat.name}</h3>
                      <div className="mt-3 space-y-2.5">
                        {(cat.subcategories || []).map((sub) => (
                          <div key={sub.id}>
                            <div className="text-xs font-semibold text-[#374151]">{sub.name}</div>
                            {(sub.tags || []).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(sub.tags || []).map((t) => (
                                  <span
                                    key={t.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[11px] text-[#6B7280]"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <Navbar />
      <Suspense fallback={<div className="flex-1 p-12 text-center text-sm">Loading taxonomy...</div>}>
        <CategoriesDirectoryContent />
      </Suspense>
      <Footer />
    </div>
  );
}
