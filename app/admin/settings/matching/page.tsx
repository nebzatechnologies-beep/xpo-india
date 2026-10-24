'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Save, Sliders, ShieldCheck } from 'lucide-react';

export default function MatchingSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    exactSubcategoryMatch: true,
    categoryLevelFallback: true,
    sectorBroadMatch: false,
    requireLocationMatch: true,
    instantWhatsAppDispatch: true,
    absorberProposalCapPerLead: 25,
    minLeadBudgetInr: 50000,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Category Matching Engine Settings</h1>
          <p className="text-xs text-[#717171] mt-0.5">Define multi-tier matching algorithms connecting buyer requirements to absorber provider pools.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Parameters</>}
        </Button>
      </div>

      <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-6">
        <div className="font-bold text-sm text-[#222222] pb-2 border-b border-[#EBEBEB] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#E8192C]" /> Matching Algorithm Sensitivity
        </div>

        <div className="space-y-4 text-xs">
          <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#EBEBEB] hover:bg-neutral-50 cursor-pointer">
            <div>
              <div className="font-bold text-[#222222]">Tier 1: Exact Subcategory & Tag Match (Highest Priority)</div>
              <div className="text-[#717171] mt-0.5">Directly notify absorbers whose verified capabilities match the exact subcategory code.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.exactSubcategoryMatch}
              onChange={e => setSettings({ ...settings, exactSubcategoryMatch: e.target.checked })}
              className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#EBEBEB] hover:bg-neutral-50 cursor-pointer">
            <div>
              <div className="font-bold text-[#222222]">Tier 2: Category-Level Fallback Match</div>
              <div className="text-[#717171] mt-0.5">Broadcast to absorbers in the parent category if fewer than 5 quotes are received within 4 hours.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.categoryLevelFallback}
              onChange={e => setSettings({ ...settings, categoryLevelFallback: e.target.checked })}
              className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#EBEBEB] hover:bg-neutral-50 cursor-pointer">
            <div>
              <div className="font-bold text-[#222222]">Tier 3: Sector-Wide Broad Opportunity Match</div>
              <div className="text-[#717171] mt-0.5">Include in weekly digest across all providers registered under the top-level sector.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.sectorBroadMatch}
              onChange={e => setSettings({ ...settings, sectorBroadMatch: e.target.checked })}
              className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C] mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-3.5 rounded-xl border border-[#EBEBEB] hover:bg-neutral-50 cursor-pointer">
            <div>
              <div className="font-bold text-[#222222]">Automated WhatsApp Notification Trigger</div>
              <div className="text-[#717171] mt-0.5">Immediately dispatch Meta WABA notification to subscribed absorbers when a lead is approved.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.instantWhatsAppDispatch}
              onChange={e => setSettings({ ...settings, instantWhatsAppDispatch: e.target.checked })}
              className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C] mt-1"
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
