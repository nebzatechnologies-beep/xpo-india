import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const sectorCode = searchParams.get('sectorCode');
  let result = store.categories;
  if (sectorCode) {
    result = result.filter((c: any) => c.parentSectorCode === sectorCode);
  }
  return NextResponse.json({ success: true, data: result });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.categories.findIndex((c: any) => c.code === body.code);
    if (existingIndex >= 0) {
      store.categories[existingIndex] = { ...store.categories[existingIndex], ...body };
    } else {
      store.categories.push({
        _id: 'cat_' + Date.now(),
        code: body.code || 'CAT_' + Date.now(),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        parentSectorCode: body.parentSectorCode || 'MFG',
        icon: body.icon || 'Box',
        description: body.description || '',
        subcategoryCount: 0,
        activeLeads: 0,
        status: body.status || 'active',
        isActive: body.status !== 'inactive'
      });
    }
    return NextResponse.json({ success: true, data: store.categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
