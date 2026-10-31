import * as XLSX from 'xlsx';
import { requireFirestore } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/services/audit';
import { NotFoundError, ValidationError } from '@/lib/utils/api-handler';
import { normalizeTaxonomyKey } from '@/lib/utils/format';
import { generateDocId } from '@/lib/utils/id-generator';
import type {
  CustomFormField,
  TaxonomyCategory,
  TaxonomyFormSchema,
  TaxonomySector,
  TaxonomySubcategory,
  TaxonomyTag,
} from '@/lib/types/domain';

export interface TaxonomySubcategoryNode extends TaxonomySubcategory {
  tags?: TaxonomyTag[];
}

export interface TaxonomyCategoryNode extends TaxonomyCategory {
  subcategories?: TaxonomySubcategoryNode[];
}

export interface TaxonomySectorNode extends TaxonomySector {
  categories?: TaxonomyCategoryNode[];
}

export interface FullTaxonomyTree {
  sectors: TaxonomySector[];
  categories: TaxonomyCategory[];
  subcategories: TaxonomySubcategory[];
  tags: TaxonomyTag[];
  tree: TaxonomySectorNode[];
}

const INITIAL_TAXONOMY_BLUEPRINT: Array<{
  code: string;
  name: string;
  description: string;
  categories: Array<{
    code: string;
    name: string;
    subcategories: Array<{ code: string; name: string; tags: string[] }>;
  }>;
}> = [
  {
    code: 'SEC-TECH',
    name: 'Technology & Software',
    description: 'Software engineering, cloud infrastructure, AI, mobile apps, and IT consulting',
    categories: [
      {
        code: 'CAT-WEB-APP',
        name: 'Web & Mobile Development',
        subcategories: [
          {
            code: 'SUB-FULLSTACK',
            name: 'Full-Stack & SaaS Engineering',
            tags: ['Next.js', 'React', 'Node.js', 'TypeScript', 'Firebase', 'Cloud Architecture'],
          },
          {
            code: 'SUB-MOBILE',
            name: 'iOS, Android & Cross-Platform Apps',
            tags: ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Mobile UI'],
          },
        ],
      },
      {
        code: 'CAT-ERP-AI',
        name: 'Enterprise ERP, Data & AI',
        subcategories: [
          {
            code: 'SUB-AI-AUTO',
            name: 'AI, Automation & WhatsApp Bots',
            tags: ['Python', 'LLM Integration', 'WhatsApp Cloud API', 'Workflow Automation'],
          },
          {
            code: 'SUB-ERP-CRM',
            name: 'ERP, CRM & Cloud Migration',
            tags: ['SAP', 'Odoo', 'Salesforce', 'AWS', 'GCP', 'DevOps'],
          },
        ],
      },
    ],
  },
  {
    code: 'SEC-MFG',
    name: 'Manufacturing & Industrial Supply',
    description: 'Precision machining, OEM fabrication, packaging, electricals, and bulk supply',
    categories: [
      {
        code: 'CAT-CNC-FAB',
        name: 'CNC Machining & Metal Fabrication',
        subcategories: [
          {
            code: 'SUB-PRECISION',
            name: 'Precision Turned & Milled Components',
            tags: ['CNC Turning', 'VMC Milling', 'Sheet Metal', 'ISO 9001', 'Laser Cutting'],
          },
        ],
      },
      {
        code: 'CAT-PACK-RAW',
        name: 'Industrial Packaging & Raw Materials',
        subcategories: [
          {
            code: 'SUB-CORRUGATED',
            name: 'Corrugated, Flexible & Custom Packaging',
            tags: ['Corrugated Boxes', 'Mono Cartons', 'BOPP Films', 'Palletizing'],
          },
        ],
      },
    ],
  },
  {
    code: 'SEC-DESIGN',
    name: 'Design, Branding & Digital Growth',
    description: 'Brand identity, UI/UX design, performance marketing, and video production',
    categories: [
      {
        code: 'CAT-UIUX-BRAND',
        name: 'Brand Identity & UI/UX Design',
        subcategories: [
          {
            code: 'SUB-PROD-DESIGN',
            name: 'Product UI/UX & Design Systems',
            tags: ['Figma', 'Design Systems', 'Prototyping', 'Brand Guidelines'],
          },
        ],
      },
      {
        code: 'CAT-PERF-MKT',
        name: 'Performance Marketing & SEO',
        subcategories: [
          {
            code: 'SUB-GROWTH-ADS',
            name: 'Meta, Google Ads & B2B Lead Generation',
            tags: ['Meta Ads', 'Google Ads', 'Technical SEO', 'B2B Demand Gen'],
          },
        ],
      },
    ],
  },
  {
    code: 'SEC-INFRA',
    name: 'Construction, Interiors & EPC',
    description: 'Commercial interiors, civil contracting, MEP engineering, and solar EPC',
    categories: [
      {
        code: 'CAT-COMM-INT',
        name: 'Commercial & Office Interiors',
        subcategories: [
          {
            code: 'SUB-TURNKEY-FIT',
            name: 'Turnkey Office & Retail Fit-Outs',
            tags: ['Turnkey Interiors', 'HVAC', 'Modular Workstations', 'MEP Contracting'],
          },
        ],
      },
      {
        code: 'CAT-SOLAR-EPC',
        name: 'Solar & Electrical EPC',
        subcategories: [
          {
            code: 'SUB-ROOFTOP-SOLAR',
            name: 'Commercial & Industrial Solar Rooftop',
            tags: ['Solar EPC', 'Net Metering', 'LT/HT Panels', 'Energy Audit'],
          },
        ],
      },
    ],
  },
  {
    code: 'SEC-CORP',
    name: 'Finance, Legal & HR Advisory',
    description: 'Chartered accountancy, GST/tax compliance, corporate legal, and staffing',
    categories: [
      {
        code: 'CAT-FIN-TAX',
        name: 'Accounting, GST & Virtual CFO',
        subcategories: [
          {
            code: 'SUB-GST-AUDIT',
            name: 'Statutory Audit, GST & ROC Compliance',
            tags: ['GST Filing', 'Statutory Audit', 'Virtual CFO', 'FEMA & Export Compliance'],
          },
        ],
      },
    ],
  },
];

