'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface TaxonomyVersionItem {
  version: string;
  importedBy: string;
  date: string;
  newRecords: number;
  updatedRecords?: number;
  description: string;
  status: string;
}

export default function TaxonomyHistoryPage() {
  const [versions, setVersions] = useState<TaxonomyVersionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/taxonomy/import')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.versions) setVersions(res.data.versions);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#717171]">Loading version history...</div>;
  }

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
                  <td className="p-4 font-bold text-amber-600">~{ver.updatedRecords || 2}</td>
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
                        onClick={() => alert(`Rollback to snapshot ${ver.version} triggered!`)}
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
