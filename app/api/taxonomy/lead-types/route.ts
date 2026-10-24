import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.leadTypes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.leadTypes.findIndex((lt: any) => lt.code === body.code);
    if (existingIndex >= 0) {
      store.leadTypes[existingIndex] = { ...store.leadTypes[existingIndex], ...body };
    } else {
      store.leadTypes.push({
        code: body.code || 'LT_' + Date.now(),
        name: body.name,
        description: body.description || '',
        mappedSectorsCount: body.mappedSectorsCount || 0,
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.leadTypes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
