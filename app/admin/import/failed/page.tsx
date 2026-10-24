'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

export default function FailedRowsPage() {
  const failed = [
    { row: 18, file: 'pune_industrial_companies.xlsx', reason: 'Missing mandatory email and phone number', data: 'Company: "Shree Metal Works", Contact: "N/A"' },
    { row: 42, file: 'xpo_industrial_taxonomy_v4.xlsx', reason: 'Parent Sector Code "AERO_IND" not recognized', data: 'Code: "SUB_TURBINE", Sector: "AERO_IND"' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Failed Import Records & Error Reports</h1>
          <p className="text-xs text-[#717171] mt-0.5">Rows quarantined during ingestion due to validation failures or syntax errors.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const errCsv = 'Row,Source_File,Error_Reason,Quarantined_Data\n18,pune_industrial_companies.xlsx,Missing mandatory email,Shree Metal Works\n';
            const blob = new Blob([errCsv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'import_error_report.csv';
            a.click();
          }}
          className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Download Error Report
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Row #</th>
                <th className="p-4">File Name</th>
                <th className="p-4">Failure Reason</th>
                <th className="p-4">Quarantined Payload</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {failed.map((row, i) => (
                <tr key={i} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-mono font-bold text-rose-600">{row.row}</td>
                  <td className="p-4 font-mono text-[#555555]">{row.file}</td>
                  <td className="p-4 text-rose-700 font-semibold">{row.reason}</td>
                  <td className="p-4 font-mono text-[#717171] max-w-sm truncate">{row.data}</td>
                  <td className="p-4 text-right">
                    <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-200 bg-rose-50">
                      QUARANTINED
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
