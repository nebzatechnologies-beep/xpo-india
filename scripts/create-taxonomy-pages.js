const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', relPath);
}

// 1. Lead Types (Screen 2.2)
writeFile('app/admin/taxonomy/lead-types/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, CheckCircle2, Layers, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export default function LeadTypesPage() {
  const [leadTypes, setLeadTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' });

  useEffect(() => {
    fetch('/api/taxonomy/lead-types')
      .then(res => res.json())
      .then(res => {
        if (res.success) setLeadTypes(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (type?: any) => {
    if (type) {
      setEditingType(type);
      setForm({ code: type.code, name: type.name, description: type.description, status: type.status });
    } else {
      setEditingType(null);
      setForm({ code: '', name: '', description: '', status: 'active' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/lead-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setLeadTypes(data.data);
      setModalOpen(false);
    }
  };

  const toggleStatus = async (type: any) => {
    const updated = { ...type, status: type.status === 'active' ? 'inactive' : 'active' };
    const res = await fetch('/api/taxonomy/lead-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (data.success) setLeadTypes(data.data);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Lead Types Management</h1>
          <p className="text-xs text-[#717171] mt-0.5">Top-level commercial intent modes defining lead exchange behaviors.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Lead Type
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Lead Type Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Mapped Sectors</th>
                <th className="p-4">Active Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {leadTypes.map((type) => (
                <tr key={type.code} className="hover:bg-[#FDFDFD] transition-colors">
                  <td className="p-4 font-mono font-bold text-[#222222]">{type.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E8192C]" />
                    {type.name}
                  </td>
                  <td className="p-4 text-[#717171] max-w-xs truncate">{type.description}</td>
                  <td className="p-4 font-semibold text-[#555555]">{type.mappedSectorsCount || 6} Sectors</td>
                  <td className="p-4 font-bold text-[#222222]">{type.activeLeads || 12}</td>
                  <td className="p-4">
                    <Badge variant={type.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {type.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => toggleStatus(type)} className="text-[#717171] hover:text-[#222222] transition-colors">
                      {type.status === 'active' ? <ToggleRight className="w-5 h-5 text-emerald-600 inline" /> : <ToggleLeft className="w-5 h-5 text-neutral-400 inline" />}
                    </button>
                    <button onClick={() => handleOpenModal(type)} className="text-[#717171] hover:text-[#E8192C] transition-colors font-medium">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">{editingType ? 'Edit Lead Type' : 'Add New Lead Type'}</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. buy, sell, invest"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Direct Procurement / Buy"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Lead Type</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// 2. Sectors (Screen 2.3)
writeFile('app/admin/taxonomy/sectors/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Building2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SectorsPage() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' });

  useEffect(() => {
    fetch('/api/taxonomy/sectors')
      .then(res => res.json())
      .then(res => {
        if (res.success) setSectors(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setSectors(data.data);
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Sectors (Tier-1 Classification)</h1>
          <p className="text-xs text-[#717171] mt-0.5">Core industrial and commercial sectors across Indian and Global trade.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Sector
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Sector Code</th>
                <th className="p-4">Sector Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Categories</th>
                <th className="p-4">Active Leads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {sectors.map((sec) => (
                <tr key={sec.code} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{sec.code}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E8192C]" />
                    {sec.name}
                  </td>
                  <td className="p-4 text-[#717171] max-w-xs truncate">{sec.description}</td>
                  <td className="p-4 font-semibold text-[#555555]">{sec.categoriesCount || 3} Categories</td>
                  <td className="p-4 font-bold text-[#222222]">{sec.activeLeads || 8}</td>
                  <td className="p-4">
                    <Badge variant={sec.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {sec.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-[#717171] hover:text-[#E8192C] transition-colors">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">Add New Sector</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. TEXTILE, LOGISTICS"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Sector Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Textiles, Apparel & Garments"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Sector</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// 3. Categories (Screen 2.4)
writeFile('app/admin/taxonomy/categories/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, FolderTree, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/taxonomy/categories')
      .then(res => res.json())
      .then(res => {
        if (res.success) setCategories(res.data);
      });
  }, []);

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
                    <Link href={'/admin/taxonomy/form-builder?code=' + cat.slug} className="text-[#E8192C] font-semibold hover:underline inline-flex items-center gap-1">
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
`);

// 4. Subcategories (Screen 2.5)
writeFile('app/admin/taxonomy/subcategories/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Tag } from 'lucide-react';

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/taxonomy/subcategories')
      .then(res => res.json())
      .then(res => {
        if (res.success) setSubcategories(res.data);
      });
  }, []);

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
`);

// 5. Skills & Tags (Screen 2.6)
writeFile('app/admin/taxonomy/tags/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, GitMerge, CheckCircle2 } from 'lucide-react';

export default function TagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceTag, setSourceTag] = useState('');
  const [targetTag, setTargetTag] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/taxonomy/tags')
      .then(res => res.json())
      .then(res => {
        if (res.success) setTags(res.data);
      });
  }, []);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/taxonomy/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'merge', sourceTag, targetTag })
    });
    const data = await res.json();
    if (data.success) {
      setTags(data.data);
      setMessage('Tags merged successfully!');
      setMergeModalOpen(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Skills & Tags Registry</h1>
          <p className="text-xs text-[#717171] mt-0.5">Granular keywords and machine specifications mapped to subcategories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setMergeModalOpen(true)} variant="outline" size="sm" className="text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5 text-[#E8192C]" /> Merge Duplicate Tags
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" /> {message}
        </div>
      )}

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Tag Name</th>
                <th className="p-4">Mapped Subcategory</th>
                <th className="p-4">Parent Category</th>
                <th className="p-4">Platform Usage Count</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {tags.map((tag, i) => (
                <tr key={i} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#E8192C]" />
                    {tag.name}
                  </td>
                  <td className="p-4 font-mono text-[#555555]">{tag.subcategoryCode}</td>
                  <td className="p-4 font-mono text-[#717171]">{tag.categoryCode}</td>
                  <td className="p-4 font-semibold text-[#222222]">{tag.usageCount} leads</td>
                  <td className="p-4">
                    <Badge variant={tag.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                      {tag.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {mergeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">Merge Duplicate Tags</h3>
            <p className="text-xs text-[#717171]">Transfer all lead associations from the source duplicate tag into the primary target tag.</p>
            <form onSubmit={handleMerge} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Source Tag (To Delete)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNC Miling (Typo)"
                  value={sourceTag}
                  onChange={e => setSourceTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Target Tag (To Keep)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNC Milling"
                  value={targetTag}
                  onChange={e => setTargetTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setMergeModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Execute Merge</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// 6. Category Mapping Matrix (Screen 2.7)
writeFile('app/admin/taxonomy/mapping/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

export default function CategoryMappingPage() {
  const [saved, setSaved] = useState(false);
  const [matrix, setMatrix] = useState<any[]>([
    { leadType: 'Buy / Procurement', sector: 'Manufacturing & Industrial', category: 'Machining & CNC Components', subcategory: 'Precision CNC Machining', mapped: true },
    { leadType: 'Buy / Procurement', sector: 'Manufacturing & Industrial', category: 'Machining & CNC Components', subcategory: 'Heavy Sheet Metal Fabrication', mapped: true },
    { leadType: 'Sell / Excess Stock', sector: 'Raw Materials & Chemicals', category: 'Industrial Polymers & Resins', subcategory: 'Polypropylene & HDPE Granules', mapped: true },
    { leadType: 'Distributor / Agency', sector: 'Textiles & Apparel', category: 'Fabrics & Yarn', subcategory: 'Organic Cotton & Combed Yarn', mapped: true },
    { leadType: 'Contract Work', sector: 'Information Technology', category: 'Custom Software & Cloud', subcategory: 'Full-Stack Web & Mobile Engineering', mapped: true },
    { leadType: 'Partnership / JV', sector: 'Construction & Real Estate', category: 'Commercial EPC & Infra', subcategory: 'Structural Steel & Precast Works', mapped: false },
  ]);

  const toggleCheck = (index: number) => {
    const next = [...matrix];
    next[index].mapped = !next[index].mapped;
    setMatrix(next);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Category Mapping Matrix</h1>
          <p className="text-xs text-[#717171] mt-0.5">Cross-classification permissions linking commercial intents to allowable industrial verticals.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Matrix Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Mapping Matrix</>}
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4 w-12 text-center">Active</th>
                <th className="p-4">Commercial Intent (Lead Type)</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Category</th>
                <th className="p-4">Subcategory Allowed</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.mapped}
                      onChange={() => toggleCheck(idx)}
                      className="w-4 h-4 rounded text-[#E8192C] focus:ring-[#E8192C]"
                    />
                  </td>
                  <td className="p-4 font-bold text-[#222222]">{row.leadType}</td>
                  <td className="p-4 text-[#555555] font-semibold">{row.sector}</td>
                  <td className="p-4 text-[#555555]">{row.category}</td>
                  <td className="p-4 font-bold text-[#222222]">{row.subcategory}</td>
                  <td className="p-4">
                    <Badge variant={row.mapped ? 'success' : 'neutral'} className="text-[10px]">
                      {row.mapped ? 'MAPPED' : 'DISABLED'}
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
`);

// 7. Part 3: Excel Taxonomy Import Wizard 8-stages (app/admin/taxonomy/import-export/page.tsx)
writeFile('app/admin/taxonomy/import-export/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  History,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function TaxonomyImportWizardPage() {
  const [stage, setStage] = useState(1);
  const [fileName, setFileName] = useState('xpo_industrial_taxonomy_v4.xlsx');
  const [totalRows, setTotalRows] = useState(48);
  const [conflictStrategy, setConflictStrategy] = useState('update_existing');
  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/taxonomy/import')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.versions) {
          setVersions(res.data.versions);
        }
      });
  }, []);

  const sampleRows = [
    { row: 1, type: 'Buy', sector: 'Manufacturing', cat: 'Machining Components', sub: 'Precision CNC Machining', status: 'valid' },
    { row: 2, type: 'Buy', sector: 'Manufacturing', cat: 'Machining Components', sub: 'Heavy Sheet Metal Fabrication', status: 'valid' },
    { row: 3, type: 'Sell', sector: 'Raw Materials', cat: 'Polymers & Resins', sub: 'Polypropylene Granules', status: 'duplicate' },
    { row: 4, type: 'Partner', sector: 'IT Services', cat: 'Custom Software', sub: 'Cloud DevOps Consulting', status: 'valid' },
    { row: 5, type: 'Invalid', sector: 'Missing Sector', cat: 'N/A', sub: '', status: 'invalid' },
  ];

  const handlePublish = async () => {
    setPublishing(true);
    const res = await fetch('/api/taxonomy/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', rows: sampleRows, conflictMode: conflictStrategy })
    });
    const data = await res.json();
    if (data.success) {
      setPublishedVersion(data.version);
      setStage(7); // Jump to Result Summary
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Excel Taxonomy Import Centre</h1>
          <p className="text-xs text-[#717171] mt-0.5">8-Stage atomic classification importer with duplicate detection and version rollback.</p>
        </div>
        <Badge variant="outline" className="text-xs font-bold border-red-200 text-[#E8192C] bg-red-50">
          Stage {stage} of 8
        </Badge>
      </div>

      {/* STAGE 1: LANDING & TEMPLATE DOWNLOAD */}
      {stage === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#222222]">1. Download Master Template</h3>
                <p className="text-xs text-[#717171]">
                  Pre-formatted Excel sheet with column definitions for Lead Type, Sector, Category, Subcategory, Description, and Tags.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent = "Lead_Type,Sector_Code,Sector_Name,Category_Code,Category_Name,Subcategory_Code,Subcategory_Name,Tags\\nBuy,MFG,Manufacturing,CAT_CNC,Machining,SUB_CNC,Precision CNC Machining,CNC|Milling|Aerospace\\n";
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'xpo-taxonomy-template.csv';
                  a.click();
                }}
                className="w-full text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download XLSX Template (.xlsx)
              </Button>
            </Card>

            <Card className="p-6 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/20 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E8192C] text-white flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#222222]">2. Upload Populated Spreadsheet</h3>
                <p className="text-xs text-[#717171]">
                  Select your updated taxonomy spreadsheet to launch the automated validation and preview engine.
                </p>
              </div>
              <Button
                onClick={() => setStage(2)}
                className="w-full bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                Upload File & Proceed <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE 2: DRAG & DROP UPLOAD */}
      {stage === 2 && (
        <Card className="p-10 rounded-2xl border-2 border-dashed border-[#EBEBEB] bg-white text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#222222]">Ready to inspect {fileName}</h3>
            <p className="text-xs text-[#717171] mt-1">48 rows detected across 5 classification levels.</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(1)}>Back</Button>
            <Button size="sm" onClick={() => setStage(3)} className="bg-[#E8192C] text-white">
              Continue to Column Mapping <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 3: COLUMN MAPPING */}
      {stage === 3 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div>
            <h3 className="text-base font-black text-[#222222]">Stage 3: Column Mapping</h3>
            <p className="text-xs text-[#717171]">Match Excel sheet headers with XPO India taxonomy database schema.</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { excel: 'Lead_Type', db: 'Commercial Intent Code', status: 'Matched' },
              { excel: 'Sector_Code', db: 'Sector Code (Tier-1)', status: 'Matched' },
              { excel: 'Sector_Name', db: 'Sector Name', status: 'Matched' },
              { excel: 'Category_Name', db: 'Category Vertical (Tier-2)', status: 'Matched' },
              { excel: 'Subcategory_Name', db: 'Subcategory Speciality (Tier-3)', status: 'Matched' },
              { excel: 'Tags', db: 'Search Keywords / Specifications', status: 'Matched' },
            ].map((col, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
                <div className="font-mono font-bold text-[#222222]">{col.excel}</div>
                <ArrowRight className="w-3.5 h-3.5 text-[#717171]" />
                <div className="font-semibold text-[#555555]">{col.db}</div>
                <Badge variant="success" className="text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {col.status}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(2)}>Back</Button>
            <Button size="sm" onClick={() => setStage(4)} className="bg-[#E8192C] text-white">
              Generate Data Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 4: DATA PREVIEW WITH COLOR HIGHLIGHTING */}
      {stage === 4 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#222222]">Stage 4: Data Validation Preview</h3>
              <p className="text-xs text-[#717171]">Rows color-coded by integrity check: Valid (Green), Duplicate (Amber), Invalid (Red).</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">44 Valid</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">3 Duplicates</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">1 Invalid</span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subcategory</th>
                  <th className="p-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {sampleRows.map(r => (
                  <tr key={r.row} className={r.status === 'invalid' ? 'bg-rose-50/60' : r.status === 'duplicate' ? 'bg-amber-50/60' : 'bg-emerald-50/30'}>
                    <td className="p-3 font-mono font-bold">{r.row}</td>
                    <td className="p-3 font-bold">{r.type}</td>
                    <td className="p-3">{r.sector}</td>
                    <td className="p-3">{r.cat}</td>
                    <td className="p-3">{r.sub}</td>
                    <td className="p-3">
                      {r.status === 'valid' && <Badge variant="success" className="text-[10px]">Valid</Badge>}
                      {r.status === 'duplicate' && <Badge variant="warning" className="text-[10px]">Duplicate Code</Badge>}
                      {r.status === 'invalid' && <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-300">Invalid Field</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(3)}>Back</Button>
            <Button size="sm" onClick={() => setStage(5)} className="bg-[#E8192C] text-white">
              Set Conflict Resolution <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 5: CONFLICT RESOLUTION */}
      {stage === 5 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div>
            <h3 className="text-base font-black text-[#222222]">Stage 5: Conflict Resolution Strategy</h3>
            <p className="text-xs text-[#717171]">Determine how duplicate or conflicting codes are treated during database ingestion.</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { id: 'update_existing', title: 'Update Existing Classifications (Recommended)', desc: 'Overwrite matching codes with new names, descriptions, and tags.' },
              { id: 'skip_duplicate', title: 'Skip Duplicates', desc: 'Preserve existing live classifications and only append entirely new codes.' },
              { id: 'reject_invalid', title: 'Strict Atomic Check (Reject if Any Invalid)', desc: 'Fail entire batch if a single invalid row or formatting error exists.' },
            ].map(strategy => (
              <label
                key={strategy.id}
                onClick={() => setConflictStrategy(strategy.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  conflictStrategy === strategy.id ? 'border-[#E8192C] bg-red-50/30' : 'border-[#EBEBEB] hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="conflict"
                  checked={conflictStrategy === strategy.id}
                  onChange={() => setConflictStrategy(strategy.id)}
                  className="mt-0.5 text-[#E8192C] focus:ring-[#E8192C]"
                />
                <div>
                  <div className="font-bold text-[#222222]">{strategy.title}</div>
                  <div className="text-[#717171] mt-0.5">{strategy.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(4)}>Back</Button>
            <Button size="sm" onClick={() => setStage(6)} className="bg-[#E8192C] text-white">
              Proceed to Final Confirmation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 6: FINAL CONFIRMATION */}
      {stage === 6 && (
        <Card className="p-8 rounded-2xl border border-[#EBEBEB] bg-white text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#222222]">Confirm Atomic Publication</h3>
            <p className="text-xs text-[#717171] mt-1 max-w-md mx-auto">
              This will create a new immutable taxonomy snapshot (v4.1.0-RELEASE) and immediately update all Creator post forms and WhatsApp matching filters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-[#EBEBEB] max-w-sm mx-auto text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#717171]">Batch File:</span>
              <span className="font-bold text-[#222222]">{fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717171]">Records to Ingest:</span>
              <span className="font-bold text-emerald-600">47 Classified Nodes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717171]">Strategy:</span>
              <span className="font-mono text-[#555555]">{conflictStrategy}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(5)}>Back</Button>
            <Button size="sm" onClick={handlePublish} isLoading={publishing} className="bg-[#E8192C] hover:bg-[#D01627] text-white">
              Confirm & Publish Taxonomy
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 7: RESULT SUMMARY */}
      {stage === 7 && (
        <Card className="p-8 rounded-2xl border border-[#EBEBEB] bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#222222]">Taxonomy Published Atomically!</h3>
            <p className="text-xs text-[#717171] mt-1">
              Version snapshot <span className="font-mono font-bold text-[#222222]">{publishedVersion?.version || 'v4.1.0-RELEASE'}</span> is now live across all web and WhatsApp channels.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(8)} className="text-xs font-semibold rounded-xl">
              <History className="w-3.5 h-3.5 mr-1" /> View Version History
            </Button>
            <Link href="/admin/taxonomy">
              <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
                Open Classification Tree
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* STAGE 8: VERSION HISTORY */}
      {stage === 8 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#222222]">Taxonomy Version History & Rollback</h3>
              <p className="text-xs text-[#717171]">Immutable point-in-time snapshots of classification databases.</p>
            </div>
            <Button size="sm" onClick={() => setStage(1)} className="bg-[#E8192C] text-white text-xs">
              + New Import
            </Button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                <tr>
                  <th className="p-3">Snapshot Version</th>
                  <th className="p-3">Imported By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">New Records</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Rollback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {versions.map((ver, idx) => (
                  <tr key={idx} className="hover:bg-[#FDFDFD]">
                    <td className="p-3 font-mono font-bold text-[#222222]">{ver.version}</td>
                    <td className="p-3 text-[#555555]">{ver.importedBy}</td>
                    <td className="p-3 text-[#717171]">{ver.date}</td>
                    <td className="p-3 font-bold text-emerald-600">+{ver.newRecords}</td>
                    <td className="p-3">
                      <Badge variant={ver.status === 'Published' ? 'success' : 'neutral'} className="text-[10px]">
                        {ver.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {idx > 0 ? (
                        <button
                          onClick={() => alert('Rollback to ' + ver.version + ' simulated successfully!')}
                          className="text-[#E8192C] font-semibold hover:underline text-xs"
                        >
                          Rollback
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">CURRENT LIVE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
`);

// 8. Version History Page (app/admin/taxonomy/history/page.tsx)
writeFile('app/admin/taxonomy/history/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TaxonomyHistoryPage() {
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/taxonomy/import')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.versions) setVersions(res.data.versions);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Taxonomy Snapshot Archive</h1>
          <p className="text-xs text-[#717171] mt-0.5">Historical rollback engine and immutable audit trail of classification releases.</p>
        </div>
        <Link href="/admin/taxonomy/import-export">
          <Button className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
            Import Excel Release
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Release Version</th>
                <th className="p-4">Imported By</th>
                <th className="p-4">Release Date</th>
                <th className="p-4">New Records</th>
                <th className="p-4">Updated</th>
                <th className="p-4">Release Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {versions.map((ver, idx) => (
                <tr key={idx} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{ver.version}</td>
                  <td className="p-4 text-[#555555]">{ver.importedBy}</td>
                  <td className="p-4 text-[#717171]">{ver.date}</td>
                  <td className="p-4 font-bold text-emerald-600">+{ver.newRecords}</td>
                  <td className="p-4 font-bold text-amber-600">~{ver.updatedRecords}</td>
                  <td className="p-4 text-[#717171] max-w-xs truncate">{ver.description}</td>
                  <td className="p-4">
                    <Badge variant={ver.status === 'Published' ? 'success' : 'neutral'} className="text-[10px]">
                      {ver.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {idx === 0 ? (
                      <span className="text-[10px] text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg">CURRENT LIVE</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Rollback to snapshot ' + ver.version + ' triggered!')}
                        className="text-[11px] h-7 text-[#E8192C] border-red-200 hover:bg-red-50"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Rollback
                      </Button>
                    )}
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
`);

// 9. Part 4: Dynamic Form Builder (app/admin/taxonomy/form-builder/page.tsx)
writeFile('app/admin/taxonomy/form-builder/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Eye,
  Save,
  CheckCircle2,
  Smartphone,
  Globe,
  Settings2,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  List,
  CheckSquare,
  Paperclip,
  Image,
  Link2,
  ToggleLeft,
  ChevronDown
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  key: string;
  type: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  order: number;
}

export default function FormBuilderPage() {
  const [selectedClassification, setSelectedClassification] = useState('manufacturing-industrial');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'web' | 'whatsapp'>('web');

  const availableFieldTypes = [
    { type: 'text', label: 'Short Text', icon: Type },
    { type: 'textarea', label: 'Long Description', icon: AlignLeft },
    { type: 'number', label: 'Numeric Quantity', icon: Hash },
    { type: 'currency', label: 'Budget / Currency', icon: DollarSign },
    { type: 'date', label: 'Target Date', icon: Calendar },
    { type: 'dropdown', label: 'Single Select Dropdown', icon: List },
    { type: 'checkbox', label: 'Multi Checkbox', icon: CheckSquare },
    { type: 'file', label: 'Technical Document / CAD', icon: Paperclip },
    { type: 'image', label: 'Part Reference Image', icon: Image },
    { type: 'url', label: 'External Spec URL', icon: Link2 },
  ];

  useEffect(() => {
    fetch('/api/taxonomy/form-builder?classificationCode=' + selectedClassification)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFields(res.data.fields || []);
          if (res.data.fields?.length > 0) {
            setSelectedFieldId(res.data.fields[0].id);
          }
        }
      });
  }, [selectedClassification]);

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: 'fld_' + Date.now(),
      label: 'New ' + fieldType.charAt(0).toUpperCase() + fieldType.slice(1) + ' Field',
      key: 'field_' + Date.now().toString(36),
      type: fieldType,
      placeholder: 'Enter details...',
      description: 'Specifications required for this classification.',
      required: true,
      order: fields.length + 1
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    const next = fields.filter(f => f.id !== id);
    setFields(next);
    if (selectedFieldId === id) {
      setSelectedFieldId(next[0]?.id || null);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const updateSelectedField = (patch: Partial<FormField>) => {
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, ...patch } : f));
  };

  const handlePublish = async () => {
    setSaving(true);
    const res = await fetch('/api/taxonomy/form-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classificationCode: selectedClassification,
        fields,
        leadTypeCode: 'buy'
      })
    });
    const data = await res.json();
    if (data.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#EBEBEB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Classification Schema</div>
            <select
              value={selectedClassification}
              onChange={e => setSelectedClassification(e.target.value)}
              className="text-sm font-black text-[#222222] bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="manufacturing-industrial">Manufacturing & Industrial</option>
              <option value="cnc-machining">Precision CNC Machining</option>
              <option value="sheet-metal">Heavy Sheet Metal Fabrication</option>
              <option value="polymers-resins">Industrial Polymers & Resins</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#717171]" /> Dual Preview
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={saving}
            className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 px-4"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Published!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Publish Schema
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 3-Column Visual Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Field Library */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white space-y-3">
            <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB]">
              Field Library (Click to Add)
            </div>
            <div className="space-y-1.5">
              {availableFieldTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => addField(item.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#555555] hover:text-[#222222] hover:bg-neutral-50 border border-transparent hover:border-[#EBEBEB] transition-all text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#E8192C]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Centre Column: Interactive Form Canvas */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white min-h-[550px] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EBEBEB]">
                <div className="font-bold text-xs text-[#222222]">Form Canvas ({fields.length} Custom Fields)</div>
                <span className="text-[10px] text-[#717171]">Click field to inspect & edit</span>
              </div>

              {fields.length === 0 ? (
                <div className="py-12 text-center text-[#717171] text-xs">
                  No custom fields defined. Click any item from the left library to add.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((field, idx) => {
                    const isSelected = selectedFieldId === field.id;
                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#E8192C] bg-red-50/20 shadow-sm'
                            : 'border-[#EBEBEB] bg-[#FCFCFC] hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
                            <span>{field.label}</span>
                            {field.required && <span className="text-[#E8192C] font-bold">*</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 text-[#555555] font-mono uppercase">
                              {field.type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="text-neutral-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-[#717171] mt-1 italic">
                          Placeholder: &quot;{field.placeholder}&quot;
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Field Property Inspector */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white min-h-[550px]">
            {selectedField ? (
              <div className="space-y-4 text-xs">
                <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB] flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-[#E8192C]" /> Property Inspector
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={e => updateSelectedField({ label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Database Key
                  </label>
                  <input
                    type="text"
                    value={selectedField.key}
                    onChange={e => updateSelectedField({ key: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={e => updateSelectedField({ placeholder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Help Description
                  </label>
                  <textarea
                    rows={2}
                    value={selectedField.description || ''}
                    onChange={e => updateSelectedField({ description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
                  <span className="font-bold text-[#222222]">Mandatory Requirement</span>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={e => updateSelectedField({ required: e.target.checked })}
                    className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C]"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#717171] text-xs">
                Select a field on the canvas to configure properties.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* DUAL PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-[#EBEBEB] shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={previewMode === 'web' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('web')}
                  className={`text-xs font-semibold rounded-xl ${previewMode === 'web' ? 'bg-[#E8192C] text-white' : ''}`}
                >
                  <Globe className="w-3.5 h-3.5 mr-1" /> Creator Web Form
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('whatsapp')}
                  className={`text-xs font-semibold rounded-xl ${previewMode === 'whatsapp' ? 'bg-emerald-600 text-white' : ''}`}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" /> WhatsApp Flow
                </Button>
              </div>

              <button onClick={() => setPreviewModalOpen(false)} className="text-[#717171] hover:text-[#222222] font-bold text-sm">
                ✕
              </button>
            </div>

            {/* PREVIEW CONTENT */}
            <div className="flex-1 overflow-y-auto pr-1">
              {previewMode === 'web' ? (
                <div className="p-6 rounded-2xl bg-neutral-50 border border-[#EBEBEB] space-y-4 text-xs">
                  <div className="font-black text-sm text-[#222222]">Post Lead: Custom Specifications</div>
                  {fields.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <label className="font-bold text-[#333333] block">
                        {f.label} {f.required && <span className="text-[#E8192C]">*</span>}
                      </label>
                      <input
                        disabled
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EBEBEB] text-[#717171]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-sm mx-auto p-4 rounded-3xl bg-[#EFEAE2] border border-[#DDD5C7] space-y-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-xs space-y-1">
                    <div className="font-bold text-emerald-800">XPO Lead Specification Flow</div>
                    <div className="text-[11px] text-[#555555]">Please reply with the following details for your requirement:</div>
                  </div>
                  {fields.map((f, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-xl shadow-xs text-xs space-y-0.5">
                      <div className="font-bold text-[#222222]">Step {i + 1}: {f.label}</div>
                      <div className="text-[10px] text-[#717171]">{f.placeholder}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EBEBEB] flex justify-end">
              <Button size="sm" onClick={() => setPreviewModalOpen(false)} className="bg-neutral-900 text-white text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

console.log('All Taxonomy pages created successfully!');
