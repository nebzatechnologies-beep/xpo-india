import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';
import { triggerN8nEventBackground } from '@/lib/integrations/n8n/emit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let leads = [...xpoStore.leads];
    if (status && status !== 'all') {
      leads = leads.filter((l: any) => l.status === status);
    }
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, status } = body;
    const lead = xpoStore.leads.find((l: any) => l._id === leadId);
    if (lead) {
      const oldStatus = lead.status;
      lead.status = status;

      triggerN8nEventBackground('lead.status_changed', {
        leadId: lead._id,
        xpoId: lead.xpoId,
        title: lead.title,
        oldStatus,
        newStatus: status,
        creator: lead.creator,
        updatedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}