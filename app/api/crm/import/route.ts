import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';
import { normalizePhoneE164 } from '@/lib/whatsapp/phone';

export type CrmClassificationRole = 'Client' | 'Partner' | 'Employer' | 'Job Seeker';

function inferClassifications(row: any): CrmClassificationRole[] {
  const roles = new Set<CrmClassificationRole>();
  const rawClass = String(
    row.classification || row.customerClassification || row.businessType || row.designation || ''
  ).toLowerCase();

  if (rawClass.includes('client') || rawClass.includes('buyer') || rawClass.includes('owner')) {
    roles.add('Client');
  }
  if (
    rawClass.includes('partner') ||
    rawClass.includes('supplier') ||
    rawClass.includes('manufacturer') ||
    rawClass.includes('freelancer') ||
    rawClass.includes('consultant') ||
    rawClass.includes('agency') ||
    rawClass.includes('vendor')
  ) {
    roles.add('Partner');
  }
  if (rawClass.includes('employer') || rawClass.includes('hr') || rawClass.includes('recruiter')) {
    roles.add('Employer');
  }
  if (
    rawClass.includes('job') ||
    rawClass.includes('candidate') ||
    rawClass.includes('student') ||
    rawClass.includes('seeker')
  ) {
    roles.add('Job Seeker');
  }

  // Default to both Client & Partner for B2B companies if not explicitly narrowed
  if (roles.size === 0) {
    roles.add('Client');
    roles.add('Partner');
  }

  return Array.from(roles);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
    const action = body.action || 'import';

    const evaluatedRows = rows.map((r: any, index: number) => {
      const rawPhone = r.whatsapp || r.phone || r.mobile || '';
      const countryHint = r.countryCode || r.country || '';
      const phoneNorm = normalizePhoneE164(rawPhone, countryHint);

      const email = String(r.email || '').trim().toLowerCase();
      const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      const classifications = Array.isArray(r.classifications) && r.classifications.length > 0
        ? r.classifications
        : inferClassifications(r);

      const existingMatch = store.crmContacts.find((c: any) => {
        const cNorm = normalizePhoneE164(c.whatsapp || c.phone, c.country);
        const samePhone = phoneNorm.valid && cNorm.valid && cNorm.e164 === phoneNorm.e164;
        const sameEmail = Boolean(email && c.email && String(c.email).toLowerCase() === email);
        return samePhone || sameEmail;
      });

      let status: 'valid_new' | 'duplicate_merge' | 'invalid' = 'valid_new';
      let errorReason = '';

      if (!phoneNorm.valid) {
        status = 'invalid';
        errorReason = phoneNorm.error || 'Invalid phone number';
      } else if (!emailValid) {
        status = 'invalid';
        errorReason = 'Malformed email address';
      } else if (!r.name && !r.company) {
        status = 'invalid';
        errorReason = 'At least Contact Name or Company Name is required';
      } else if (existingMatch) {
        status = 'duplicate_merge';
        errorReason = `Matches existing contact (${existingMatch.company || existingMatch.name}) — will safely merge non-empty fields`;
      }

      const consentRaw = String(r.consentStatus || r.marketingConsent || 'opted_in').toLowerCase();
      const consentStatus =
        consentRaw.includes('out') || consentRaw.includes('stop')
          ? 'opted_out'
          : consentRaw.includes('in') || consentRaw.includes('yes')
          ? 'opted_in'
          : 'imported_prospect';

      return {
        rowNumber: index + 1,
        name: String(r.name || r.contact || 'Contact').trim(),
        company: String(r.company || 'Individual / Independent').trim(),
        designation: String(r.designation || '').trim(),
        businessType: String(r.businessType || 'Company').trim(),
        originalPhoneRaw: phoneNorm.originalRaw,
        e164Phone: phoneNorm.e164,
        countryCode: phoneNorm.countryCode,
        countryIso: phoneNorm.countryIso,
        email, // Optional per Module 7
        website: String(r.website || '').trim(),
        country: String(r.country || (phoneNorm.countryIso === 'IN' ? 'India' : phoneNorm.countryIso)).trim(),
        state: String(r.state || '').trim(),
        city: String(r.city || '').trim(),
        industry: String(r.industry || r.sector || 'General').trim(),
        category: String(r.category || '').trim(),
        subcategory: String(r.subcategory || '').trim(),
        skills: String(r.skills || '').trim(),
        classifications,
        source: String(r.source || 'xlsx_import').trim(),
        notes: String(r.notes || '').trim(),
        consentStatus,
        consentSource: String(r.consentSource || 'Excel Database Upload').trim(),
        consentTimestamp: r.consentTimestamp || new Date().toISOString(),
        status,
        errorReason,
        existingContactId: existingMatch?.id || null,
      };
    });

    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        rows: evaluatedRows,
        summary: {
          totalRows: evaluatedRows.length,
          validNewCount: evaluatedRows.filter((r) => r.status === 'valid_new').length,
          duplicateMergeCount: evaluatedRows.filter((r) => r.status === 'duplicate_merge').length,
          invalidCount: evaluatedRows.filter((r) => r.status === 'invalid').length,
        },
      });
    }

    let importedCount = 0;
    let mergedCount = 0;
    const rejectedRows: any[] = [];

    for (const item of evaluatedRows) {
      if (item.status === 'invalid') {
        rejectedRows.push(item);
        continue;
      }

      if (item.status === 'duplicate_merge' && item.existingContactId) {
        const target = store.crmContacts.find((c: any) => c.id === item.existingContactId) as any;
        if (target) {
          // Safe merge (Module 9): enrich missing fields, preserve audit trail, never overwrite opted_out
          if (!target.website && item.website) target.website = item.website;
          if (!target.email && item.email) target.email = item.email;
          if (!target.city && item.city) target.city = item.city;
          if (!target.skills && item.skills) target.skills = item.skills;
          target.classifications = Array.from(
            new Set([...(target.classifications || []), ...item.classifications])
          );
          if (target.consentStatus !== 'opted_out' && item.consentStatus === 'opted_out') {
            target.consentStatus = 'opted_out';
          }
          mergedCount++;
        }
        continue;
      }

      store.crmContacts.unshift({
        id: 'crm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: item.name,
        company: item.company,
        designation: item.designation,
        businessType: item.businessType,
        phone: item.e164Phone,
        whatsapp: item.e164Phone,
        originalImportedPhone: item.originalPhoneRaw,
        countryCode: item.countryCode,
        email: item.email, // Optional!
        website: item.website,
        country: item.country,
        state: item.state,
        city: item.city,
        industry: item.industry,
        category: item.category,
        subcategory: item.subcategory,
        skills: item.skills,
        classifications: item.classifications,
        crmLifecycleStatus:
          item.consentStatus === 'opted_out'
            ? 'opted_out'
            : item.consentStatus === 'opted_in'
            ? 'marketing_opt_in'
            : 'imported_prospect',
        sectorCode: item.industry.slice(0, 3).toUpperCase() || 'MFG',
        source: item.source,
        notes: item.notes,
        status: 'imported_prospect',
        consentStatus: item.consentStatus === 'opted_out' ? 'opted_out' : 'opted_in',
        consentSource: item.consentSource,
        consentTimestamp: item.consentTimestamp,
        campaignHistoryCount: 0,
        createdAt: new Date().toISOString(),
      } as any);
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${evaluatedRows.length} rows: ${importedCount} new contacts imported, ${mergedCount} duplicates safely merged, ${rejectedRows.length} invalid rows skipped.`,
      importedCount,
      mergedCount,
      rejectedCount: rejectedRows.length,
      rejectedRows,
      totalContacts: store.crmContacts.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