export async function ensureInitialTaxonomySeeded(): Promise<void> {
  const db = requireFirestore();
  const check = await db.collection('taxonomy_sectors').limit(1).get();
  if (!check.empty) return;

  const now = new Date().toISOString();
  const batch = db.batch();
  let secOrder = 1;

  for (const secDef of INITIAL_TAXONOMY_BLUEPRINT) {
    const sectorId = `sec_${normalizeTaxonomyKey(secDef.name)}`;
    const sectorDoc: TaxonomySector = {
      id: sectorId,
      code: secDef.code,
      name: secDef.name,
      normalizedKey: normalizeTaxonomyKey(secDef.name),
      description: secDef.description,
      sortOrder: secOrder++,
      isActive: true,
      mergedIntoId: null,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(db.collection('taxonomy_sectors').doc(sectorId), sectorDoc);

    let catOrder = 1;
    for (const catDef of secDef.categories) {
      const categoryId = `cat_${normalizeTaxonomyKey(catDef.name)}`;
      const catDoc: TaxonomyCategory = {
        id: categoryId,
        code: catDef.code,
        sectorId,
        name: catDef.name,
        normalizedKey: normalizeTaxonomyKey(catDef.name),
        sortOrder: catOrder++,
        isActive: true,
        mergedIntoId: null,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(db.collection('taxonomy_categories').doc(categoryId), catDoc);

      let subOrder = 1;
      for (const subDef of catDef.subcategories) {
        const subcategoryId = `sub_${normalizeTaxonomyKey(subDef.name)}`;
        const tagIds: string[] = [];

        for (const tagName of subDef.tags) {
          const tagKey = normalizeTaxonomyKey(tagName);
          const tagId = `tag_${tagKey}`;
          tagIds.push(tagId);
          const tagDoc: TaxonomyTag = {
            id: tagId,
            name: tagName,
            normalizedKey: tagKey,
            sectorId,
            categoryId,
            subcategoryIds: [subcategoryId],
            usageCount: 0,
            isActive: true,
            mergedIntoId: null,
            createdAt: now,
            updatedAt: now,
          };
          batch.set(db.collection('taxonomy_tags').doc(tagId), tagDoc, { merge: true });
        }

        const subDoc: TaxonomySubcategory = {
          id: subcategoryId,
          code: subDef.code,
          sectorId,
          categoryId,
          name: subDef.name,
          normalizedKey: normalizeTaxonomyKey(subDef.name),
          tagIds,
          sortOrder: subOrder++,
          isActive: true,
          mergedIntoId: null,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(db.collection('taxonomy_subcategories').doc(subcategoryId), subDoc);
      }
    }
  }

  await batch.commit();
}

export async function getFullTaxonomyTree(options?: {
  includeInactive?: boolean;
}): Promise<FullTaxonomyTree> {
  await ensureInitialTaxonomySeeded();
  const db = requireFirestore();
  const includeInactive = Boolean(options?.includeInactive);

  const [secSnap, catSnap, subSnap, tagSnap] = await Promise.all([
    db.collection('taxonomy_sectors').orderBy('sortOrder', 'asc').get(),
    db.collection('taxonomy_categories').orderBy('sortOrder', 'asc').get(),
    db.collection('taxonomy_subcategories').orderBy('sortOrder', 'asc').get(),
    db.collection('taxonomy_tags').get(),
  ]);

  let sectors = secSnap.docs.map((d) => d.data() as TaxonomySector);
  let categories = catSnap.docs.map((d) => d.data() as TaxonomyCategory);
  let subcategories = subSnap.docs.map((d) => d.data() as TaxonomySubcategory);
  let tags = tagSnap.docs
    .map((d) => d.data() as TaxonomyTag)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!includeInactive) {
    sectors = sectors.filter((s) => s.isActive && !s.mergedIntoId);
    categories = categories.filter((c) => c.isActive && !c.mergedIntoId);
    subcategories = subcategories.filter((s) => s.isActive && !s.mergedIntoId);
    tags = tags.filter((t) => t.isActive && !t.mergedIntoId);
  }

  // Construct nested tree hierarchy: Sector -> Category -> Subcategory -> Tags
  const subcategoryMap = new Map<string, TaxonomySubcategoryNode[]>();
  for (const sub of subcategories) {
    const matchingTags = tags.filter(
      (t) =>
        (sub.tagIds && sub.tagIds.includes(t.id)) ||
        (t.subcategoryIds && t.subcategoryIds.includes(sub.id))
    );
    const subNode: TaxonomySubcategoryNode = {
      ...sub,
      tags: matchingTags,
    };
    const list = subcategoryMap.get(sub.categoryId) || [];
    list.push(subNode);
    subcategoryMap.set(sub.categoryId, list);
  }

  const categoryMap = new Map<string, TaxonomyCategoryNode[]>();
  for (const cat of categories) {
    const catNode: TaxonomyCategoryNode = {
      ...cat,
      subcategories: subcategoryMap.get(cat.id) || [],
    };
    const list = categoryMap.get(cat.sectorId) || [];
    list.push(catNode);
    categoryMap.set(cat.sectorId, list);
  }

  const tree: TaxonomySectorNode[] = sectors.map((sec) => ({
    ...sec,
    categories: categoryMap.get(sec.id) || [],
  }));

  return { sectors, categories, subcategories, tags, tree };
}

export async function createOrUpdateSector(
  input: {
    id?: string;
    code?: string;
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<TaxonomySector> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const normalizedKey = normalizeTaxonomyKey(input.name);
  if (!normalizedKey) throw new ValidationError('Sector name is required');

  if (input.id) {
    const ref = db.collection('taxonomy_sectors').doc(input.id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Sector not found');
    const existing = snap.data() as TaxonomySector;
    const updated: TaxonomySector = {
      ...existing,
      name: input.name.trim(),
      normalizedKey,
      code: input.code?.trim() || existing.code,
      description: input.description ?? existing.description,
      icon: input.icon ?? existing.icon,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: now,
    };
    await ref.set(updated);
    await recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: 'superadmin',
      module: 'taxonomy',
      action: 'sector.updated',
      targetType: 'taxonomy_sector',
      targetId: updated.id,
      summary: `Updated sector "${updated.name}"`,
    });
    return updated;
  }

  // Deduplicate sector by normalizedKey if no explicit id is provided
  const existingSectorSnap = await db
    .collection('taxonomy_sectors')
    .where('normalizedKey', '==', normalizedKey)
    .limit(1)
    .get();

  if (!existingSectorSnap.empty) {
    const existing = existingSectorSnap.docs[0]!.data() as TaxonomySector;
    const updated: TaxonomySector = {
      ...existing,
      name: input.name.trim(),
      description: input.description ?? existing.description,
      icon: input.icon ?? existing.icon,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? true,
      updatedAt: now,
    };
    await db.collection('taxonomy_sectors').doc(existing.id).set(updated, { merge: true });
    return updated;
  }

  const id = generateDocId('sec');
  const created: TaxonomySector = {
    id,
    code: input.code?.trim() || `SEC-${normalizedKey.slice(0, 6).toUpperCase()}`,
    name: input.name.trim(),
    normalizedKey,
    description: input.description || '',
    icon: input.icon,
    sortOrder: input.sortOrder ?? 99,
    isActive: input.isActive ?? true,
    mergedIntoId: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('taxonomy_sectors').doc(id).set(created);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: 'sector.created',
    targetType: 'taxonomy_sector',
    targetId: id,
    summary: `Created sector "${created.name}"`,
  });
  return created;
}

export async function createOrUpdateCategory(
  input: {
    id?: string;
    sectorId: string;
    code?: string;
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<TaxonomyCategory> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const normalizedKey = normalizeTaxonomyKey(input.name);
  if (!normalizedKey) throw new ValidationError('Category name is required');

  const secSnap = await db.collection('taxonomy_sectors').doc(input.sectorId).get();
  if (!secSnap.exists) throw new ValidationError('Valid parent Sector is required');

  if (input.id) {
    const ref = db.collection('taxonomy_categories').doc(input.id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Category not found');
    const existing = snap.data() as TaxonomyCategory;
    const updated: TaxonomyCategory = {
      ...existing,
      sectorId: input.sectorId,
      name: input.name.trim(),
      normalizedKey,
      code: input.code?.trim() || existing.code,
      description: input.description ?? existing.description,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: now,
    };
    await ref.set(updated);
    await recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: 'superadmin',
      module: 'taxonomy',
      action: 'category.updated',
      targetType: 'taxonomy_category',
      targetId: updated.id,
      summary: `Updated category "${updated.name}"`,
    });
    return updated;
  }

  // Deduplicate category by sectorId + normalizedKey if no explicit id is provided
  const existingCatSnap = await db
    .collection('taxonomy_categories')
    .where('sectorId', '==', input.sectorId)
    .where('normalizedKey', '==', normalizedKey)
    .limit(1)
    .get();

  if (!existingCatSnap.empty) {
    const existing = existingCatSnap.docs[0]!.data() as TaxonomyCategory;
    const updated: TaxonomyCategory = {
      ...existing,
      name: input.name.trim(),
      description: input.description ?? existing.description,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? true,
      updatedAt: now,
    };
    await db.collection('taxonomy_categories').doc(existing.id).set(updated, { merge: true });
    return updated;
  }

  const id = generateDocId('cat');
  const created: TaxonomyCategory = {
    id,
    code: input.code?.trim() || `CAT-${normalizedKey.slice(0, 6).toUpperCase()}`,
    sectorId: input.sectorId,
    name: input.name.trim(),
    normalizedKey,
    description: input.description || '',
    sortOrder: input.sortOrder ?? 99,
    isActive: input.isActive ?? true,
    mergedIntoId: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('taxonomy_categories').doc(id).set(created);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: 'category.created',
    targetType: 'taxonomy_category',
    targetId: id,
    summary: `Created category "${created.name}"`,
  });
  return created;
}

