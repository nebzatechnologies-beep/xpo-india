import * as XLSX from 'xlsx';
import { requireFirestore, requireStorageBucket } from '@/lib/firebase/admin';
import { normalizePhoneE164 } from '@/lib/crm/phone';
import { upsertCrmContactNonDestructive } from '@/lib/services/crm';
import { getFullTaxonomyTree } from '@/lib/services/taxonomy';
import { recordAuditLog } from '@/lib/services/audit';
import { enqueueCloudTask } from '@/lib/tasks/cloud-tasks';
import { NotFoundError, ValidationError } from '@/lib/utils/api-handler';
import { normalizeTaxonomyKey } from '@/lib/utils/format';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  ConsentStatus,
  CrmContactType,
  CrmDatabaseType,
  CustomerRole,
  ImportJob,
  ImportJobType,
  ImportRowError,
  TaxonomyCategory,
  TaxonomySector,
  TaxonomySubcategory,
  TaxonomyTag,
} from '@/lib/types/domain';

export const CANONICAL_CLIENT_DB_FIELDS = [
  { key: 'contactName', label: 'Client Name', required: true },
  { key: 'whatsappNumber', label: 'WhatsApp Number', required: true },
  { key: 'mobileNumber', label: 'Alternate Mobile Number', required: false },
  { key: 'countryCode', label: 'Country Code', required: false },
  { key: 'city', label: 'Location / City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'companyName', label: 'Business / Company Name', required: false },
  { key: 'businessInfo', label: 'Business Information', required: false },
  { key: 'sector', label: 'Industry Sector', required: false },
  { key: 'email', label: 'Email (Optional)', required: false },
  { key: 'website', label: 'Website (Optional)', required: false },
  { key: 'consentStatus', label: 'Consent Status (opted_in / none)', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'notes', label: 'Notes', required: false },
] as const;

export const CANONICAL_PARTNER_DB_FIELDS = [
  { key: 'contactName', label: 'Partner Name', required: true },
  { key: 'whatsappNumber', label: 'WhatsApp Number', required: true },
  { key: 'mobileNumber', label: 'Alternate Mobile Number', required: false },
  { key: 'countryCode', label: 'Country Code', required: false },
  { key: 'city', label: 'Location / City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'companyName', label: 'Business / Agency Name', required: false },
  { key: 'servicesOffered', label: 'Services Offered', required: false },
  { key: 'sector', label: 'Sector', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'subcategory', label: 'Subcategory', required: false },
  { key: 'skills', label: 'Skills / Expertise Tags', required: false },
  { key: 'email', label: 'Email (Optional)', required: false },
  { key: 'website', label: 'Website / Portfolio (Optional)', required: false },
  { key: 'consentStatus', label: 'Consent Status (opted_in / none)', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'notes', label: 'Notes', required: false },
] as const;

export const CANONICAL_CRM_FIELDS = [
  { key: 'contactName', label: 'Contact Name', required: true },
  { key: 'companyName', label: 'Company / Business Name', required: false },
  { key: 'whatsappNumber', label: 'WhatsApp Number', required: true },
  { key: 'mobileNumber', label: 'Mobile Number', required: false },
  { key: 'countryCode', label: 'Country Code', required: false },
  { key: 'city', label: 'City / Location', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'businessInfo', label: 'Business Information (Clients)', required: false },
  { key: 'servicesOffered', label: 'Services Offered (Partners)', required: false },
  { key: 'sector', label: 'Sector', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'subcategory', label: 'Subcategory', required: false },
  { key: 'skills', label: 'Skills / Tags', required: false },
  { key: 'role', label: 'Database Role (Client / Partner)', required: false },
  { key: 'consentStatus', label: 'Consent Status (opted_in / none)', required: false },
  { key: 'email', label: 'Email (Optional)', required: false },
  { key: 'website', label: 'Website (Optional)', required: false },
  { key: 'contactType', label: 'Business Entity Type', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'notes', label: 'Notes', required: false },
] as const;

export const CANONICAL_TAXONOMY_FIELDS = [
  { key: 'sectorCode', label: 'Sector Code', required: false },
  { key: 'sector', label: 'Sector', required: true },
  { key: 'categoryCode', label: 'Category Code', required: false },
  { key: 'category', label: 'Category', required: true },
  { key: 'subcategoryCode', label: 'Subcategory Code', required: false },
  { key: 'subcategory', label: 'Subcategory', required: false },
  { key: 'tags', label: 'Tags / Skills', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'status', label: 'Status', required: false },
] as const;

export function getCanonicalFieldsForImportType(type: ImportJobType) {
  switch (type) {
    case 'client_database':
      return CANONICAL_CLIENT_DB_FIELDS;
    case 'partner_database':
      return CANONICAL_PARTNER_DB_FIELDS;
    case 'taxonomy':
      return CANONICAL_TAXONOMY_FIELDS;
    case 'crm_contacts':
    default:
      return CANONICAL_CRM_FIELDS;
  }
}

const HEADER_SYNONYMS: Record<string, string[]> = {
  contactName: [
    'contact name',
    'client name',
    'partner name',
    'name',
    'full name',
    'person',
    'owner name',
  ],
  companyName: [
    'company',
    'company / organization name',
    'company / business name',
    'business / company name',
    'business / agency name',
    'organization',
    'business name',
    'firm',
  ],
  businessInfo: [
    'business information',
    'business info',
    'business details',
    'about business',
    'requirement summary',
  ],
  servicesOffered: [
    'services offered',
    'services',
    'service offerings',
    'products / services',
    'offerings',
  ],
  mobileNumber: [
    'mobile number',
    'alternate mobile number',
    'mobile',
    'phone',
    'phone number',
    'contact number',
  ],
  whatsappNumber: ['whatsapp number', 'whatsapp', 'wa number', 'whatsapp mobile'],
  countryCode: ['country code', 'dial code', 'isd code'],
  email: ['email', 'email (optional)', 'email address', 'e-mail'],
  website: ['website', 'website (optional)', 'website / portfolio (optional)', 'url', 'domain'],
  city: ['city', 'location / city', 'city / location', 'location', 'town', 'district'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  sector: ['sector', 'industry', 'industry sector'],
  category: ['category', 'service category', 'primary category'],
  subcategory: ['subcategory', 'sub-category', 'sub category', 'specialization'],
  skills: [
    'skills / tags',
    'skills / expertise tags',
    'skills',
    'expertise',
    'tags',
    'tags / skills',
    'capabilities',
    'keywords',
  ],
  contactType: ['contact type', 'business entity type', 'type', 'business type', 'entity type'],
  role: ['role', 'database role (client / partner)', 'marketplace role', 'xpo role'],
  consentStatus: [
    'consent status',
    'consent status (opted_in / none)',
    'consent',
    'whatsapp consent',
    'opt in',
    'opt-in',
  ],
  source: ['source', 'lead source', 'data source'],
  notes: ['notes', 'remarks', 'comments'],
  sectorCode: ['sector code', 'sec code'],
  categoryCode: ['category code', 'cat code'],
  subcategoryCode: ['subcategory code', 'sub code'],
  tags: ['tags / skills', 'tags', 'skills'],
  description: ['description', 'details', 'summary'],
  status: ['status', 'active', 'state'],
};

export function autoSuggestColumnMap(
  type: ImportJobType,
  headers: string[]
): Record<string, string> {
  const fields = getCanonicalFieldsForImportType(type);
  const map: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => ({ raw: h, norm: h.trim().toLowerCase() }));

  for (const field of fields) {
    const synonyms = HEADER_SYNONYMS[field.key] || [field.label.toLowerCase()];
    const exact = lowerHeaders.find((h) => synonyms.includes(h.norm));
    if (exact) {
      map[field.key] = exact.raw;
      continue;
    }
    const partial = lowerHeaders.find((h) => synonyms.some((syn) => h.norm.includes(syn)));
    if (partial) {
      map[field.key] = partial.raw;
    }
  }
  return map;
}

export function inspectExcelBuffer(
  buffer: Buffer,
  type: ImportJobType
): {
  sheets: Array<{
    name: string;
    headers: string[];
    rowCount: number;
    suggestedMap: Record<string, string>;
    sampleRows: Array<Record<string, unknown>>;
  }>;
} {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]!;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    const headerRow = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })[0] || [];
    const headers = headerRow.map((h) => String(h || '').trim()).filter(Boolean);
    return {
      name,
      headers,
      rowCount: rows.length,
      suggestedMap: autoSuggestColumnMap(type, headers),
      sampleRows: rows.slice(0, 5),
    };
  });
  return { sheets };
}

