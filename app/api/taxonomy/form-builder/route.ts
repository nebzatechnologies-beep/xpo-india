import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('classificationCode') || 'manufacturing-industrial';
  const schema = store.formSchemas[code] || {
    id: 'schema_' + code,
    classificationCode: code,
    classificationName: code.replace(/-/g, ' ').toUpperCase(),
    leadTypeCode: 'buy',
    version: 1,
    fields: [],
    updatedAt: new Date().toISOString()
  };
  return NextResponse.json({ success: true, data: schema, allSchemas: store.formSchemas });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const code = body.classificationCode || 'manufacturing-industrial';
    const currentVersion = store.formSchemas[code]?.version || 0;
    
    store.formSchemas[code] = {
      ...body,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Form schema published successfully',
      data: store.formSchemas[code]
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
