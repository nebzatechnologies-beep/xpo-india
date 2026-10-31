'use client';

import React, { useEffect, useState } from 'react';
import type { ImportJob } from '@/lib/types/domain';
import { Download } from 'lucide-react';

export default function AdminImportHistoryPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [crmRes, taxRes] = await Promise.all([
          fetch('/api/crm/import'),
          fetch('/api/taxonomy/import'),
        ]);
        const list: ImportJob[] = [];
        if (crmRes.ok) {
          const d = await crmRes.json();
          list.push(...(d.jobs || []));
        }
        if (taxRes.ok) {
          const d = await taxRes.json();
          list.push(...(d.jobs || []));
        }
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setJobs(list);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          Excel Import Job History & Error Reports
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Inspect staged, processing, and completed CRM & Taxonomy import jobs with downloadable
          row-level error CSVs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        {loading ? (
          <p className="text-xs text-[#6B7280]">Loading import jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No import jobs executed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2">File</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Rows</th>
                  <th className="py-2">Created / Updated / Rejected</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Error Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="py-2.5 font-bold">{j.fileName}</td>
                    <td className="py-2.5 uppercase">{j.type}</td>
                    <td className="py-2.5">{j.totalRows}</td>
                    <td className="py-2.5">
                      +{j.createdCount} / ~{j.updatedCount} / !{j.rejectedCount}
                    </td>
                    <td className="py-2.5 capitalize font-semibold">{j.status.replace('_', ' ')}</td>
                    <td className="py-2.5">
                      {j.rejectedCount > 0 ? (
                        <a
                          href={`/api/imports/${j.id}?download=errors`}
                          className="inline-flex items-center gap-1 text-red-600 font-bold hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> CSV
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF]">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