function buildErrorCsv(errors: ImportRowError[]): string {
  if (errors.length === 0) return '';
  const lines = ['Row Number,Identifier,Error Reason'];
  for (const err of errors) {
    const safeId = `"${String(err.rawIdentifier || '').replace(/"/g, '""')}"`;
    const safeReason = `"${String(err.reason || '').replace(/"/g, '""')}"`;
    lines.push(`${err.rowNumber},${safeId},${safeReason}`);
  }
  return lines.join('\n');
}

function parseRolesFromCell(raw: string, fallbackDbType?: CrmDatabaseType | null): CustomerRole[] {
  if (fallbackDbType === 'client') return ['client'];
  if (fallbackDbType === 'partner') return ['partner'];

  const parts = raw
    .split(/[,;|/]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const roles: CustomerRole[] = [];
  for (const p of parts) {
    if (p.includes('client') || p.includes('buyer') || p.includes('customer')) {
      roles.push('client');
    } else if (
      p.includes('partner') ||
      p.includes('vendor') ||
      p.includes('supplier') ||
      p.includes('freelancer') ||
      p.includes('agency') ||
      p.includes('provider')
    ) {
      roles.push('partner');
    }
  }
  return roles.length > 0 ? Array.from(new Set(roles)) : ['client'];
}

function parseConsentFromCell(raw: string): ConsentStatus {
  const clean = raw.trim().toLowerCase();
  if (!clean) return 'none';
  if (
    [
      'opted_in',
      'opt_in',
      'opt-in',
      'opted in',
      'yes',
      'true',
      'consented',
      'verified',
      'approved',
      '1',
    ].includes(clean)
  ) {
    return 'opted_in';
  }
  if (['opted_out', 'opt_out', 'opt-out', 'opted out', 'no', 'stop', 'unsubscribed'].includes(clean)) {
    return 'opted_out';
  }
  if (['pending', 'consent_pending'].includes(clean)) {
    return 'consent_pending';
  }
  return 'none';
}

function parseContactTypesFromCell(raw: string): CrmContactType[] {
  if (!raw.trim()) return [];
  const allowed: CrmContactType[] = [
    'Company',
    'Business Owner',
    'Manufacturer',
    'Supplier',
    'Freelancer',
    'Agency',
    'Consultant',
    'Contractor',
    'Distributor',
    'Client',
    'Partner',
    'Other',
  ];
  const parts = raw.split(/[,;|]/).map((p) => p.trim());
  const matched: CrmContactType[] = [];
  for (const p of parts) {
    const found = allowed.find((a) => a.toLowerCase() === p.toLowerCase());
    if (found) matched.push(found);
  }
  return matched.length > 0 ? matched : ['Other'];
}

function resolveDatabaseTypeFromJobType(type: ImportJobType): CrmDatabaseType | null {
  if (type === 'client_database') return 'client';
  if (type === 'partner_database') return 'partner';
  return null;
}

export async function stageImportPreviewJob(params: {
  type: ImportJobType;
  fileName: string;
  buffer: Buffer;
  selectedSheet: string;
  columnMap: Record<string, string>;
  conflictMode: 'merge_preserve' | 'skip_existing';
  actor: { uid: string; name: string };
}): Promise<{
  job: ImportJob;
  previewRows: Array<Record<string, unknown>>;
  rowErrors: ImportRowError[];
}> {
  const db = requireFirestore();
  const wb = XLSX.read(params.buffer, { type: 'buffer' });
  const ws = wb.Sheets[params.selectedSheet];
  if (!ws) {
    throw new ValidationError(`Worksheet "${params.selectedSheet}" was not found in the workbook.`);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (rawRows.length === 0) {
    throw new ValidationError('The selected worksheet contains zero data rows.');
  }

  const jobId = generateDocId('imp');
  const storagePath = `imports/${jobId}/${params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  let finalStoragePath = storagePath;

  try {
    const bucket = requireStorageBucket();
    await bucket.file(storagePath).save(params.buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      resumable: false,
    });
  } catch (err) {
    if (params.buffer.length <= 750 * 1024) {
      await db
        .collection('import_job_blobs')
        .doc(jobId)
        .set({
          id: jobId,
          fileName: params.fileName,
          sizeBytes: params.buffer.length,
          base64Data: params.buffer.toString('base64'),
          createdAt: new Date().toISOString(),
        });
      finalStoragePath = `blob://${jobId}/${params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    } else {
      throw err;
    }
  }

  const getCell = (row: Record<string, unknown>, fieldKey: string): string => {
    const colHeader = params.columnMap[fieldKey];
    if (!colHeader) return '';
    const v = row[colHeader];
    return v === null || v === undefined ? '' : String(v).trim();
  };

  let toCreateCount = 0;
  let toUpdateCount = 0;
  let toSkipCount = 0;
  const rowErrors: ImportRowError[] = [];
  const previewRows: Array<Record<string, unknown>> = [];

  const isCrmImport =
    params.type === 'crm_contacts' ||
    params.type === 'client_database' ||
    params.type === 'partner_database';
  const forcedDbType = resolveDatabaseTypeFromJobType(params.type);

  if (isCrmImport) {
    const existingSnap = await db.collection('crm_contacts').select('phoneE164').get();
    const existingPhones = new Set<string>(existingSnap.docs.map((d) => d.id));
    const seenInSheet = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const contactName = getCell(row, 'contactName') || getCell(row, 'companyName');
      const mobileRaw = getCell(row, 'mobileNumber');
      const whatsappRaw = getCell(row, 'whatsappNumber');
      const countryCodeCell = getCell(row, 'countryCode');
      const countryCell = getCell(row, 'country');

      const basePhone = whatsappRaw || mobileRaw;
      const candidateRaw =
        countryCodeCell && basePhone && !basePhone.startsWith('+')
          ? `+${countryCodeCell.replace(/^\+/, '')}${basePhone}`
          : basePhone;

      if (!candidateRaw) {
        rowErrors.push({
          rowNumber,
          rawIdentifier: contactName || `Row ${rowNumber}`,
          reason: 'Missing WhatsApp / Mobile Number',
          rawRow: row,
        });
        return;
      }

      const norm = normalizePhoneE164(candidateRaw, countryCell || null);
      if (!norm.isValid || !norm.phoneE164) {
        rowErrors.push({
          rowNumber,
          rawIdentifier: candidateRaw,
          reason:
            norm.errorReason === 'missing_country_code'
              ? 'Missing country code and Country column is blank (never assumes +91 automatically)'
              : `Invalid phone format (${norm.errorReason})`,
          rawRow: row,
        });
        return;
      }

      const phoneE164 = norm.phoneE164;
      let plannedAction: 'CREATE' | 'UPDATE' | 'SKIP' | 'DEDUP_IN_FILE' = 'CREATE';

      if (seenInSheet.has(phoneE164)) {
        plannedAction = 'DEDUP_IN_FILE';
        if (params.conflictMode === 'skip_existing') toSkipCount++;
        else toUpdateCount++;
      } else if (existingPhones.has(phoneE164)) {
        if (params.conflictMode === 'skip_existing') {
          plannedAction = 'SKIP';
          toSkipCount++;
        } else {
          plannedAction = 'UPDATE';
          toUpdateCount++;
        }
      } else {
        toCreateCount++;
      }

      seenInSheet.add(phoneE164);

      if (previewRows.length < 25) {
        previewRows.push({
          rowNumber,
          action: plannedAction,
          databaseType: forcedDbType || getCell(row, 'role') || 'client',
          contactName: contactName || 'Business Contact',
          companyName: getCell(row, 'companyName'),
          phoneE164,
          city: getCell(row, 'city'),
          country: countryCell || norm.countryIso2 || '',
          businessInfo: getCell(row, 'businessInfo'),
          servicesOffered: getCell(row, 'servicesOffered'),
          category: getCell(row, 'category'),
          subcategory: getCell(row, 'subcategory'),
          consentStatus: parseConsentFromCell(getCell(row, 'consentStatus')),
        });
      }
    });
  } else {
    const tree = await getFullTaxonomyTree({ includeInactive: true });
    const existingSecKeys = new Set(tree.sectors.map((s) => s.normalizedKey));
    const existingCatKeys = new Set(
      tree.categories.map((c) => `${c.sectorId}:${c.normalizedKey}`)
    );
    const secKeyToId = new Map(tree.sectors.map((s) => [s.normalizedKey, s.id]));

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const sectorName = getCell(row, 'sector');
      const categoryName = getCell(row, 'category');
      const subcategoryName = getCell(row, 'subcategory');

      if (!sectorName || !categoryName) {
        rowErrors.push({
          rowNumber,
          rawIdentifier: sectorName || categoryName || `Row ${rowNumber}`,
          reason: 'Both Sector and Category names are required for Taxonomy rows',
          rawRow: row,
        });
        return;
      }

      const secKey = normalizeTaxonomyKey(sectorName);
      const catKey = normalizeTaxonomyKey(categoryName);
      const secId = secKeyToId.get(secKey) || `sec_${secKey}`;
      const exists = existingSecKeys.has(secKey) && existingCatKeys.has(`${secId}:${catKey}`);

      if (exists) {
        if (params.conflictMode === 'skip_existing') toSkipCount++;
        else toUpdateCount++;
      } else {
        toCreateCount++;
      }

      if (previewRows.length < 25) {
        previewRows.push({
          rowNumber,
          action: exists
            ? params.conflictMode === 'skip_existing'
              ? 'SKIP'
              : 'UPDATE'
            : 'CREATE',
          sector: sectorName,
          category: categoryName,
          subcategory: subcategoryName,
          tags: getCell(row, 'tags'),
        });
      }
    });
  }

  const now = new Date().toISOString();
  const errorReportCsv = buildErrorCsv(rowErrors);

  const job: ImportJob = {
    id: jobId,
    type: params.type,
    databaseType: forcedDbType,
    fileName: params.fileName,
    storagePath: finalStoragePath,
    selectedSheet: params.selectedSheet,
    columnMap: params.columnMap,
    conflictMode: params.conflictMode,
    status: 'preview_ready',
    totalRows: rawRows.length,
    processedRows: 0,
    toCreateCount,
    toUpdateCount,
    toSkipCount,
    rejectedCount: rowErrors.length,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorReportCsv: errorReportCsv || null,
    uploadedByUid: params.actor.uid,
    uploadedByName: params.actor.name,
    createdAt: now,
  };

  await db.collection('import_jobs').doc(jobId).set(job);

  if (rowErrors.length > 0) {
    const batch = db.batch();
    for (const errItem of rowErrors.slice(0, 200)) {
      const errRef = db
        .collection('import_jobs')
        .doc(jobId)
        .collection('import_errors')
        .doc(`row_${errItem.rowNumber}`);
      batch.set(errRef, errItem);
    }
    await batch.commit();
  }

  return { job, previewRows, rowErrors: rowErrors.slice(0, 100) };
}

