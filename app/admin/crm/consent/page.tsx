'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export default function ConsentAuditPage() {
  const records = [
    { company: 'Sharma Heavy Engineering Ltd', contact: 'Rajesh Sharma', phone: '+91 9820011223', status: 'opted_in', source: 'Direct Lead Post', timestamp: '28 Sep 2026, 10:00' },
    { company: 'Patel Precision Manufacturing', contact: 'Anil Patel', phone: '+91 9910044556', status: 'opted_in', source: 'Platform Registration', timestamp: '28 Sep 2026, 10:30' },
    { company: 'Global Sourcing Inc', contact: 'David Miller', phone: '+1 415 555 2671', status: 'opted_in', source: 'Direct WhatsApp Inbound', timestamp: '28 Sep 2026, 11:15' },
    { company: 'Legacy Foundry Works', contact: 'K. Raman', phone: '+91 9840099881', status: 'opted_out', source: 'WhatsApp Reply STOP', timestamp: '27 Sep 2026, 16:20' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Digital Consent & Opt-In Audit Log</h1>
        <p className="text-xs text-[#717171] mt-0.5">Compliant audit trail maintaining verified opt-ins and instant opt-out requests for TRAI and GDPR compliance.</p>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Phone / WhatsApp</th>
                <th className="p-4">Acquisition Channel</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Consent Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {records.map((r, i) => (
                <tr key={i} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-bold text-[#222222]">{r.company}</td>
                  <td className="p-4 text-[#555555]">{r.contact}</td>
                  <td className="p-4 font-mono text-[#555555]">{r.phone}</td>
                  <td className="p-4 text-[#717171]">{r.source}</td>
                  <td className="p-4 text-[#717171]">{r.timestamp}</td>
                  <td className="p-4 text-right">
                    <Badge variant={r.status === 'opted_in' ? 'success' : 'neutral'} className="text-[10px]">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {r.status === 'opted_in' ? 'VERIFIED OPT-IN' : 'OPTED-OUT'}
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