export async function createOrUpdateSubcategory(
  input: {
    id?: string;
    sectorId: string;
    categoryId: string;
    code?: string;
    name: string;
    description?: string;
    tagIds?: string[];
    sortOrder?: number;
    isActive?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<TaxonomySubcategory> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const normalizedKey = normalizeTaxonomyKey(input.name);
  if (!normalizedKey) throw new ValidationError('Subcategory name is required');

  const catSnap = await db.collection('taxonomy_categories').doc(input.categoryId).get();
  if (!catSnap.exists) throw new ValidationError('Valid parent Category is required');

  if (input.id) {
    const ref = db.collection('taxonomy_subcategories').doc(input.id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Subcategory not found');
    const existing = snap.data() as TaxonomySubcategory;
    const updated: TaxonomySubcategory = {
      ...existing,
      sectorId: input.sectorId,
      categoryId: input.categoryId,
      name: input.name.trim(),
      normalizedKey,
      code: input.code?.trim() || existing.code,
      description: input.description ?? existing.description,
      tagIds: input.tagIds ?? existing.tagIds,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: now,
    };
    await ref.set(updated);
    await recordAuditLog({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: 'superadmin',
      module: 'taxonomy',
      action: 'subcategory.updated',
      targetType: 'taxonomy_subcategory',
      targetId: updated.id,
      summary: `Updated subcategory "${updated.name}"`,
    });
    return updated;
  }

  // Deduplicate subcategory by categoryId + normalizedKey if no explicit id is provided
  const existingSubSnap = await db
    .collection('taxonomy_subcategories')
    .where('categoryId', '==', input.categoryId)
    .where('normalizedKey', '==', normalizedKey)
    .limit(1)
    .get();

  if (!existingSubSnap.empty) {
    const existing = existingSubSnap.docs[0]!.data() as TaxonomySubcategory;
    const mergedTags = Array.from(
      new Set([...(existing.tagIds || []), ...(input.tagIds || [])])
    );
    const updated: TaxonomySubcategory = {
      ...existing,
      name: input.name.trim(),
      description: input.description ?? existing.description,
      tagIds: mergedTags,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? true,
      updatedAt: now,
    };
    await db.collection('taxonomy_subcategories').doc(existing.id).set(updated, { merge: true });
    return updated;
  }

  const id = generateDocId('sub');
  const created: TaxonomySubcategory = {
    id,
    code: input.code?.trim() || `SUB-${normalizedKey.slice(0, 6).toUpperCase()}`,
    sectorId: input.sectorId,
    categoryId: input.categoryId,
    name: input.name.trim(),
    normalizedKey,
    description: input.description || '',
    tagIds: input.tagIds || [],
    sortOrder: input.sortOrder ?? 99,
    isActive: input.isActive ?? true,
    mergedIntoId: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('taxonomy_subcategories').doc(id).set(created);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: 'subcategory.created',
    targetType: 'taxonomy_subcategory',
    targetId: id,
    summary: `Created subcategory "${created.name}"`,
  });
  return created;
}

export async function createOrUpdateTag(
  input: {
    id?: string;
    name: string;
    sectorId?: string;
    categoryId?: string;
    subcategoryIds?: string[];
    isActive?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<TaxonomyTag> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const normalizedKey = normalizeTaxonomyKey(input.name);
  if (!normalizedKey) throw new ValidationError('Tag / Skill name is required');

  if (input.id) {
    const ref = db.collection('taxonomy_tags').doc(input.id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Tag not found');
    const existing = snap.data() as TaxonomyTag;
    const updated: TaxonomyTag = {
      ...existing,
      name: input.name.trim(),
      normalizedKey,
      sectorId: input.sectorId ?? existing.sectorId,
      categoryId: input.categoryId ?? existing.categoryId,
      subcategoryIds: input.subcategoryIds ?? existing.subcategoryIds,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: now,
    };
    await ref.set(updated);
    return updated;
  }

  // Deduplicate by normalizedKey
  const dup = await db
    .collection('taxonomy_tags')
    .where('normalizedKey', '==', normalizedKey)
    .limit(1)
    .get();

  if (!dup.empty) {
    const existing = dup.docs[0]!.data() as TaxonomyTag;
    const mergedSubs = Array.from(
      new Set([...(existing.subcategoryIds || []), ...(input.subcategoryIds || [])])
    );
    const updated: TaxonomyTag = {
      ...existing,
      isActive: input.isActive ?? true,
      subcategoryIds: mergedSubs,
      updatedAt: now,
    };
    await db.collection('taxonomy_tags').doc(existing.id).set(updated);
    return updated;
  }

  const id = generateDocId('tag');
  const created: TaxonomyTag = {
    id,
    name: input.name.trim(),
    normalizedKey,
    sectorId: input.sectorId,
    categoryId: input.categoryId,
    subcategoryIds: input.subcategoryIds || [],
    usageCount: 0,
    isActive: input.isActive ?? true,
    mergedIntoId: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection('taxonomy_tags').doc(id).set(created);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: 'tag.created',
    targetType: 'taxonomy_tag',
    targetId: id,
    summary: `Created skill/tag "${created.name}"`,
  });
  return created;
}

/**
 * Merges a duplicate taxonomy entity into a target canonical entity without breaking
 * existing user profiles, CRM contacts, requirements, or job postings (Report 1 Sec 9.3).
 */
export async function mergeTaxonomyEntity(
  params: {
    level: 'sector' | 'category' | 'subcategory' | 'tag';
    sourceId: string;
    targetId: string;
  },
  actor: { uid: string; name: string }
): Promise<{ remappedCount: number }> {
  if (params.sourceId === params.targetId) {
    throw new ValidationError('Source and target taxonomy IDs must be different.');
  }

  const db = requireFirestore();
  const collectionMap = {
    sector: 'taxonomy_sectors',
    category: 'taxonomy_categories',
    subcategory: 'taxonomy_subcategories',
    tag: 'taxonomy_tags',
  } as const;

  const col = collectionMap[params.level];
  const [sourceSnap, targetSnap] = await Promise.all([
    db.collection(col).doc(params.sourceId).get(),
    db.collection(col).doc(params.targetId).get(),
  ]);

  if (!sourceSnap.exists || !targetSnap.exists) {
    throw new NotFoundError('Source or target taxonomy item was not found.');
  }

  const now = new Date().toISOString();
  const writer = db.bulkWriter();
  let remappedCount = 0;

  writer.update(sourceSnap.ref, {
    isActive: false,
    mergedIntoId: params.targetId,
    updatedAt: now,
  });

  if (params.level === 'sector') {
    const cats = await db
      .collection('taxonomy_categories')
      .where('sectorId', '==', params.sourceId)
      .get();
    for (const doc of cats.docs) {
      writer.update(doc.ref, { sectorId: params.targetId, updatedAt: now });
      remappedCount++;
    }
  } else if (params.level === 'category') {
    const targetData = targetSnap.data() as TaxonomyCategory;
    const subs = await db
      .collection('taxonomy_subcategories')
      .where('categoryId', '==', params.sourceId)
      .get();
    for (const doc of subs.docs) {
      writer.update(doc.ref, {
        categoryId: params.targetId,
        sectorId: targetData.sectorId,
        updatedAt: now,
      });
      remappedCount++;
    }
    const reqs = await db
      .collection('requirements')
      .where('categoryId', '==', params.sourceId)
      .get();
    for (const doc of reqs.docs) {
      writer.update(doc.ref, {
        categoryId: params.targetId,
        categoryName: targetData.name,
        updatedAt: now,
      });
      remappedCount++;
    }
  } else if (params.level === 'subcategory') {
    const targetData = targetSnap.data() as TaxonomySubcategory;
    const reqs = await db
      .collection('requirements')
      .where('subcategoryId', '==', params.sourceId)
      .get();
    for (const doc of reqs.docs) {
      writer.update(doc.ref, {
        subcategoryId: params.targetId,
        subcategoryName: targetData.name,
        updatedAt: now,
      });
      remappedCount++;
    }
    const profs = await db
      .collection('role_profiles')
      .where('subcategoryIds', 'array-contains', params.sourceId)
      .get();
    for (const doc of profs.docs) {
      const p = doc.data() as Record<string, unknown>;
      const existingSubs = Array.isArray(p.subcategoryIds) ? (p.subcategoryIds as string[]) : [];
      const updatedSubs = Array.from(
        new Set(existingSubs.map((id) => (id === params.sourceId ? params.targetId : id)))
      );
      writer.update(doc.ref, { subcategoryIds: updatedSubs, updatedAt: now });
      remappedCount++;
    }
  } else if (params.level === 'tag') {
    const subs = await db
      .collection('taxonomy_subcategories')
      .where('tagIds', 'array-contains', params.sourceId)
      .get();
    for (const doc of subs.docs) {
      const s = doc.data() as Record<string, unknown>;
      const existingTags = Array.isArray(s.tagIds) ? (s.tagIds as string[]) : [];
      const updatedTags = Array.from(
        new Set(existingTags.map((id) => (id === params.sourceId ? params.targetId : id)))
      );
      writer.update(doc.ref, { tagIds: updatedTags, updatedAt: now });
      remappedCount++;
    }
    const profs = await db
      .collection('role_profiles')
      .where('skillTagIds', 'array-contains', params.sourceId)
      .get();
    for (const doc of profs.docs) {
      const p = doc.data() as Record<string, unknown>;
      const existingTags = Array.isArray(p.skillTagIds) ? (p.skillTagIds as string[]) : [];
      const updatedTags = Array.from(
        new Set(existingTags.map((id) => (id === params.sourceId ? params.targetId : id)))
      );
      writer.update(doc.ref, { skillTagIds: updatedTags, updatedAt: now });
      remappedCount++;
    }
  }

  await writer.close();

  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: `${params.level}.merged`,
    targetType: col,
    targetId: params.targetId,
    summary: `Merged ${params.level} ${params.sourceId} -> ${params.targetId} (${remappedCount} child records remapped)`,
  });

  return { remappedCount };
}

