'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, CheckCircle2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ImportTagsPage() {
  const [success, setSuccess] = useState(false);

  const handleSimulate = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">Import Skills & Specifications Tags</h1>
        <p className="text-xs text-[#717171] mt-0.5">Bulk upload comma-separated keywords and ISO standards mapped to subcategories.</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" /> 36 new tags imported and mapped to subcategories!
        </div>
      )}

      <Card className="p-8 rounded-2xl border-2 border-dashed border-[#EBEBEB] bg-white text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center mx-auto">
          <Tag className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#222222]">Upload Tags CSV / TXT</h3>
          <p className="text-xs text-[#717171] mt-1">Columns: Tag_Name, Subcategory_Code, Category_Code</p>
        </div>
        <div className="flex justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = 'Tag_Name,Subcategory_Code,Category_Code\nCNC Milling,SUB_CNC,CAT_MFG_IND\n5-Axis Turning,SUB_CNC,CAT_MFG_IND\n';
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'tags_template.csv';
              a.click();
            }}
            className="text-xs font-semibold rounded-xl"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Download CSV Sample
          </Button>
          <Button size="sm" onClick={handleSimulate} className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
            Upload & Ingest Tags
          </Button>
        </div>
      </Card>

      <div className="text-right">
        <Link href="/admin/taxonomy/tags" className="text-xs font-bold text-[#E8192C] hover:underline inline-flex items-center gap-1">
          View Skills & Tags Registry <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
