import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  try {
    const store = getMockStore();
    const tree = store.leadTypes.map((lt: any) => ({
      ...lt,
      sectors: store.sectors.map((sec: any) => ({
        ...sec,
        categories: store.categories
          .filter((cat: any) => cat.parentSectorCode === sec.code)
          .map((cat: any) => ({
            ...cat,
            subcategories: store.subcategories.filter((sub: any) => sub.parentCategoryCode === cat.code)
          }))
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        tree,
        leadTypes: store.leadTypes,
        sectors: store.sectors,
        categories: store.categories,
        subcategories: store.subcategories,
        tags: store.tags,
        stats: {
          totalLeadTypes: store.leadTypes.length,
          totalSectors: store.sectors.length,
          totalCategories: store.categories.length,
          totalSubcategories: store.subcategories.length,
          totalTags: store.tags.length,
          activeClassifications: store.categories.filter((c: any) => c.status === 'active').length + store.subcategories.filter((s: any) => s.status === 'active').length,
          inactiveClassifications: store.categories.filter((c: any) => c.status === 'inactive').length + store.subcategories.filter((s: any) => s.status === 'inactive').length,
          lastUpdated: 'Today, 14:00 IST'
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
