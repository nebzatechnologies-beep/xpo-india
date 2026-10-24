'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadCloud } from 'lucide-react';

export default function ImportHistoryPage() {
  const history = [
    { id: 'IMP_1001', type: 'Taxonomy Master', file: 'xpo_industrial_taxonomy_v4.xlsx', records: 48, status: 'Completed', by: 'Super Admin', date: '28 Sep 2026, 14:00' },
    { id: 'IMP_1002', type: 'Companies CRM', file: 'pune_industrial_companies.xlsx', records: 120, status: 'Completed', by: 'Super Admin', date: '28 Sep 2026, 12:30' },
    { id: 'IMP_1003', type: 'Skills & Tags', file: 'aerospace_machining_tags.csv', records: 36, status: 'Completed', by: 'Super Admin', date: '27 Sep 2026, 16:45' },
    { id: 'IMP_1004', type: 'Form Fields', file: 'mfg_specification_fields.csv', records: 14, status: 'Completed', by: 'Super Admin', date: '26 Sep 2026, 11:20' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Import Audit History</h1>
        <p className="text-xs text-[#717171] mt-0.5">Comprehensive audit trail of all spreadsheet and CSV batch operations.</p>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Import Type</th>
                <th className="p-4">Source File</th>
                <th className="p-4">Records Ingested</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-[#222222]">{row.id}</td>
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#E8192C]" />
                    {row.type}
                  </td>
                  <td className="p-4 font-mono text-[#555555]">{row.file}</td>
                  <td className="p-4 font-bold text-emerald-600">+{row.records}</td>
                  <td className="p-4 text-[#555555]">{row.by}</td>
                  <td className="p-4 text-[#717171]">{row.date}</td>
                  <td className="p-4">
                    <Badge variant="success" className="text-[10px]">
                      {row.status}
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
