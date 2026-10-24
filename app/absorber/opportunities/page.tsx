'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Sparkles,
  Sliders,
  CheckCircle2,
  Tag,
  Clock,
  Building2,
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tagsList, setTagsList] = useState<any[]>([]);

  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'domestic' | 'global'>('all');
  const [search, setSearch] = useState('');
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [loading, setLoading] = useState(true);

  // My Capabilities modal & state
  const [capabilitiesModalOpen, setCapabilitiesModalOpen] = useState(false);
  const [myCapabilities, setMyCapabilities] = useState<string[]>(['CNC', 'Aluminum', 'Flanges', 'Machining']);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then((r) => r.json()),
      fetch('/api/taxonomy/tree').then((r) => r.json()),
    ]).then(([leadsData, taxData]) => {
      if (leadsData.success) setLeads(leadsData.leads || []);
      if (taxData.success && taxData.data) {
        setSectors(taxData.data.sectors || []);
        setCategories(taxData.data.categories || []);
        setTagsList(taxData.data.tags || []);
      }
      setLoading(false);
    });
  }, []);

  const toggleCapability = (tag: string) => {
    if (myCapabilities.includes(tag)) {
      setMyCapabilities(myCapabilities.filter((t) => t !== tag));
    } else {
      setMyCapabilities([...myCapabilities, tag]);
    }
  };

  const isMatchedLead = (lead: any) => {
    if (!lead.tags || lead.tags.length === 0) return false;
    return lead.tags.some((t: string) =>
      myCapabilities.some((c) => c.toLowerCase() === t.toLowerCase())
    );
  };

  const filtered = leads.filter((l) => {
    const matchSector =
      selectedSector === 'all' || l.sector === selectedSector || l.category?.parentSectorCode === selectedSector;
    const matchCat = selectedCatMatch(l);
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.xpoId.toLowerCase().includes(search.toLowerCase());
    const matchCapability = !onlyMatched || isMatchedLead(l);
    const matchRegion =
      regionFilter === 'all' ||
      (regionFilter === 'domestic' && (l.country === 'IN' || l.budgetCurrency === 'INR' || !l.country)) ||
      (regionFilter === 'global' && (l.country !== 'IN' || l.budgetCurrency === 'USD' || l.allowGlobalBids));
    return matchSector && matchCat && matchSearch && matchCapability && matchRegion;
  });

  function selectedCatMatch(lead: any) {
    if (selectedCategory === 'all') return true;
    return (
      lead.category?._id === selectedCategory ||
      lead.category?.slug === selectedCategory ||
      lead.category === selectedCategory
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Opportunity Exchange"
        description="Discover verified commercial specifications and procurement requirements. Express your interest and connect directly with clients with zero intermediary cuts."
        badge={
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Live Client Requirements
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCapabilitiesModalOpen(true)}
              className="rounded-xl font-bold border-[#E5E7EB] text-xs flex items-center gap-1.5 hover:bg-[#F9FAFB]"
            >
              <Sliders className="w-3.5 h-3.5 text-[#E8192C]" /> My Capabilities ({myCapabilities.length})
            </Button>
            <Link href="/absorber/my-responses">
              <Button size="sm" className="rounded-xl font-bold text-xs bg-[#111827] hover:bg-[#1F2937] text-white">
                My Expressed Interests
              </Button>
            </Link>
          </div>
        }
      />

      {/* Regional Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <span className="text-xs font-bold text-[#6B7280] shrink-0">Marketplace Scope:</span>
          <div className="inline-flex items-center p-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setRegionFilter('all')}
              className={`px-3 py-1 rounded-full transition-all shrink-0 ${
                regionFilter === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              All Demands ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('domestic')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
                regionFilter === 'domestic'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>🇮🇳</span>
              <span>Domestic India</span>
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('global')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 ${
                regionFilter === 'global'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>🌐</span>
              <span>Global Cross-Border</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#6B7280] font-medium hidden sm:block">
          💡 <span className="font-semibold text-[#111827]">Cross-Border Active</span>: Indian suppliers can bid on both domestic & foreign demands.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
          <Input
            placeholder="Search leads by keyword, specification, or XPO-ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border-[#E5E7EB] text-xs"
          />
        </div>

        {/* Sector Filter */}
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#111827] focus:outline-hidden font-medium"
        >
          <option value="all">All Sectors</option>
          {sectors.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#111827] focus:outline-hidden font-medium"
        >
          <option value="all">All Categories</option>
          {categories
            .filter((c) => selectedSector === 'all' || c.parentSectorCode === selectedSector)
            .map((c) => (
              <option key={c.code} value={c.slug || c.code}>{c.name}</option>
            ))}
        </select>

        {/* Capability Match Toggle Button */}
        <button
          type="button"
          onClick={() => setOnlyMatched(!onlyMatched)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
            onlyMatched
              ? 'bg-red-50 text-[#E8192C] border-red-200'
              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8192C]" />
          <span>Matched to Me ({leads.filter(isMatchedLead).length})</span>
        </button>
      </div>

      {/* Leads Feed */}
      <div className="space-y-3.5">
        {filtered.length === 0 && !loading ? (
          <EmptyState
            title="No matching opportunities found"
            description="Try loosening your search filters or add more skills to your Capabilities Matrix."
            icon={Search}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSector('all');
                  setSelectedCategory('all');
                  setSearch('');
                  setOnlyMatched(false);
                }}
                className="rounded-xl text-xs"
              >
                Reset All Filters
              </Button>
            }
          />
        ) : (
          filtered.map((lead) => {
            const matched = isMatchedLead(lead);
            return (
              <Card
                key={lead._id}
                className={`p-6 rounded-2xl border transition-all shadow-2xs ${
                  matched
                    ? 'border-red-200 bg-red-50/15 hover:border-red-300'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-gray-100 text-[#111827]">
                        {lead.xpoId}
                      </span>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold">
                        VERIFIED BUYER
                      </Badge>
                      {lead.budgetCurrency === 'USD' || lead.country !== 'IN' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          🌐 Global Demand
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          🇮🇳 Domestic Lead
                        </span>
                      )}
                      {matched && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#E8192C] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> MATCHED TO YOU
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#6B7280]">
                        {lead.category?.name || 'Commercial Vertical'}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">•</span>
                      <span className="text-xs text-[#6B7280] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        {lead.city || lead.country || 'India'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#111827]">{lead.title}</h3>
                    <p className="text-xs text-[#4B5563] line-clamp-2 max-w-3xl leading-relaxed">{lead.description}</p>

                    {lead.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {lead.tags.map((t: string, i: number) => {
                          const isCap = myCapabilities.some((c) => c.toLowerCase() === t.toLowerCase());
                          return (
                            <span
                              key={i}
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                isCap
                                  ? 'bg-red-50 text-[#E8192C] font-bold border-red-200'
                                  : 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]'
                              }`}
                            >
                              #{t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5E7EB]">
                    {lead.budgetMax && (
                      <div className="text-left lg:text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Target Budget</div>
                        <div className="text-base font-black text-[#111827]">
                          {lead.budgetCurrency === 'USD' ? '$' : '₹'}{lead.budgetMax.toLocaleString()}
                        </div>
                      </div>
                    )}

                    <Link href={`/absorber/opportunities/${lead.xpoId || lead._id}`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto rounded-xl text-xs font-bold bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center justify-center gap-1.5 shadow-xs">
                        View & Express Interest <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* My Capabilities Multi-Select Modal */}
      {capabilitiesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111827]">Configure My Capabilities</h3>
                <p className="text-xs text-[#6B7280]">Select your machinery, materials, and skills to highlight matching opportunities.</p>
              </div>
              <button
                onClick={() => setCapabilitiesModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] font-bold text-sm p-1 rounded-lg hover:bg-[#F3F4F6]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-[#111827]">Available Industry Specifications:</div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                {[
                  'CNC',
                  'Aluminum',
                  'Flanges',
                  'Machining',
                  'Sheet Metal',
                  'Fabrication',
                  'Polymers',
                  'Resins',
                  'HDPE',
                  'Cotton',
                  'Yarn',
                  'React',
                  'NodeJS',
                  'DevOps',
                  'Injection Molding',
                  'Corrugated Packaging',
                ].map((tag) => {
                  const selected = myCapabilities.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleCapability(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? 'border-[#E8192C] bg-red-50 text-[#E8192C] font-bold shadow-xs'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-700">{myCapabilities.length} capabilities selected</span>
              <Button size="sm" onClick={() => setCapabilitiesModalOpen(false)} className="rounded-xl bg-[#E8192C] text-white font-bold">
                Save & Update Feed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}