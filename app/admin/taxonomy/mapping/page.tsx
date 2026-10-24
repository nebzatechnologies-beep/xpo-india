'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2 } from 'lucide-react';

interface MappingItem {
  leadType: string;
  sector: string;
  category: string;
  subcategory: string;
  mapped: boolean;
}

export default function CategoryMappingPage() {
  const [saved, setSaved] = useState(false);
  const [matrix, setMatrix] = useState<MappingItem[]>([
    { leadType: 'Buy / Procurement', sector: 'Manufacturing & Industrial', category: 'Machining & CNC Components', subcategory: 'Precision CNC Machining', mapped: true },
    { leadType: 'Buy / Procurement', sector: 'Manufacturing & Industrial', category: 'Machining & CNC Components', subcategory: 'Heavy Sheet Metal Fabrication', mapped: true },
    { leadType: 'Sell / Excess Stock', sector: 'Raw Materials & Chemicals', category: 'Industrial Polymers & Resins', subcategory: 'Polypropylene & HDPE Granules', mapped: true },
    { leadType: 'Distributor / Agency', sector: 'Textiles & Apparel', category: 'Fabrics & Yarn', subcategory: 'Organic Cotton & Combed Yarn', mapped: true },
    { leadType: 'Contract Work', sector: 'Information Technology', category: 'Custom Software & Cloud', subcategory: 'Full-Stack Web & Mobile Engineering', mapped: true },
    { leadType: 'Partnership / JV', sector: 'Construction & Real Estate', category: 'Commercial EPC & Infra', subcategory: 'Structural Steel & Precast Works', mapped: false },
  ]);

  const toggleCheck = (index: number) => {
    const next = [...matrix];
    next[index].mapped = !next[index].mapped;
    setMatrix(next);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Category Mapping Matrix</h1>
          <p className="text-xs text-[#717171] mt-0.5">Cross-classification permissions linking commercial intents to allowable industrial verticals.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Matrix Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Mapping Matrix</>}
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4 w-12 text-center">Active</th>
                <th className="p-4">Commercial Intent (Lead Type)</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Category</th>
                <th className="p-4">Subcategory Allowed</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FDFDFD]">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.mapped}
                      onChange={() => toggleCheck(idx)}
                      className="w-4 h-4 rounded text-[#E8192C] focus:ring-[#E8192C]"
                    />
                  </td>
                  <td className="p-4 font-bold text-[#222222]">{row.leadType}</td>
                  <td className="p-4 text-[#555555] font-semibold">{row.sector}</td>
                  <td className="p-4 text-[#555555]">{row.category}</td>
                  <td className="p-4 font-bold text-[#222222]">{row.subcategory}</td>
                  <td className="p-4">
                    <Badge variant={row.mapped ? 'success' : 'neutral'} className="text-[10px]">
                      {row.mapped ? 'MAPPED' : 'DISABLED'}
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
