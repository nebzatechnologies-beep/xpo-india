'use client';

import React from 'react';
import { ExcelImporterPanel } from '@/components/admin/excel-importer-panel';

export default function AdminTaxonomyImportExportPage() {
  return (
    <ExcelImporterPanel
      title="10-Step Taxonomy Excel Importer & Exporter"
      subtitle="Upload multi-sheet Sector / Category / Subcategory / Tag workbooks with normalized key deduplication and zero-write preview."
      endpoint="/api/taxonomy/import"
      templateDownloadHref="/api/taxonomy/import?download=export"
      templateLabel="Export Live Taxonomy (.xlsx)"
    />
  );
}
