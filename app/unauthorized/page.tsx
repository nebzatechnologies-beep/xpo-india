'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, ArrowRight, Sparkles, Home, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSwitch = async (role: 'superadmin' | 'lead_creator' | 'lead_absorber' | 'logout') => {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E8192C] shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Access Restricted</h1>
          <p className="mt-2 text-sm text-[#717171] leading-relaxed">
            Your current account does not have authorization to view this area. You can switch to the required demo role below in 1-click.
          </p>
        </div>

        <Card className="p-6 rounded-3xl border border-[#EBEBEB] bg-white shadow-xl space-y-3 text-left">
          <div className="text-xs font-bold text-[#222222] uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[#E8192C]">
            <Sparkles className="w-3.5 h-3.5" /> 1-Click Role Switch
          </div>

          <button
            type="button"
            onClick={() => handleSwitch('superadmin')}
            className="w-full p-3 rounded-2xl border border-[#EBEBEB] hover:border-purple-300 hover:bg-purple-50/50 flex items-center justify-between text-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">👑</span>
              <div>
                <div className="font-bold text-[#222222] group-hover:text-purple-900">Switch to Superadmin</div>
                <div className="text-[10px] text-[#717171]">Access Admin Suite, Ledgers & Taxonomy</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#717171] group-hover:text-purple-700" />
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('lead_creator')}
            className="w-full p-3 rounded-2xl border border-[#EBEBEB] hover:border-red-300 hover:bg-red-50/50 flex items-center justify-between text-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-red-100 text-[#E8192C] flex items-center justify-center font-bold text-sm">📋</span>
              <div>
                <div className="font-bold text-[#222222] group-hover:text-[#E8192C]">Switch to Lead Creator</div>
                <div className="text-[10px] text-[#717171]">Post demands & review incoming supplier quotes</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#717171] group-hover:text-[#E8192C]" />
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('lead_absorber')}
            className="w-full p-3 rounded-2xl border border-[#EBEBEB] hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between text-xs transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">⚡</span>
              <div>
                <div className="font-bold text-[#222222] group-hover:text-blue-900">Switch to Lead Absorber</div>
                <div className="text-[10px] text-[#717171]">Discover buyer requirements & submit quotes</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#717171] group-hover:text-blue-700" />
          </button>
        </Card>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/" className="text-[#717171] hover:text-[#222222] font-semibold flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span className="text-[#EBEBEB]">•</span>
          <button
            onClick={() => handleSwitch('logout')}
            className="text-red-600 hover:underline font-semibold flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
