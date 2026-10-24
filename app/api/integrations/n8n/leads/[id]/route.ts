import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { id } = await params;
    const lead = xpoStore.leads.find((l: any) => l._id === id || l.xpoId === id);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const responses = xpoStore.responses.filter(
      (r: any) => r.lead === lead._id || r.lead?._id === lead._id
    );

    return NextResponse.json({
      success: true,
      lead: {
        ...lead,
        responseCount: responses.length,
        interestedPartnersCount: responses.filter((r: any) => r.status === 'interested' || r.status === 'connected').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
