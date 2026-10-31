'use client';

import React, { useEffect, useState } from 'react';
import type { AuditLogEntry } from '@/lib/services/audit';

export default function AdminTaxonomyHistoryPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/audit-logs?module=taxonomy');
        if (res.ok) {
          const d = await res.json();
          setLogs(d.logs || []);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Taxonomy Governance History</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Immutable log of all taxonomy creations, edits, duplicate merges, and workbook imports.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 divide-y divide-[#F3F4F6] text-xs">
        {loading ? (
          <p className="text-[#6B7280]">Loading taxonomy audit log...</p>
        ) : logs.length === 0 ? (
          <p className="text-[#6B7280]">No taxonomy audit entries recorded yet.</p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#111827]">{l.summary}</div>
                <div className="text-[#6B7280] mt-0.5">
                  Actor: {l.actorName} • Action: <span className="font-mono">{l.action}</span>
                </div>
              </div>
              <span className="text-[#6B7280] whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
