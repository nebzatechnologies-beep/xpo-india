'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function ConvertedAccountsPage() {
  const accounts = [
    { company: 'Sharma Heavy Engineering Ltd', email: 'creator@xpoindia.com', role: 'Lead Creator', plan: 'Lead Creator Annual (India)', leadsPosted: 4, spend: '₹999/yr', convertedOn: '28 Sep 2026' },
    { company: 'Patel Precision Manufacturing & Tech', email: 'absorber@xpoindia.com', role: 'Lead Absorber', plan: 'Lead Absorber Annual (India)', proposals: 1, spend: '₹999/yr', convertedOn: '28 Sep 2026' },
    { company: 'Global Sourcing Inc', email: 'david@apexsourcing.com', role: 'Lead Absorber', plan: 'Lead Absorber Annual (Global)', proposals: 2, spend: '$49/yr', convertedOn: '28 Sep 2026' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Converted Platform Accounts</h1>
        <p className="text-xs text-[#717171] mt-0.5">Corporate prospects successfully onboarded into paying Lead Creators and Lead Absorbers.</p>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Company Name</th>
                <th className="p-4">Platform User</th>
                <th className="p-4">Registered Role</th>
                <th className="p-4">Active Subscription</th>
                <th className="p-4">Financial Ledger</th>
                <th className="p-4">Converted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {accounts.map((a, i) => (
                <tr key={i} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 font-bold text-[#222222] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    {a.company}
                  </td>
                  <td className="p-4 font-mono text-[#555555]">{a.email}</td>
                  <td className="p-4">
                    <Badge variant={a.role === 'Lead Creator' ? 'primary' : 'warning'} className="text-[10px]">
                      {a.role}
                    </Badge>
                  </td>
                  <td className="p-4 font-semibold text-[#222222]">{a.plan}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600">{a.spend}</td>
                  <td className="p-4 text-[#717171]">{a.convertedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
