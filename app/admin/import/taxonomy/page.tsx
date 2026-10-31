'use client';

import React from 'react';
import { ExcelImporterPanel } from '@/components/admin/excel-importer-panel';

export default function AdminImportTaxonomyPage() {
  return (
    <ExcelImporterPanel
      title="10-Step Taxonomy Workbook Importer"
      subtitle="Import 4-tier Sector → Category → Subcategory → Skill Tag workbooks with zero-write validation preview."
      endpoint="/api/taxonomy/import"
      templateDownloadHref="/api/taxonomy/import?download=template"
      templateLabel="Download Taxonomy Workbook (.xlsx)"
    />
  );
}
