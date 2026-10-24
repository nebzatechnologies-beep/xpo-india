import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

function normalizeKey(str: string): string {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stableSlugId(prefix: string, str: string): string {
  const slug = String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${prefix}_${slug || 'item'}`;
}

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: {
      versions: store.taxonomyVersions,
      categoriesCount: store.taxonomy?.categories?.length || 0,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const { action, rows, conflictMode, description, fileName } = body;

    if (!store.taxonomy) {
      (store as any).taxonomy = { sectors: [], categories: [] };
    }
    const existingCats: any[] = store.taxonomy.categories || [];

    if (action === 'preview' && Array.isArray(rows)) {
      const seenInFile = new Set<string>();
      const evaluated = rows.map((r: any, idx: number) => {
        const sector = String(r.sector || r.Sector || '').trim();
        const cat = String(r.cat || r.category || r.Category || '').trim();
        const sub = String(r.sub || r.subcategory || r.Subcategory || '').trim();
        const tagsRaw = String(r.tags || r.Tags || r.Skills || '').trim();
        const tags = tagsRaw
          ? tagsRaw.split(/[,|]/).map((t) => t.trim()).filter(Boolean)
          : [];

        if (!sector || !cat || !sub) {
          return {
            row: idx + 1,
            type: r.type || 'Buy',
            sector,
            cat,
            sub,
            tags,
            status: 'invalid',
            reason: 'Missing required Sector, Category, or Subcategory',
          };
        }

        const normKey = `${normalizeKey(sector)}::${normalizeKey(cat)}::${normalizeKey(sub)}`;
        if (seenInFile.has(normKey)) {
          return {
            row: idx + 1,
            type: r.type || 'Buy',
            sector,
            cat,
            sub,
            tags,
            status: 'duplicate',
            reason: 'Duplicate row within uploaded file (case-insensitive)',
          };
        }
        seenInFile.add(normKey);

        const existsInDb = existingCats.some(
          (ec: any) =>
            normalizeKey(ec.sectorName || ec.sector) === normalizeKey(sector) &&
            normalizeKey(ec.categoryName || ec.name) === normalizeKey(cat) &&
            normalizeKey(ec.subcategoryName || ec.sub) === normalizeKey(sub)
        );

        return {
          row: idx + 1,
          type: r.type || 'Buy',
          sector,
          cat,
          sub,
          tags,
          status: existsInDb ? 'duplicate' : 'valid',
          reason: existsInDb ? 'Matches existing category (will merge tags safely)' : 'New taxonomy entry',
        };
      });

      return NextResponse.json({
        success: true,
        rows: evaluated,
        summary: {
          totalRows: evaluated.length,
          validRows: evaluated.filter((r) => r.status === 'valid').length,
          duplicateRows: evaluated.filter((r) => r.status === 'duplicate').length,
          invalidRows: evaluated.filter((r) => r.status === 'invalid').length,
          conflictStrategy: conflictMode || 'update_existing',
        },
      });
    }

    if (action === 'publish') {
      const incomingRows: any[] = Array.isArray(rows) ? rows : [];
      let newCount = 0;
      let updatedCount = 0;
      const errors: any[] = [];

      for (const r of incomingRows) {
        const sector = String(r.sector || '').trim();
        const cat = String(r.cat || r.category || '').trim();
        const sub = String(r.sub || r.subcategory || '').trim();
        const tags: string[] = Array.isArray(r.tags)
          ? r.tags
          : String(r.tags || '')
              .split(/[,|]/)
              .map((t) => t.trim())
              .filter(Boolean);

        if (!sector || !cat || !sub) {
          errors.push({ row: r.row, error: 'Missing Sector, Category, or Subcategory' });
          continue;
        }

        // Case-insensitive match against existing categories (never create duplicates due to casing)
        const match = existingCats.find(
          (ec: any) =>
            normalizeKey(ec.sectorName || ec.sector) === normalizeKey(sector) &&
            normalizeKey(ec.categoryName || ec.name) === normalizeKey(cat) &&
            normalizeKey(ec.subcategoryName || ec.sub) === normalizeKey(sub)
        );

        if (match) {
          if (conflictMode !== 'skip_duplicates') {
            const mergedTags = Array.from(new Set([...(match.tags || []), ...tags]));
            match.tags = mergedTags;
            updatedCount++;
          }
        } else {
          existingCats.push({
            id: stableSlugId('tax', `${sector}_${cat}_${sub}`),
            sectorId: stableSlugId('sec', sector),
            sectorCode: sector.slice(0, 3).toUpperCase(),
            sectorName: sector,
            categoryId: stableSlugId('cat', `${sector}_${cat}`),
            categoryName: cat,
            subcategoryId: stableSlugId('sub', `${cat}_${sub}`),
            subcategoryName: sub,
            leadType: r.type || 'Buy',
            tags,
            active: true,
          });
          newCount++;
        }
      }

      const newVersionCode =
        'v' + (4 + store.taxonomyVersions.length * 0.1).toFixed(1) + '.0-RELEASE';
      const versionRecord = {
        version: newVersionCode,
        fileName: fileName || 'xpo_taxonomy_upload.xlsx',
        importedBy: 'Super Admin (admin@xpoindia.com)',
        date:
          new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) +
          ', ' +
          new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        newRecords: newCount || incomingRows.filter((x) => x.status === 'valid').length,
        updatedRecords: updatedCount,
        rejectedRecords: errors.length,
        status: 'Published',
        description:
          description ||
          `Additive Excel taxonomy import (${newCount} created, ${updatedCount} updated, 0 deleted).`,
      };

      store.taxonomyVersions.unshift(versionRecord as any);

      return NextResponse.json({
        success: true,
        message: `Taxonomy snapshot ${newVersionCode} published! (${newCount} created, ${updatedCount} updated)`,
        version: versionRecord,
        errors,
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: 48,
        validRows: 44,
        duplicateRows: 3,
        invalidRows: 1,
        conflictStrategy: conflictMode || 'update_existing',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
