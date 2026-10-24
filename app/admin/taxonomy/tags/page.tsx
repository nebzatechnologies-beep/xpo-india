'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, GitMerge, CheckCircle2 } from 'lucide-react';

interface TagItem {
  name: string;
  subcategoryCode: string;
  categoryCode: string;
  usageCount: number;
  status: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceTag, setSourceTag] = useState('');
  const [targetTag, setTargetTag] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/taxonomy/tags')
      .then(res => res.json())
      .then(res => {
        if (res.success) setTags(res.data);
      })
      .finally(() => setLoading(false));
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

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading skills & tags...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Skills & Tags Registry</h1>
          <p className="text-xs text-[#717171] mt-0.5">Granular keywords and machine specifications mapped to subcategories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setMergeModalOpen(true)} variant="outline" size="sm" className="text-xs font-semibold rounded-xl flex items-center gap-1.5 border-[#EBEBEB]">
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
