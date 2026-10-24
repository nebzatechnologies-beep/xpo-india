import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.tags });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'merge') {
      const { sourceTag, targetTag } = body;
      const target = store.tags.find((t: any) => t.name.toLowerCase() === targetTag.toLowerCase());
      const source = store.tags.find((t: any) => t.name.toLowerCase() === sourceTag.toLowerCase());
      if (target && source) {
        target.usageCount += source.usageCount;
        store.tags = store.tags.filter((t: any) => t.name.toLowerCase() !== sourceTag.toLowerCase());
      }
      return NextResponse.json({ success: true, message: 'Tags merged successfully', data: store.tags });
    }

    const existingIndex = store.tags.findIndex((t: any) => t.name.toLowerCase() === body.name.toLowerCase());
    if (existingIndex >= 0) {
      store.tags[existingIndex] = { ...store.tags[existingIndex], ...body };
    } else {
      store.tags.push({
        name: body.name,
        subcategoryCode: body.subcategoryCode || 'SUB_CNC',
        categoryCode: body.categoryCode || 'CAT_MFG_IND',
        usageCount: body.usageCount || 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.tags });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
