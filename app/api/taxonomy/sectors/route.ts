import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.sectors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.sectors.findIndex((s: any) => s.code === body.code);
    if (existingIndex >= 0) {
      store.sectors[existingIndex] = { ...store.sectors[existingIndex], ...body };
    } else {
      store.sectors.push({
        code: body.code || 'SEC_' + Date.now(),
        name: body.name,
        description: body.description || '',
        categoriesCount: 0,
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.sectors });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
