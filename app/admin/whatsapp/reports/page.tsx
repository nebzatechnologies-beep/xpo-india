'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export default function WhatsAppReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Delivery Reports & Channel Analytics</h1>
        <p className="text-xs text-[#717171] mt-0.5">Aggregate performance metrics, delivery rates, and ROI across Meta WhatsApp Cloud API dispatches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-2 shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase">Aggregate Delivery Rate</div>
          <div className="text-3xl font-black text-emerald-600">98.4%</div>
          <div className="text-xs text-[#717171]">12,280 of 12,480 outbound messages delivered</div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-2 shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase">Median Response Time</div>
          <div className="text-3xl font-black text-blue-600">4.2 mins</div>
          <div className="text-xs text-[#717171]">From WhatsApp dispatch to absorber quote submission</div>
        </Card>

        <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-2 shadow-none">
          <div className="text-[10px] font-bold text-[#717171] uppercase">Blended Cost per Lead Reveal</div>
          <div className="text-3xl font-black text-[#E8192C]">₹3.12</div>
          <div className="text-xs text-[#717171]">Across 3,500 active buyer requests</div>
        </Card>
      </div>
    </div>
  );
}
