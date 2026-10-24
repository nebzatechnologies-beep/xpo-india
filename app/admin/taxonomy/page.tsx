'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderTree,
  Building2,
  Tag,
  UploadCloud,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Trash2,
  Move,
  GitMerge,
  Save,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface SubcategoryNode {
  code: string;
  name: string;
  parentCategoryCode: string;
  sectorCode: string;
  status: string;
  mappedTags?: string[];
}

export default function TaxonomyOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<SubcategoryNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['All Classifications', 'Manufacturing & Industrial', 'Machining & CNC Components', 'Precision CNC Machining']);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'MFG': true,
    'CAT_MFG_IND': true,
  });

  const [editForm, setEditForm] = useState({
    name: 'Precision CNC Machining',
    code: 'SUB_CNC',
    parent: 'Machining & CNC Components (CAT_MFG_IND)',
    description: 'Precision computer numerical control component milling, lathe turning, 5-axis aerospace machining.',
    icon: 'Cpu',
    status: 'active',
    order: 1
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/taxonomy/tree')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
          if (res.data.subcategories && res.data.subcategories.length > 0) {
            const sub = res.data.subcategories[0];
            setSelectedNode(sub);
            setEditForm({
              name: sub.name,
              code: sub.code,
              parent: sub.parentCategoryCode,
              description: 'Standard classification for high precision manufacturing components and tolerances.',
              icon: 'Cpu',
              status: sub.status,
              order: 1
            });
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectSub = (sub: SubcategoryNode, catName: string, secName: string) => {
    setSelectedNode(sub);
    setBreadcrumbs(['Lead Types', secName, catName, sub.name]);
    setEditForm({
      name: sub.name,
      code: sub.code,
      parent: `${catName} (${sub.parentCategoryCode})`,
      description: `Precision production, fabrication, or sourcing for ${sub.name}`,
      icon: 'Cpu',
      status: sub.status,
      order: 1
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-[#E8192C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalLeadTypes: 4,
    totalSectors: 6,
    totalCategories: 18,
    totalSubcategories: 42,
    totalTags: 128,
    activeClassifications: 56,
    inactiveClassifications: 4,
    lastUpdated: 'Today, 14:00 IST'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Taxonomy Management Suite</h1>
          <p className="text-xs text-[#717171] mt-0.5">
            5-tier dynamic classification hierarchy driving all lead posting, search indexing, and WhatsApp distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin/taxonomy/import-export">
            <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-[#E8192C]" /> Import Excel
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const json = JSON.stringify(data, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'xpo-taxonomy-master.json';
              a.click();
            }}
            className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Database
          </Button>
          <Link href="/admin/taxonomy/form-builder">
            <Button size="sm" className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Form Builder
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Lead Types</div>
          <div className="text-xl font-black text-[#222222] mt-1">{stats.totalLeadTypes}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Commercial Intent</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Sectors</div>
          <div className="text-xl font-black text-[#222222] mt-1">{stats.totalSectors}</div>
          <div className="text-[10px] text-[#717171] font-semibold mt-0.5">Tier-1 Domains</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Categories</div>
          <div className="text-xl font-black text-[#222222] mt-1">{stats.totalCategories}</div>
          <div className="text-[10px] text-[#717171] font-semibold mt-0.5">Tier-2 Verticals</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Subcategories</div>
          <div className="text-xl font-black text-[#222222] mt-1">{stats.totalSubcategories}</div>
          <div className="text-[10px] text-[#717171] font-semibold mt-0.5">Tier-3 Specialities</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Skills & Tags</div>
          <div className="text-xl font-black text-[#222222] mt-1">{stats.totalTags}</div>
          <div className="text-[10px] text-[#717171] font-semibold mt-0.5">Keywords & Specs</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Status</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{stats.activeClassifications}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Live on Platform</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Inactive</div>
          <div className="text-xl font-black text-amber-600 mt-1">{stats.inactiveClassifications}</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Draft / Archived</div>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Last Published</div>
          <div className="text-xs font-black text-[#222222] mt-2 truncate">v4.0.0-PROD</div>
          <div className="text-[9px] text-[#717171] font-medium mt-0.5">{stats.lastUpdated}</div>
        </Card>
      </div>

      {/* 2-Column Interface: Left Tree & Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Classification Tree */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white shadow-none flex flex-col h-[650px]">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EBEBEB]">
              <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-[#E8192C]" /> Classification Tree
              </div>
              <span className="text-[10px] text-[#717171] bg-neutral-100 px-2 py-0.5 rounded-md font-semibold">
                Dynamic Hierarchy
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative my-3">
              <Search className="w-3.5 h-3.5 text-[#717171] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search classifications, sectors, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EBEBEB] bg-[#FDFDFD] focus:outline-none focus:border-[#E8192C]"
              />
            </div>

            {/* Tree Nodes List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {data?.sectors?.map((sec: any) => {
                const isSecOpen = expandedNodes[sec.code] ?? true;
                const categories = data?.categories?.filter((c: any) => c.parentSectorCode === sec.code) || [];

                return (
                  <div key={sec.code} className="border border-[#F0F0F0] rounded-xl p-2 bg-[#FCFCFC]">
                    <div
                      onClick={() => toggleExpand(sec.code)}
                      className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-neutral-100 font-bold text-[#222222]"
                    >
                      <div className="flex items-center gap-2">
                        {isSecOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#717171]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#717171]" />}
                        <Building2 className="w-3.5 h-3.5 text-[#E8192C]" />
                        <span>{sec.name}</span>
                        <span className="text-[10px] text-[#999999] font-normal">({sec.code})</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                        {categories.length} Cats
                      </Badge>
                    </div>

                    {isSecOpen && (
                      <div className="pl-4 pr-1 pt-1.5 space-y-1.5 border-l-2 border-neutral-200 ml-3.5 mt-1">
                        {categories.map((cat: any) => {
                          const isCatOpen = expandedNodes[cat.code] ?? false;
                          const subcategories = data?.subcategories?.filter((s: any) => s.parentCategoryCode === cat.code) || [];

                          return (
                            <div key={cat.code} className="bg-white rounded-lg p-1.5 border border-[#EBEBEB]">
                              <div
                                onClick={() => toggleExpand(cat.code)}
                                className="flex items-center justify-between cursor-pointer py-0.5 px-1 rounded hover:bg-neutral-50 font-semibold text-[#333333]"
                              >
                                <div className="flex items-center gap-1.5">
                                  {isCatOpen ? <ChevronDown className="w-3 h-3 text-[#717171]" /> : <ChevronRight className="w-3 h-3 text-[#717171]" />}
                                  <FolderTree className="w-3 h-3 text-amber-600" />
                                  <span className="truncate">{cat.name}</span>
                                </div>
                                <span className="text-[9px] text-[#717171] font-mono">{subcategories.length} subs</span>
                              </div>

                              {isCatOpen && (
                                <div className="pl-3.5 pt-1 space-y-1 border-l border-neutral-200 ml-2.5 mt-1">
                                  {subcategories.map((sub: any) => {
                                    const isSelected = selectedNode?.code === sub.code;
                                    return (
                                      <div
                                        key={sub.code}
                                        onClick={() => handleSelectSub(sub, cat.name, sec.name)}
                                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                                          isSelected
                                            ? 'bg-red-50 text-[#E8192C] font-bold border border-red-200'
                                            : 'hover:bg-neutral-50 text-[#555555]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          <span className="truncate">{sub.name}</span>
                                        </div>
                                        <span className="text-[9px] text-[#999999] font-mono">{sub.code}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Panel: Selected Classification Detail Editor */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white shadow-none h-[650px] flex flex-col justify-between">
            <div className="space-y-5 overflow-y-auto pr-1">
              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1.5 text-xs text-[#717171] font-medium flex-wrap pb-3 border-b border-[#EBEBEB]">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-[#999999]" />}
                    <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-[#222222]' : ''}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* Title & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#222222] tracking-tight">{editForm.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-[#555555]">
                      Code: {editForm.code}
                    </span>
                    <Badge variant={editForm.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                      {editForm.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs rounded-xl border-[#EBEBEB] h-8 flex items-center gap-1 text-[#717171]">
                    <GitMerge className="w-3.5 h-3.5" /> Merge
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs rounded-xl border-[#EBEBEB] h-8 flex items-center gap-1 text-[#717171]">
                    <Move className="w-3.5 h-3.5" /> Move
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                      Classification Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                      System Code
                    </label>
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={e => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Parent Hierarchy
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editForm.parent}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] bg-neutral-50 text-[#717171] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Description & Specifications Scope
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                      Icon Identifier
                    </label>
                    <input
                      type="text"
                      value={editForm.icon}
                      onChange={e => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editForm.order}
                      onChange={e => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                      Publication Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:outline-none focus:border-[#E8192C]"
                    >
                      <option value="active">Active (Published)</option>
                      <option value="inactive">Inactive (Draft)</option>
                    </select>
                  </div>
                </div>

                {/* Mapped Tags Section */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#EBEBEB] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#555555]">
                    <span>Mapped Search Tags & Keywords</span>
                    <Link href="/admin/taxonomy/tags" className="text-[#E8192C] hover:underline">
                      Manage Tags →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['CNC', 'Lathe', 'Milling', 'Aerospace', 'Tolerance ±0.01mm', 'ISO 9001', 'Aluminum 6061'].map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#EBEBEB] text-[10px] text-[#555555] font-medium flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-[#E8192C]" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-[#EBEBEB] flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Deactivate
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  isLoading={saving}
                  className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 px-4"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
