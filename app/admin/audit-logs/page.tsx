'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { AuditLogEntry } from '@/lib/services/audit';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const q = moduleFilter ? `?module=${encodeURIComponent(moduleFilter)}` : '';
      const res = await fetch(`/api/admin/audit-logs${q}`);
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Immutable Governance Audit Logs</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Append-only server audit trail across Taxonomy, CRM, WhatsApp, Billing, Moderation, and
            DPDP actions.
          </p>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold"
        >
          <option value="">All Modules</option>
          <option value="taxonomy">Taxonomy</option>
          <option value="crm">CRM & Consent</option>
          <option value="imports">Excel Imports</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="leads">Requirements & Leads</option>
          <option value="agent">AI Agent</option>
          <option value="users">Users & Quotas</option>
          <option value="verification">KYC & Trust</option>
          <option value="subscriptions">Subscriptions & Billing</option>
          <option value="campaigns">Campaigns</option>
          <option value="settings">Platform Settings</option>
          <option value="privacy">DPDP Privacy</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        {loading ? (
          <p className="text-xs text-[#6B7280]">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No audit log entries recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Actor</th>
                  <th className="py-2">Module</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-semibold">{l.actorName}</td>
                    <td className="py-2.5 uppercase text-[#E8192C] font-bold">{l.module}</td>
                    <td className="py-2.5 font-mono">{l.action}</td>
                    <td className="py-2.5 text-[#374151]">{l.summary}</td>
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
