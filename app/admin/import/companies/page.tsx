'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Download,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function ImportCompaniesPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('xpo_contacts_database.xlsx');
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultSampleContacts = [
    {
      company: 'Apex Precision Engineering Ltd',
      name: 'Vikram Seth',
      designation: 'Managing Director',
      businessType: 'Manufacturer',
      classification: 'Client, Partner',
      whatsapp: '98200 44551',
      countryCode: '+91',
      email: 'vikram@apexengg.com',
      website: 'https://apexengg.com',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      sector: 'Manufacturing',
      category: 'Metal Fabrication',
      subcategory: 'CNC Machining',
      skills: '5-Axis CNC, Precision Turning',
      consentStatus: 'opted_in',
      consentSource: 'Trade Expo 2026',
    },
    {
      company: 'Nordic Sourcing Partners Oy',
      name: 'Lars Lindqvist',
      designation: 'Head of Procurement',
      businessType: 'Enterprise Buyer',
      classification: 'Client, Employer',
      whatsapp: '+358 40 123 4567',
      countryCode: '+358',
      email: '', // Optional email per Module 7
      website: 'https://nordicsourcing.fi',
      country: 'Finland',
      state: 'Uusimaa',
      city: 'Helsinki',
      sector: 'Trade & Sourcing',
      category: 'Industrial Components',
      subcategory: 'Castings & Forgings',
      skills: 'European Sourcing, ISO 9001',
      consentStatus: 'opted_in',
      consentSource: 'Website Inquiry',
    },
    {
      company: 'Gulf Tech Talent Solutions',
      name: 'Tariq Al-Mansoor',
      designation: 'HR Director',
      businessType: 'Employer',
      classification: 'Employer',
      whatsapp: '+971 50 998 8776',
      countryCode: '+971',
      email: 'tariq@gulftech.ae',
      website: '',
      country: 'UAE',
      state: 'Dubai',
      city: 'Dubai',
      sector: 'Recruitment',
      category: 'Information Technology',
      subcategory: 'Cloud Engineers',
      skills: 'AWS, Kubernetes, DevOps',
      consentStatus: 'opted_in',
      consentSource: 'LinkedIn Lead Form',
    },
    {
      company: 'Independent Candidate',
      name: 'Ananya Deshmukh',
      designation: 'Senior React Developer',
      businessType: 'Job Seeker / Freelancer',
      classification: 'Job Seeker, Partner',
      whatsapp: '+91 98111 22334',
      countryCode: '+91',
      email: 'ananya.dev@gmail.com',
      website: 'https://github.com/ananya',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      sector: 'Technology',
      category: 'Software Development',
      subcategory: 'Website Development',
      skills: 'React, Next.js, Firebase, TypeScript',
      consentStatus: 'opted_in',
      consentSource: 'WhatsApp Entry',
    },
    {
      company: 'Invalid Phone Example Co',
      name: 'Ramesh Test',
      designation: 'Owner',
      businessType: 'Supplier',
      classification: 'Partner',
      whatsapp: '12345', // Invalid phone to demonstrate validation & error report
      countryCode: '',
      email: '',
      website: '',
      country: 'Unknown',
      state: '',
      city: 'Mumbai',
      sector: 'Manufacturing',
      category: 'Packaging',
      subcategory: 'Corrugated Boxes',
      skills: '',
      consentStatus: 'imported_prospect',
      consentSource: 'Directory',
    },
  ];

  const [rawRows, setRawRows] = useState<any[]>(defaultSampleContacts);

  const runPreview = async (rowsToValidate: any[]) => {
    setUploading(true);
    const res = await fetch('/api/crm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', rows: rowsToValidate }),
    });
    const data = await res.json();
    if (data.success) {
      setPreviewData(data);
      setStep(2);
    }
    setUploading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
      const mapped = parsed.map((r) => ({
        company: r.Company || r['Company Name'] || r.company || '',
        name: r.Contact || r['Contact Name'] || r.Name || r.name || '',
        designation: r.Designation || r['Contact Designation'] || r.designation || '',
        businessType: r['Business Type'] || r.businessType || '',
        classification: r.Classification || r['Customer Classification'] || r.classification || '',
        whatsapp: r.WhatsApp || r['WhatsApp Number'] || r.Phone || r['Mobile Number'] || r.whatsapp || '',
        countryCode: r['Country Code'] || r.countryCode || '',
        email: r.Email || r.email || '',
        website: r.Website || r.website || '',
        country: r.Country || r.country || '',
        state: r.State || r.state || '',
        city: r.City || r.city || '',
        sector: r.Sector || r.Industry || r.sector || '',
        category: r.Category || r.category || '',
        subcategory: r.Subcategory || r.subcategory || '',
        skills: r.Skills || r.skills || '',
        consentStatus: r['Marketing Consent'] || r.consentStatus || 'opted_in',
        consentSource: r['Consent Source'] || r.consentSource || 'Excel Import',
      }));
      setRawRows(mapped);
      runPreview(mapped);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    setUploading(true);
    const res = await fetch('/api/crm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', rows: rawRows }),
    });
    const data = await res.json();
    if (data.success) {
      setImportResult(data);
      setStep(3);
    }
    setUploading(false);
  };

  const handleDownloadErrorReport = () => {
    const invalid = (previewData?.rows || []).filter((r: any) => r.status === 'invalid');
    const csvLines = [
      'Row,Company,Contact,RawPhone,Email,ErrorReason',
      ...invalid.map(
        (r: any) =>
          `${r.rowNumber},"${r.company}","${r.name}","${r.originalPhoneRaw}","${r.email}","${r.errorReason}"`
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm_import_error_report.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            Bulk Contact & Company Excel Import (Modules 7, 8 & 9)
          </h1>
          <p className="text-xs text-[#717171] mt-0.5">
            International E.164 phone normalization, optional email, multi-role classification (Client, Partner, Employer, Job Seeker), and safe deduplication.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-bold border-red-200 text-[#E8192C] bg-red-50">
          Step {step} of 3
        </Badge>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {step === 1 && (
        <Card className="p-8 rounded-2xl border-2 border-dashed border-[#EBEBEB] bg-white text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#222222]">
              Upload Contact / Company Database (.XLSX / .CSV)
            </h3>
            <p className="text-xs text-[#717171] mt-1 max-w-2xl mx-auto">
              Supports Companies, Business Owners, Employers, Freelancers, Manufacturers, Suppliers, Consultants, Agencies, Professionals, Students & Job Seekers. Email is optional; international phone numbers are normalized to E.164.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csv =
                  'Company,Contact,Designation,Business Type,Customer Classification,WhatsApp,Country Code,Email,Website,Country,State,City,Sector,Category,Subcategory,Skills,Marketing Consent,Consent Source\nApex Precision,Vikram Seth,MD,Manufacturer,"Client, Partner",9820044551,+91,vikram@apex.com,https://apex.com,India,Maharashtra,Pune,Manufacturing,Metal Fabrication,CNC Machining,"CNC, Milling",opted_in,Trade Expo\nNordic Sourcing,Lars Lindqvist,Director,Buyer,Client,+358401234567,+358,,https://nordic.fi,Finland,Uusimaa,Helsinki,Trade,Industrial,Castings,ISO 9001,opted_in,Web\n';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'xpo_crm_bulk_import_template.csv';
                a.click();
              }}
              className="text-xs font-semibold rounded-xl"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Download 18-Column CSV Template
            </Button>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Upload .XLSX / .CSV File
            </Button>
            <Button
              variant="outline"
              size="sm"
              isLoading={uploading}
              onClick={() => runPreview(defaultSampleContacts)}
              className="text-xs font-semibold rounded-xl"
            >
              Inspect International Sample Sheet <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && previewData && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[#222222]">
                Pre-Import Validation, E.164 Phone Normalization & Multi-Role Classification
              </h3>
              <p className="text-xs text-[#717171]">
                Original raw phone values are preserved for audit; valid numbers normalized to international E.164.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                {previewData.summary.validNewCount} Valid New
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                {previewData.summary.duplicateMergeCount} Safe Merge
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                {previewData.summary.invalidCount} Invalid
              </span>
              {previewData.summary.invalidCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrorReport}
                  className="text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Error Report (.CSV)
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAFA] border-b border-[#EBEBEB] text-[#717171] uppercase font-bold">
                <tr>
                  <th className="p-2.5">Contact & Company</th>
                  <th className="p-2.5">Raw → E.164 Phone</th>
                  <th className="p-2.5">Email (Optional)</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Taxonomy & Skills</th>
                  <th className="p-2.5">Multi-Role Classification</th>
                  <th className="p-2.5 text-right">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {previewData.rows.map((c: any) => (
                  <tr key={c.rowNumber} className="hover:bg-[#FDFDFD]">
                    <td className="p-2.5">
                      <div className="font-bold text-[#222222]">{c.name}</div>
                      <div className="text-[11px] text-[#555555]">{c.company}</div>
                    </td>
                    <td className="p-2.5 font-mono">
                      <div className="text-[10px] text-[#717171]">Raw: {c.originalPhoneRaw}</div>
                      <div className="font-bold text-emerald-700">{c.e164Phone || 'INVALID'}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[#717171]">
                      {c.email || <span className="italic text-[10px]">None (Optional)</span>}
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-[#222222]">{c.city}</div>
                      <div className="text-[10px] text-[#717171]">{c.country}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-[#E8192C]">
                        {c.industry} {c.category ? `→ ${c.category}` : ''}
                      </div>
                      <div className="text-[10px] text-[#717171] truncate max-w-[180px]">{c.skills}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.classifications || []).map((role: string) => (
                          <Badge key={role} variant="outline" className="text-[9px] font-bold">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-2.5 text-right">
                      <Badge
                        variant={
                          c.status === 'valid_new'
                            ? 'success'
                            : c.status === 'duplicate_merge'
                            ? 'primary'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {c.status.toUpperCase()}
                      </Badge>
                      {c.errorReason && (
                        <div className="text-[10px] text-[#717171] mt-0.5 max-w-[180px] ml-auto">
                          {c.errorReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmImport}
              isLoading={uploading}
              className="bg-[#E8192C] text-white"
            >
              Confirm & Ingest Valid Contacts into CRM
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && importResult && (
        <Card className="p-8 rounded-2xl border border-[#EBEBEB] bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#222222]">CRM Bulk Import Complete!</h3>
            <p className="text-xs text-[#717171] mt-1">{importResult.message}</p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Link href="/admin/crm">
              <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
                Open CRM Contact Database
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs font-semibold rounded-xl"
            >
              Import Another File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
