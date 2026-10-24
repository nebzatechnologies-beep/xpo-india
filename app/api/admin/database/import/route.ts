import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { CrmContact, Import } from '@/lib/db/models';
import { ok, err } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'superadmin' && userRole !== 'staff') {
      return err('Forbidden', 403);
    }

    await connectDB();
    const body = await req.json();
    const {
      fileName = 'contacts_import.csv',
      rows = [],
      mapping = {},
      defaultTags = ['Imported'],
    } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return err('No data rows provided for import', 400);
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      try {
        const contactData: Record<string, any> = {
          name: rawRow[mapping.name || 'Name'] || rawRow['name'] || rawRow['Contact Name'] || 'Unknown Contact',
          email: rawRow[mapping.email || 'Email'] || rawRow['email'] || undefined,
          phone: rawRow[mapping.phone || 'Phone'] || rawRow['phone'] || rawRow['Mobile'] || undefined,
          company: rawRow[mapping.company || 'Company'] || rawRow['company'] || rawRow['Company Name'] || undefined,
          country: rawRow[mapping.country || 'Country'] || rawRow['country'] || 'India',
          city: rawRow[mapping.city || 'City'] || rawRow['city'] || undefined,
          industry: rawRow[mapping.industry || 'Industry'] || rawRow['industry'] || undefined,
          category: rawRow[mapping.category || 'Category'] || rawRow['category'] || undefined,
          tags: defaultTags,
          source: 'csv_upload',
          status: 'prospect',
        };

        // Duplicate detection: check by email or phone
        if (contactData.email) {
          const existing = await CrmContact.findOne({ email: contactData.email });
          if (existing) {
            duplicateCount++;
            continue;
          }
        } else if (contactData.phone) {
          const existingPhone = await CrmContact.findOne({ phone: contactData.phone });
          if (existingPhone) {
            duplicateCount++;
            continue;
          }
        }

        await CrmContact.create(contactData);
        importedCount++;
      } catch (errRow: any) {
        errorCount++;
        errors.push({ row: i + 1, reason: errRow.message });
      }
    }

    // Save Import log
    const importLog = await Import.create({
      fileName,
      source: 'csv_upload',
      totalRows: rows.length,
      importedCount,
      duplicateCount,
      errorCount,
      columnMapping: mapping,
      tags: defaultTags,
      importedBy: session?.user?.id,
      importErrors: errors.slice(0, 50),
    });

    return ok({
      message: `Import complete. ${importedCount} imported, ${duplicateCount} duplicates skipped, ${errorCount} errors.`,
      importLog,
      summary: {
        total: rows.length,
        imported: importedCount,
        duplicates: duplicateCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('[POST /api/admin/database/import]', error);
    return err('Failed to process CRM import', 500);
  }
}