export async function executeImportJobInFirestore(jobId: string): Promise<ImportJob> {
  const db = requireFirestore();
  const jobRef = db.collection('import_jobs').doc(jobId);

  let job!: ImportJob;
  let alreadyProcessingOrDone = false;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) throw new NotFoundError('Import job not found');
    job = snap.data() as ImportJob;
    if (job.status === 'completed' || job.status === 'processing') {
      alreadyProcessingOrDone = true;
      return;
    }
    tx.set(
      jobRef,
      { status: 'processing', updatedAt: new Date().toISOString() },
      { merge: true }
    );
  });

  if (alreadyProcessingOrDone) return job;

  try {
    if (!job.storagePath) {
      throw new ValidationError('Workbook storage path is missing on import job.');
    }

    let buffer: Buffer;
    if (job.storagePath.startsWith('blob://')) {
      const blobDocId = job.storagePath.replace('blob://', '').split('/')[0];
      const blobSnap = await db.collection('import_job_blobs').doc(blobDocId).get();
      if (!blobSnap.exists) throw new ValidationError('Import job blob not found in Firestore.');
      buffer = Buffer.from(blobSnap.data()?.base64Data, 'base64');
    } else {
      try {
        const bucket = requireStorageBucket();
        const [b] = await bucket.file(job.storagePath).download();
        buffer = b;
      } catch (err) {
        const blobSnap = await db.collection('import_job_blobs').doc(job.id).get();
        if (blobSnap.exists) {
          buffer = Buffer.from(blobSnap.data()?.base64Data, 'base64');
        } else {
          throw err;
        }
      }
    }

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[job.selectedSheet];
    if (!ws) throw new ValidationError(`Sheet "${job.selectedSheet}" missing in stored file`);

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    const getCell = (row: Record<string, unknown>, fieldKey: string): string => {
      const colHeader = job.columnMap[fieldKey];
      if (!colHeader) return '';
      const v = row[colHeader];
      return v === null || v === undefined ? '' : String(v).trim();
    };

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let processedRows = 0;
    const now = new Date().toISOString();

    const tree = await getFullTaxonomyTree({ includeInactive: true });
    const secByKey = new Map<string, TaxonomySector>(
      tree.sectors.map((s) => [s.normalizedKey, s])
    );
    const catByKey = new Map<string, TaxonomyCategory>(
      tree.categories.map((c) => [`${c.sectorId}:${c.normalizedKey}`, c])
    );
    const catByAnyKey = new Map<string, TaxonomyCategory>(
      tree.categories.map((c) => [c.normalizedKey, c])
    );
    const subByKey = new Map<string, TaxonomySubcategory>(
      tree.subcategories.map((s) => [`${s.categoryId}:${s.normalizedKey}`, s])
    );
    const tagByKey = new Map<string, TaxonomyTag>(
      tree.tags.map((t) => [t.normalizedKey, t])
    );

    const isCrmImport =
      job.type === 'crm_contacts' ||
      job.type === 'client_database' ||
      job.type === 'partner_database';
    const forcedDbType = job.databaseType || resolveDatabaseTypeFromJobType(job.type);

    if (isCrmImport) {
      for (const row of rawRows) {
        processedRows++;
        const contactName = getCell(row, 'contactName') || getCell(row, 'companyName');
        const mobileRaw = getCell(row, 'mobileNumber');
        const whatsappRaw = getCell(row, 'whatsappNumber');
        const countryCodeCell = getCell(row, 'countryCode');
        const countryCell = getCell(row, 'country');

        const basePhone = whatsappRaw || mobileRaw;
        const candidateRaw =
          countryCodeCell && basePhone && !basePhone.startsWith('+')
            ? `+${countryCodeCell.replace(/^\+/, '')}${basePhone}`
            : basePhone;

        if (!candidateRaw) continue;
        const norm = normalizePhoneE164(candidateRaw, countryCell || null);
        if (!norm.isValid || !norm.phoneE164) continue;

        const secName = getCell(row, 'sector');
        const catName = getCell(row, 'category');
        const subName = getCell(row, 'subcategory');

        let secMatch = secName ? secByKey.get(normalizeTaxonomyKey(secName)) : undefined;
        let catMatch =
          secMatch && catName
            ? catByKey.get(`${secMatch.id}:${normalizeTaxonomyKey(catName)}`)
            : undefined;
        if (!catMatch && catName) {
          catMatch = catByAnyKey.get(normalizeTaxonomyKey(catName));
          if (catMatch && !secMatch) {
            secMatch = tree.sectors.find((s) => s.id === catMatch!.sectorId);
          }
        }
        const subMatch =
          catMatch && subName
            ? subByKey.get(`${catMatch.id}:${normalizeTaxonomyKey(subName)}`)
            : undefined;

        const servicesList = getCell(row, 'servicesOffered')
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean);

        const skillsList = Array.from(
          new Set([
            ...getCell(row, 'skills')
              .split(/[,;|]/)
              .map((s) => s.trim())
              .filter(Boolean),
            ...servicesList,
          ])
        );
        const skillTagIds = skillsList
          .map((sk) => tagByKey.get(normalizeTaxonomyKey(sk))?.id)
          .filter((id): id is string => Boolean(id));

        const parsedRoles = parseRolesFromCell(getCell(row, 'role'), forcedDbType);
        const rowDbType: CrmDatabaseType =
          forcedDbType || (parsedRoles.includes('partner') ? 'partner' : 'client');

        const sourceLabel =
          getCell(row, 'source') ||
          (rowDbType === 'client'
            ? `Client Database Upload (${job.fileName})`
            : `Partner Database Upload (${job.fileName})`);

        const res = await upsertCrmContactNonDestructive({
          databaseType: rowDbType,
          phoneRaw: candidateRaw,
          confirmedCountry: countryCell || undefined,
          contactName: contactName || 'Business Contact',
          companyName: getCell(row, 'companyName'),
          businessInfo: getCell(row, 'businessInfo'),
          servicesOffered: servicesList,
          email: getCell(row, 'email') || null,
          website: getCell(row, 'website') || null,
          city: getCell(row, 'city'),
          state: getCell(row, 'state'),
          country: countryCell,
          sectorId: secMatch?.id || null,
          sectorName: secMatch?.name || secName,
          categoryId: catMatch?.id || null,
          categoryName: catMatch?.name || catName,
          subcategoryId: subMatch?.id || null,
          subcategoryName: subMatch?.name || subName,
          skillTagIds,
          skills: skillsList,
          contactTypes: parseContactTypesFromCell(
            getCell(row, 'contactType') || (rowDbType === 'client' ? 'Client' : 'Partner')
          ),
          roles: [rowDbType],
          consentStatus: parseConsentFromCell(getCell(row, 'consentStatus')),
          consentEvidenceNote: `Imported via ${sourceLabel}`,
          source: sourceLabel,
          notes: getCell(row, 'notes'),
          conflictMode: job.conflictMode,
        });

        if (res.action === 'created') createdCount++;
        else if (res.action === 'updated') updatedCount++;
        else skippedCount++;

        if (processedRows % 100 === 0) {
          await jobRef.set(
            { processedRows, createdCount, updatedCount, skippedCount },
            { merge: true }
          );
        }
      }
    } else {
      const writer = db.bulkWriter();

      for (const row of rawRows) {
        processedRows++;
        const secName = getCell(row, 'sector');
        const catName = getCell(row, 'category');
        const subName = getCell(row, 'subcategory');
        if (!secName || !catName) continue;

        const isActive = getCell(row, 'status').toLowerCase() !== 'inactive';
        const secKey = normalizeTaxonomyKey(secName);
        let sector = secByKey.get(secKey);

        if (!sector) {
          const secId = `sec_${secKey}`;
          sector = {
            id: secId,
            code: getCell(row, 'sectorCode') || `SEC-${secKey.slice(0, 6).toUpperCase()}`,
            name: secName,
            normalizedKey: secKey,
            description: getCell(row, 'description'),
            sortOrder: secByKey.size + 1,
            isActive,
            mergedIntoId: null,
            createdAt: now,
            updatedAt: now,
          };
          secByKey.set(secKey, sector);
          writer.set(db.collection('taxonomy_sectors').doc(secId), sector, { merge: true });
        }

        const catKey = normalizeTaxonomyKey(catName);
        const catComposite = `${sector.id}:${catKey}`;
        let category = catByKey.get(catComposite);

        if (!category) {
          const catId = `cat_${catKey}`;
          category = {
            id: catId,
            code: getCell(row, 'categoryCode') || `CAT-${catKey.slice(0, 6).toUpperCase()}`,
            sectorId: sector.id,
            name: catName,
            normalizedKey: catKey,
            description: getCell(row, 'description'),
            sortOrder: catByKey.size + 1,
            isActive,
            mergedIntoId: null,
            createdAt: now,
            updatedAt: now,
          };
          catByKey.set(catComposite, category);
          writer.set(db.collection('taxonomy_categories').doc(catId), category, { merge: true });
          createdCount++;
        } else if (job.conflictMode === 'skip_existing') {
          skippedCount++;
          continue;
        } else {
          updatedCount++;
        }

        const tagNames = getCell(row, 'tags')
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean);
        const tagIds: string[] = [];

        for (const tName of tagNames) {
          const tKey = normalizeTaxonomyKey(tName);
          if (!tKey) continue;
          let tag = tagByKey.get(tKey);
          if (!tag) {
            const tagId = `tag_${tKey}`;
            tag = {
              id: tagId,
              name: tName,
              normalizedKey: tKey,
              sectorId: sector.id,
              categoryId: category.id,
              subcategoryIds: [],
              usageCount: 0,
              isActive: true,
              mergedIntoId: null,
              createdAt: now,
              updatedAt: now,
            };
            tagByKey.set(tKey, tag);
            writer.set(db.collection('taxonomy_tags').doc(tagId), tag, { merge: true });
          }
          tagIds.push(tag.id);
        }

        if (subName) {
          const subKey = normalizeTaxonomyKey(subName);
          const subComposite = `${category.id}:${subKey}`;
          let sub = subByKey.get(subComposite);
          if (!sub) {
            const subId = `sub_${subKey}`;
            sub = {
              id: subId,
              code: getCell(row, 'subcategoryCode') || `SUB-${subKey.slice(0, 6).toUpperCase()}`,
              sectorId: sector.id,
              categoryId: category.id,
              name: subName,
              normalizedKey: subKey,
              description: getCell(row, 'description'),
              tagIds,
              sortOrder: subByKey.size + 1,
              isActive,
              mergedIntoId: null,
              createdAt: now,
              updatedAt: now,
            };
            subByKey.set(subComposite, sub);
            writer.set(db.collection('taxonomy_subcategories').doc(subId), sub, { merge: true });
          } else if (job.conflictMode === 'merge_preserve') {
            const mergedTags = Array.from(new Set([...(sub.tagIds || []), ...tagIds]));
            writer.set(
              db.collection('taxonomy_subcategories').doc(sub.id),
              { tagIds: mergedTags, isActive, updatedAt: now },
              { merge: true }
            );
          }
        }
      }

      await writer.close();
    }

    const completedAt = new Date().toISOString();
    const finalPatch: Partial<ImportJob> = {
      status: 'completed',
      processedRows,
      createdCount,
      updatedCount,
      skippedCount,
      completedAt,
    };
    await jobRef.set(finalPatch, { merge: true });

    await recordAuditLog({
      actorUid: job.uploadedByUid,
      actorName: job.uploadedByName,
      actorRole: 'superadmin',
      module: 'imports',
      action: `${job.type}.import_completed`,
      targetType: 'import_job',
      targetId: jobId,
      summary: `Completed ${job.type} Excel import "${job.fileName}" (${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${job.rejectedCount} rejected)`,
    });

    return { ...job, ...finalPatch } as ImportJob;
  } catch (err) {
    await jobRef.set(
      {
        status: 'failed',
        completedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    throw err;
  }
}

export async function confirmAndStartImportJob(
  jobId: string,
  actor: { uid: string; name: string }
): Promise<ImportJob> {
  const db = requireFirestore();
  const jobRef = db.collection('import_jobs').doc(jobId);
  const snap = await jobRef.get();
  if (!snap.exists) throw new NotFoundError('Import job not found');

  const job = snap.data() as ImportJob;
  if (job.status === 'completed') return job;

  await jobRef.set(
    {
      status: 'confirmed_queued',
      confirmedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'imports',
    action: `${job.type}.import_confirmed`,
    targetType: 'import_job',
    targetId: jobId,
    summary: `Confirmed ${job.type} import job ${job.fileName} (${job.totalRows} rows)`,
  });

  if (process.env.CLOUD_TASKS_QUEUE_PATH && job.totalRows > 1500) {
    await enqueueCloudTask({
      targetPath: '/api/internal/tasks/process-import',
      payload: { jobId },
      taskIdHint: `import_${jobId}`,
    });
    return (await jobRef.get()).data() as ImportJob;
  }

  return executeImportJobInFirestore(jobId);
}

export async function listImportJobs(type?: ImportJobType): Promise<ImportJob[]> {
  const db = requireFirestore();
  const snap = await db
    .collection('import_jobs')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  const all = snap.docs.map((d) => d.data() as ImportJob);
  return type ? all.filter((j) => j.type === type) : all;
}

export function generateClientTemplateWorkbookBuffer(): Buffer {
  const sample = [
    {
      'Client Name': 'Ananya Deshmukh',
      'WhatsApp Number': '+919820112233',
      'Country Code': '+91',
      'Location / City': 'Mumbai',
      State: 'Maharashtra',
      Country: 'India',
      'Business / Company Name': 'Crestline Retail Pvt Ltd',
      'Business Information':
        'Multi-city D2C retail brand procuring packaging, custom software, and warehouse logistics.',
      'Industry Sector': 'Retail, E-Commerce & Consumer Goods',
      'Email (Optional)': 'ananya@crestlineretail.in',
      'Website (Optional)': 'https://crestlineretail.in',
      'Consent Status (opted_in / none)': 'opted_in',
      Source: 'Client Trade Directory 2026',
      Notes: 'Consented via event registration form',
    },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sample);
  XLSX.utils.book_append_sheet(wb, ws, 'Client_Database_Template');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

export function generatePartnerTemplateWorkbookBuffer(): Buffer {
  const sample = [
    {
      'Partner Name': 'Rajesh Sharma',
      'WhatsApp Number': '+919876543210',
      'Country Code': '+91',
      'Location / City': 'Pune',
      State: 'Maharashtra',
      Country: 'India',
      'Business / Agency Name': 'Apex Precision Engineering Pvt Ltd',
      'Services Offered': 'CNC Turning, VMC Milling, Sheet Metal Prototyping',
      Sector: 'Manufacturing & Industrial Supply',
      Category: 'CNC Machining & Metal Fabrication',
      Subcategory: 'Precision Turned & Milled Components',
      'Skills / Expertise Tags': 'CNC Turning, VMC Milling, ISO 9001',
      'Email (Optional)': 'rajesh@apexprecision.in',
      'Website / Portfolio (Optional)': 'https://apexprecision.in',
      'Consent Status (opted_in / none)': 'opted_in',
      Source: 'Verified Partner Directory 2026',
      Notes: 'ISO 9001 certified supplier ready for 5-min WhatsApp leads',
    },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sample);
  XLSX.utils.book_append_sheet(wb, ws, 'Partner_Database_Template');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

export function generateCrmTemplateWorkbookBuffer(): Buffer {
  const sample = [
    {
      'Contact Name': 'Rajesh Sharma',
      'Company / Business Name': 'Apex Precision Engineering Pvt Ltd',
      'WhatsApp Number': '+919876543210',
      'Mobile Number': '+919876543210',
      'Country Code': '+91',
      'City / Location': 'Pune',
      State: 'Maharashtra',
      Country: 'India',
      'Business Information (Clients)': '',
      'Services Offered (Partners)': 'CNC Turning, VMC Milling',
      Sector: 'Manufacturing & Industrial Supply',
      Category: 'CNC Machining & Metal Fabrication',
      Subcategory: 'Precision Turned & Milled Components',
      'Skills / Tags': 'CNC Turning, VMC Milling, ISO 9001',
      'Database Role (Client / Partner)': 'Partner',
      'Consent Status (opted_in / none)': 'opted_in',
      'Email (Optional)': 'rajesh@apexprecision.in',
      'Website (Optional)': 'https://apexprecision.in',
      'Business Entity Type': 'Manufacturer',
      Source: 'Trade Directory 2026',
      Notes: 'ISO 9001 certified automotive supplier',
    },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sample);
  XLSX.utils.book_append_sheet(wb, ws, 'CRM_Contacts_Template');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
