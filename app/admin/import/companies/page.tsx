'use client';

import React, { useState } from 'react';
import { ExcelImporterPanel } from '@/components/admin/excel-importer-panel';

export default function AdminImportCrmCompaniesPage() {
  const [targetDb, setTargetDb] = useState<'client_database' | 'partner_database'>(
    'client_database'
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTargetDb('client_database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            targetDb === 'client_database'
              ? 'bg-[#111827] text-white'
              : 'bg-white border border-[#D1D5DB] text-[#4B5563]'
          }`}
        >
          Client Database Upload
        </button>
        <button
          type="button"
          onClick={() => setTargetDb('partner_database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            targetDb === 'partner_database'
              ? 'bg-[#111827] text-white'
              : 'bg-white border border-[#D1D5DB] text-[#4B5563]'
          }`}
        >
          Partner Database Upload
        </button>
      </div>

      {targetDb === 'client_database' ? (
        <ExcelImporterPanel
          key="client_db_importer"
          title="Client Database Excel Upload"
          subtitle="Upload potential Clients' names, WhatsApp numbers, locations, business information, and consent status."
          endpoint="/api/crm/import"
          importType="client_database"
          templateDownloadHref="/api/crm/import?download=template&type=client"
          templateLabel="Download Client Excel Template (.xlsx)"
        />
      ) : (
        <ExcelImporterPanel
          key="partner_db_importer"
          title="Partner Database Excel Upload"
          subtitle="Upload potential Partners' names, WhatsApp numbers, locations, services, categories, subcategories, and consent status."
          endpoint="/api/crm/import"
          importType="partner_database"
          templateDownloadHref="/api/crm/import?download=template&type=partner"
          templateLabel="Download Partner Excel Template (.xlsx)"
        />
      )}
    </div>
  );
}
