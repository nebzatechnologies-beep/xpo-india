'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';

export default function OutreachHistoryPage() {
  const history = [
    { target: 'Apex Precision Engineering Ltd', channel: 'WhatsApp Cloud API', template: 'xpo_lead_match_alert', sentBy: 'System Automation', status: 'Delivered', time: '10 mins ago' },
    { target: 'Patel Precision Manufacturing', channel: 'WhatsApp Cloud API', template: 'xpo_direct_platform_invitation', sentBy: 'Super Admin', status: 'Read', time: '1 hour ago' },
    { target: 'Kaveri Polymers Private Limited', channel: 'Direct Manual WhatsApp', template: 'Custom Opportunity Message', sentBy: 'Super Admin', status: 'Sent', time: '3 hours ago' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Outreach Timeline & Logs</h1>
        <p className="text-xs text-[#717171] mt-0.5">Chronological record of all outbound WhatsApp and platform messages sent to corporate prospects.</p>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Target Company</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Template / Payload</th>
                <th className="p-4">Dispatched By</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {history.map((h, i) => (
                <tr key={i} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-bold text-[#222222]">{h.target}</td>
                  <td className="p-4 text-[#555555] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> {h.channel}
                  </td>
                  <td className="p-4 font-mono text-[#717171]">{h.template}</td>
                  <td className="p-4 text-[#555555]">{h.sentBy}</td>
                  <td className="p-4 text-[#717171]">{h.time}</td>
                  <td className="p-4 text-right">
                    <Badge variant="success" className="text-[10px]">
                      {h.status}
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
