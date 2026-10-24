import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappCampaigns
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    const newCampaign = {
      id: 'camp_' + (store.whatsappCampaigns.length + 101),
      name: body.name || 'Untitled Campaign',
      type: body.type || 'Company Invitation',
      audienceName: body.audienceName || 'All Valid CRM Opt-Ins',
      eligibleRecipients: body.eligibleRecipients || 120,
      scheduledDate: body.scheduledDate || 'Immediate Dispatch',
      sent: body.scheduledDate ? 0 : (body.eligibleRecipients || 120),
      delivered: body.scheduledDate ? 0 : Math.round((body.eligibleRecipients || 120) * 0.98),
      replies: 0,
      spend: body.spend || Math.round((body.eligibleRecipients || 120) * 0.88),
      status: body.scheduledDate ? 'scheduled' : 'running',
      templateId: body.templateId || 'tpl_001',
      templateName: body.templateName || 'xpo_direct_platform_invitation',
      createdAt: new Date().toISOString()
    };

    store.whatsappCampaigns.unshift(newCampaign);

    return NextResponse.json({
      success: true,
      message: 'Bulk WhatsApp Campaign scheduled successfully!',
      data: newCampaign
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
