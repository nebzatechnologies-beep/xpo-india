import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const parentCategoryCode = searchParams.get('parentCategoryCode');
  let result = store.subcategories;
  if (parentCategoryCode) {
    result = result.filter((s: any) => s.parentCategoryCode === parentCategoryCode);
  }
  return NextResponse.json({ success: true, data: result });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.subcategories.findIndex((s: any) => s.code === body.code);
    if (existingIndex >= 0) {
      store.subcategories[existingIndex] = { ...store.subcategories[existingIndex], ...body };
    } else {
      store.subcategories.push({
        code: body.code || 'SUB_' + Date.now(),
        name: body.name,
        parentCategoryCode: body.parentCategoryCode || 'CAT_MFG_IND',
        sectorCode: body.sectorCode || 'MFG',
        mappedTags: body.mappedTags || [],
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.subcategories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
