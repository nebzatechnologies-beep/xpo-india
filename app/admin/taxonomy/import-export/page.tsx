'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Download,
  History,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface TaxonomyVersionItem {
  version: string;
  importedBy: string;
  date: string;
  newRecords: number;
  updatedRecords?: number;
  status: string;
  description: string;
}

export default function TaxonomyImportWizardPage() {
  const [stage, setStage] = useState(1);
  const [fileName, setFileName] = useState('xpo_industrial_taxonomy_v4.xlsx');
  const [sheetNames, setSheetNames] = useState<string[]>(['Master_Taxonomy']);
  const [selectedSheet, setSelectedSheet] = useState<string>('Master_Taxonomy');
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([
    'Sector',
    'Category',
    'Subcategory',
    'Tags',
  ]);
  const [columnMap, setColumnMap] = useState<{
    sector: string;
    category: string;
    subcategory: string;
    tags: string;
  }>({
    sector: 'Sector',
    category: 'Category',
    subcategory: 'Subcategory',
    tags: 'Tags',
  });
  const [rawSheetRows, setRawSheetRows] = useState<Record<string, any>[]>([
    { Sector: 'Technology', Category: 'Software Development', Subcategory: 'Website Development', Tags: 'React, Firebase' },
    { Sector: 'Manufacturing', Category: 'Metal Fabrication', Subcategory: 'CNC Machining', Tags: 'Milling, Turning' },
    { Sector: 'Design', Category: 'Product Design', Subcategory: 'Industrial Design', Tags: 'CAD, Prototyping' },
    { Sector: 'Recruitment', Category: 'Information Technology', Subcategory: 'Software Engineers', Tags: 'Frontend, Backend' },
    { Sector: 'Manufacturing', Category: 'metal fabrication', Subcategory: 'cnc machining', Tags: '5-Axis, Aerospace' },
    { Sector: '', Category: 'Missing Sector Row', Subcategory: '', Tags: '' },
  ]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState('update_existing');
  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<TaxonomyVersionItem | null>(null);
  const [versions, setVersions] = useState<TaxonomyVersionItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/taxonomy/import')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.versions) {
          setVersions(res.data.versions);
        }
      });
  }, []);

  const parseSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
    setRawSheetRows(json);
    if (json.length > 0) {
      const headers = Object.keys(json[0]);
      setDetectedHeaders(headers);
      const findHeader = (candidates: string[]) =>
        headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c))) || headers[0] || '';
      setColumnMap({
        sector: findHeader(['sector', 'industry', 'vertical']),
        category: findHeader(['category', 'cat']),
        subcategory: findHeader(['subcategory', 'sub_category', 'sub']),
        tags: findHeader(['tag', 'skill', 'keyword']),
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      setWorkbookRef(wb);
      setSheetNames(wb.SheetNames);
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);
      parseSheetData(wb, firstSheet);
      setStage(2);
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectWorksheet = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbookRef) {
      parseSheetData(workbookRef, sheet);
    }
  };

  const handleGeneratePreview = async () => {
    const mapped = rawSheetRows.map((r) => ({
      sector: r[columnMap.sector] ?? r.Sector ?? '',
      cat: r[columnMap.category] ?? r.Category ?? '',
      sub: r[columnMap.subcategory] ?? r.Subcategory ?? '',
      tags: r[columnMap.tags] ?? r.Tags ?? '',
    }));

    const res = await fetch('/api/taxonomy/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'preview',
        rows: mapped,
        conflictMode: conflictStrategy,
      }),
    });
    const data = await res.json();
    if (data.success && data.rows) {
      setPreviewRows(data.rows);
      setStage(4);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    const res = await fetch('/api/taxonomy/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'publish',
        fileName,
        rows: previewRows,
        conflictMode: conflictStrategy,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setPublishedVersion(data.version);
      setVersions((prev) => [data.version, ...prev]);
      setStage(6);
    }
    setPublishing(false);
  };

  const handleDownloadErrors = () => {
    const invalid = previewRows.filter((r) => r.status === 'invalid');
    const lines = [
      'Row,Sector,Category,Subcategory,Reason',
      ...invalid.map((r) => `${r.row},"${r.sector}","${r.cat}","${r.sub}","${r.reason}"`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taxonomy_import_errors.csv';
    a.click();
  };

  const validCount = previewRows.filter((r) => r.status === 'valid').length;
  const dupCount = previewRows.filter((r) => r.status === 'duplicate').length;
  const invalidCount = previewRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            Excel Category & Subcategory Management
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            Upload .xlsx or .csv files (Sector → Category → Subcategory → Tags/Skills) with worksheet selection, column mapping & safe deduplication.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-bold border-red-200 text-[#E8192C] bg-red-50">
          Step {stage} of 6
        </Badge>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* STEP 1: FILE UPLOAD & TEMPLATE */}
      {stage === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#222222]">1. Download Taxonomy Template</h3>
                <p className="text-xs text-[#717171]">
                  Standard hierarchy: Sector → Category → Subcategory → Tags / Skills.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent =
                    'Sector,Category,Subcategory,Tags\nTechnology,Software Development,Website Development,"React, Firebase"\nManufacturing,Metal Fabrication,CNC Machining,"Milling, Turning"\nDesign,Product Design,Industrial Design,"CAD, Prototyping"\nRecruitment,Information Technology,Software Engineers,"Frontend, Backend"\n';
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'xpo-taxonomy-template.csv';
                  a.click();
                }}
                className="w-full text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample CSV / Excel Template
              </Button>
            </Card>

            <Card className="p-6 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/20 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E8192C] text-white flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#222222]">2. Upload .XLSX or .CSV File</h3>
                <p className="text-xs text-[#717171]">
                  Upload your Excel workbook or CSV file, or inspect the pre-loaded sample dataset.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl"
                >
                  Choose .XLSX / .CSV File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStage(2)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Use Sample Sheet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Import History Table (Requirement 14) */}
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3">
            <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#E8192C]" /> Category Import History
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                  <tr>
                    <th className="p-2.5">Version</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">New Categories</th>
                    <th className="p-2.5">Updated</th>
                    <th className="p-2.5">Summary</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {versions.map((v, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-mono font-bold text-[#222222]">{v.version}</td>
                      <td className="p-2.5 text-[#717171]">{v.date}</td>
                      <td className="p-2.5 font-bold text-emerald-700">+{v.newRecords}</td>
                      <td className="p-2.5 font-bold text-blue-700">{v.updatedRecords || 0}</td>
                      <td className="p-2.5 text-[#555555]">{v.description}</td>
                      <td className="p-2.5 text-right">
                        <Badge variant="success" className="text-[10px]">{v.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 2: WORKSHEET SELECTION & HEADER DETECTION */}
      {stage === 2 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#222222]">
                  Worksheet Selection: {fileName}
                </h3>
                <p className="text-xs text-[#717171]">
                  {rawSheetRows.length} rows detected • {detectedHeaders.length} columns auto-detected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#717171]">Select Worksheet:</span>
              <select
                value={selectedSheet}
                onChange={(e) => handleSelectWorksheet(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#EBEBEB] font-bold text-[#222222]"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#EBEBEB]">
            <Button variant="outline" size="sm" onClick={() => setStage(1)}>
              Back
            </Button>
            <Button size="sm" onClick={() => setStage(3)} className="bg-[#E8192C] text-white">
              Continue to Column Mapping <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: AUTOMATIC HEADER DETECTION & MANUAL COLUMN MAPPING */}
      {stage === 3 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div>
            <h3 className="text-base font-black text-[#222222]">
              Step 3: Automatic Header Detection & Manual Column Mapping
            </h3>
            <p className="text-xs text-[#717171]">
              Map your spreadsheet columns to XPO’s canonical Sector → Category → Subcategory → Tags/Skills taxonomy.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'sector', label: 'Sector (Tier-1)', required: true },
              { key: 'category', label: 'Category (Tier-2)', required: true },
              { key: 'subcategory', label: 'Subcategory (Tier-3)', required: true },
              { key: 'tags', label: 'Tags / Skills (Comma-Separated)', required: false },
            ].map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]"
              >
                <div>
                  <span className="font-bold text-[#222222]">{field.label}</span>
                  {field.required && <span className="text-[#E8192C] ml-1">*</span>}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#717171]" />
                <select
                  value={(columnMap as any)[field.key]}
                  onChange={(e) =>
                    setColumnMap({ ...columnMap, [field.key]: e.target.value })
                  }
                  className="px-3 py-1.5 rounded-xl border border-[#EBEBEB] bg-white font-mono font-bold text-[#222222]"
                >
                  {detectedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(2)}>
              Back
            </Button>
            <Button size="sm" onClick={handleGeneratePreview} className="bg-[#E8192C] text-white">
              Validate & Generate Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: DATA PREVIEW, VALIDATION & DUPLICATE DETECTION */}
      {stage === 4 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-[#222222]">
                Step 4: Validation & Case-Insensitive Duplicate Detection
              </h3>
              <p className="text-xs text-[#717171]">
                Existing categories absent from this file are preserved. Case/spelling variations are matched safely.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                {validCount} New Valid
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                {dupCount} Existing / Duplicate
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                {invalidCount} Invalid
              </span>
              {invalidCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleDownloadErrors} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" /> Error Report (.CSV)
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                <tr>
                  <th className="p-2.5">Row</th>
                  <th className="p-2.5">Sector</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Subcategory</th>
                  <th className="p-2.5">Tags / Skills</th>
                  <th className="p-2.5">Validation Notes</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {previewRows.map((r) => (
                  <tr key={r.row} className="hover:bg-neutral-50">
                    <td className="p-2.5 font-mono">#{r.row}</td>
                    <td className="p-2.5 font-bold text-[#222222]">{r.sector || '—'}</td>
                    <td className="p-2.5 font-semibold text-[#222222]">{r.cat || '—'}</td>
                    <td className="p-2.5 text-[#555555]">{r.sub || '—'}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#717171]">
                      {Array.isArray(r.tags) ? r.tags.join(', ') : r.tags}
                    </td>
                    <td className="p-2.5 text-[11px] text-[#717171]">{r.reason}</td>
                    <td className="p-2.5 text-right">
                      <Badge
                        variant={
                          r.status === 'valid'
                            ? 'success'
                            : r.status === 'duplicate'
                            ? 'warning'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {r.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(3)}>
              Back
            </Button>
            <Button size="sm" onClick={() => setStage(5)} className="bg-[#E8192C] text-white">
              Proceed to Import Confirmation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: IMPORT CONFIRMATION */}
      {stage === 5 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-5">
          <div>
            <h3 className="text-base font-black text-[#222222]">Step 5: Confirm Additive Category Import</h3>
            <p className="text-xs text-[#717171]">
              Choose how existing matching categories should be handled. Categories not present in this file will never be deleted.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div
              onClick={() => setConflictStrategy('update_existing')}
              className={`p-4 rounded-xl border cursor-pointer ${
                conflictStrategy === 'update_existing'
                  ? 'border-[#E8192C] bg-red-50/30'
                  : 'border-[#EBEBEB]'
              }`}
            >
              <div className="font-bold text-[#222222]">Merge & Update Existing Categories (Recommended)</div>
              <div className="text-[#717171] mt-1">
                Preserves stable internal category IDs and appends any new Tags/Skills from the sheet.
              </div>
            </div>
            <div
              onClick={() => setConflictStrategy('skip_duplicates')}
              className={`p-4 rounded-xl border cursor-pointer ${
                conflictStrategy === 'skip_duplicates'
                  ? 'border-[#E8192C] bg-red-50/30'
                  : 'border-[#EBEBEB]'
              }`}
            >
              <div className="font-bold text-[#222222]">Skip Existing Categories</div>
              <div className="text-[#717171] mt-1">
                Only inserts brand-new Sector → Category → Subcategory records.
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStage(4)}>
              Back
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              isLoading={publishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm & Publish Taxonomy Import
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: COMPLETED */}
      {stage === 6 && publishedVersion && (
        <Card className="p-8 rounded-2xl border border-[#EBEBEB] bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#222222]">
              Taxonomy {publishedVersion.version} Published!
            </h3>
            <p className="text-xs text-[#717171] mt-1">{publishedVersion.description}</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Link href="/admin/taxonomy/categories">
              <Button size="sm" className="bg-[#E8192C] text-white text-xs rounded-xl">
                View Category Hierarchy
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setStage(1)} className="text-xs rounded-xl">
              Import Another Sheet
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
