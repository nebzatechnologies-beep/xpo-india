'use client';

import React, { useState } from 'react';
import type { ImportJob, ImportJobType } from '@/lib/types/domain';
import { UploadCloud, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CanonicalFieldDef {
  key: string;
  label: string;
  required?: boolean;
}

interface SheetInspection {
  name: string;
  rowCount: number;
  headers: string[];
  suggestedMap: Record<string, string>;
}

interface ExcelImporterPanelProps {
  title: string;
  subtitle: string;
  endpoint: '/api/crm/import' | '/api/taxonomy/import';
  importType?: ImportJobType;
  templateDownloadHref: string;
  templateLabel: string;
  compactHeader?: boolean;
  onImportComplete?: (job: ImportJob) => void;
}

export function ExcelImporterPanel({
  title,
  subtitle,
  endpoint,
  importType,
  templateDownloadHref,
  templateLabel,
  compactHeader = false,
  onImportComplete,
}: ExcelImporterPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInspection[]>([]);
  const [canonicalFields, setCanonicalFields] = useState<CanonicalFieldDef[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [conflictMode, setConflictMode] = useState<'merge_preserve' | 'skip_existing'>(
    'merge_preserve'
  );

  const [stagedJob, setStagedJob] = useState<ImportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedJob, setCompletedJob] = useState<ImportJob | null>(null);

  async function handleInspectFile(selected: File) {
    setFile(selected);
    setStagedJob(null);
    setCompletedJob(null);
    setError(null);
    try {
      setBusy(true);
      const fd = new FormData();
      fd.set('mode', 'inspect');
      if (importType) fd.set('importType', importType);
      fd.set('file', selected);
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to inspect workbook');

      const foundSheets: SheetInspection[] = data.sheets || [];
      setSheets(foundSheets);
      setCanonicalFields(data.canonicalFields || []);
      if (foundSheets.length > 0) {
        setSelectedSheet(foundSheets[0].name);
        setColumnMap(foundSheets[0].suggestedMap || {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleStagePreview() {
    if (!file || !selectedSheet) return;
    setError(null);
    try {
      setBusy(true);
      const fd = new FormData();
      fd.set('mode', 'stage');
      if (importType) fd.set('importType', importType);
      fd.set('file', file);
      fd.set('selectedSheet', selectedSheet);
      fd.set('conflictMode', conflictMode);
      fd.set('columnMap', JSON.stringify(columnMap));

      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation staging failed');
      setStagedJob(data.job || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview staging failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmExecution() {
    if (!stagedJob) return;
    setError(null);
    try {
      setBusy(true);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', jobId: stagedJob.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import execution failed');
      setCompletedJob(data.job);
      setStagedJob(null);
      if (data.job) {
        onImportComplete?.(data.job);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setBusy(false);
    }
  }

  const activeSheetMeta = sheets.find((s) => s.name === selectedSheet);
  const validStagedCount = (stagedJob?.toCreateCount || 0) + (stagedJob?.toUpdateCount || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {compactHeader ? (
            <h2 className="text-base font-extrabold text-[#111827]">{title}</h2>
          ) : (
            <h1 className="text-2xl font-extrabold text-[#111827]">{title}</h1>
          )}
          <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>
        </div>
        <a
          href={templateDownloadHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold transition shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> {templateLabel}
        </a>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">
          Step 1 — Upload Excel / CSV File
        </div>
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#D1D5DB] rounded-2xl cursor-pointer hover:bg-[#F9FAFB] transition">
          <UploadCloud className="w-8 h-8 text-[#E8192C] mb-2" />
          <span className="text-sm font-bold text-[#111827]">
            {file ? file.name : 'Select .xlsx, .xls, or .csv file'}
          </span>
          <span className="text-xs text-[#6B7280] mt-1">
            Zero database writes occur until dry-run validation is reviewed and confirmed
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleInspectFile(f);
            }}
          />
        </label>
      </div>

      {sheets.length > 0 && !completedJob && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#111827]">
            Step 2 — Sheet Selection, Column Mapping & Duplicate Policy
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Worksheet</label>
              <select
                value={selectedSheet}
                onChange={(e) => {
                  const sName = e.target.value;
                  setSelectedSheet(sName);
                  const found = sheets.find((s) => s.name === sName);
                  if (found) setColumnMap(found.suggestedMap || {});
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
              >
                {sheets.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Duplicate Phone Policy
              </label>
              <select
                value={conflictMode}
                onChange={(e) =>
                  setConflictMode(e.target.value as 'merge_preserve' | 'skip_existing')
                }
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
              >
                <option value="merge_preserve">
                  Merge & Preserve Registered / Opted-Out Records (Recommended)
                </option>
                <option value="skip_existing">Skip Existing Phone Numbers</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {canonicalFields.map((cf) => (
              <div key={cf.key} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[11px] font-bold text-[#111827]">
                  {cf.label} {cf.required ? '*' : ''}
                </div>
                <select
                  value={columnMap[cf.key] || ''}
                  onChange={(e) =>
                    setColumnMap((prev) => ({ ...prev, [cf.key]: e.target.value }))
                  }
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">-- Unmapped --</option>
                  {(activeSheetMeta?.headers || []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleStagePreview()}
            className="px-5 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black disabled:opacity-50"
          >
            {busy ? 'Validating Rows...' : 'Preview & Validate Rows'}
          </button>
        </div>
      )}

      {stagedJob && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#E8192C]">
            Step 3 — Validation Summary (Job {stagedJob.id})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
              <div className="text-[#6B7280]">Total Rows</div>
              <div className="text-xl font-extrabold text-[#111827]">{stagedJob.totalRows}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-emerald-800">New Contacts</div>
              <div className="text-xl font-extrabold text-emerald-700">
                {stagedJob.toCreateCount}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-amber-800">To Update / Merge</div>
              <div className="text-xl font-extrabold text-amber-700">
                {stagedJob.toUpdateCount}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="text-red-800">Invalid Rows</div>
              <div className="text-xl font-extrabold text-red-700">{stagedJob.rejectedCount}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || validStagedCount === 0}
              onClick={() => void handleConfirmExecution()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white text-xs font-bold disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {busy ? 'Importing Records...' : `Confirm & Save ${validStagedCount} Valid Rows`}
            </button>

            {stagedJob.rejectedCount > 0 && (
              <a
                href={`/api/imports/${stagedJob.id}?download=errors`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-xs font-bold"
              >
                <AlertTriangle className="w-4 h-4" /> Download Invalid Rows CSV
              </a>
            )}
          </div>
        </div>
      )}

      {completedJob && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 space-y-2 text-xs text-emerald-900">
          <div className="font-extrabold text-sm">Excel Upload Completed Successfully</div>
          <p>
            Created: <strong>{completedJob.createdCount}</strong> • Updated (Non-Destructive):{' '}
            <strong>{completedJob.updatedCount}</strong> • Skipped:{' '}
            <strong>{completedJob.skippedCount}</strong> • Status:{' '}
            <strong className="uppercase">{completedJob.status}</strong>
          </p>
          {completedJob.rejectedCount > 0 && (
            <a
              href={`/api/imports/${completedJob.id}?download=errors`}
              className="inline-block underline font-bold text-red-700"
            >
              Download Invalid Row Error CSV
            </a>
          )}
        </div>
      )}
    </div>
  );
}
