import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappTemplates
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'sync') {
      return NextResponse.json({
        success: true,
        message: 'Synchronised 3 Meta WABA Message Templates successfully.',
        data: store.whatsappTemplates
      });
    }

    const newTemplate = {
      id: 'tpl_' + (store.whatsappTemplates.length + 1).toString().padStart(3, '0'),
      name: body.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: body.category || 'MARKETING',
      language: body.language || 'en_US',
      headerType: body.headerType || 'TEXT',
      headerText: body.headerText || '',
      bodyText: body.bodyText,
      footerText: body.footerText || 'XPO India Platform • Reply STOP to unsubscribe',
      buttons: body.buttons || [{ type: 'URL', text: 'View on XPO', url: 'https://xpoindia.com' }],
      variables: body.variables || [],
      status: 'APPROVED',
      updatedAt: new Date().toISOString()
    };

    store.whatsappTemplates.unshift(newTemplate);

    return NextResponse.json({
      success: true,
      message: 'Message Template submitted and approved by Meta WABA API!',
      data: newTemplate
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