export async function getTaxonomyFormSchema(targetId: string): Promise<TaxonomyFormSchema | null> {
  const db = requireFirestore();
  const snap = await db.collection('taxonomy_form_schemas').doc(targetId).get();
  if (!snap.exists) return null;
  return snap.data() as TaxonomyFormSchema;
}

export async function saveTaxonomyFormSchema(
  input: {
    targetType: 'category' | 'subcategory';
    targetId: string;
    fields: CustomFormField[];
  },
  actor: { uid: string; name: string }
): Promise<TaxonomyFormSchema> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const doc: TaxonomyFormSchema = {
    id: input.targetId,
    targetType: input.targetType,
    targetId: input.targetId,
    fields: input.fields.map((f, idx) => ({ ...f, order: idx + 1 })),
    updatedBy: actor.uid,
    updatedAt: now,
  };
  await db.collection('taxonomy_form_schemas').doc(input.targetId).set(doc);
  await recordAuditLog({
    actorUid: actor.uid,
    actorName: actor.name,
    actorRole: 'superadmin',
    module: 'taxonomy',
    action: 'form_schema.saved',
    targetType: input.targetType,
    targetId: input.targetId,
    summary: `Saved ${input.fields.length} custom form fields for ${input.targetType} ${input.targetId}`,
  });
  return doc;
}

export async function exportTaxonomyWorkbookBuffer(): Promise<Buffer> {
  const tree = await getFullTaxonomyTree({ includeInactive: true });
  const secMap = new Map(tree.sectors.map((s) => [s.id, s]));
  const catMap = new Map(tree.categories.map((c) => [c.id, c]));
  const tagMap = new Map(tree.tags.map((t) => [t.id, t]));

  const rows: Array<Record<string, string>> = [];
  for (const sub of tree.subcategories) {
    const sec = secMap.get(sub.sectorId);
    const cat = catMap.get(sub.categoryId);
    const tagNames = (sub.tagIds || [])
      .map((tid) => tagMap.get(tid)?.name)
      .filter(Boolean)
      .join(', ');

    rows.push({
      'Sector Code': sec?.code || '',
      Sector: sec?.name || '',
      'Category Code': cat?.code || '',
      Category: cat?.name || '',
      'Subcategory Code': sub.code,
      Subcategory: sub.name,
      'Tags / Skills': tagNames,
      Description: sub.description || cat?.description || sec?.description || '',
      Status: sub.isActive ? 'Active' : 'Inactive',
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'XPO_Taxonomy');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
