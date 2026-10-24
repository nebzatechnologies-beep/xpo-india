import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let responses = [...xpoStore.responses];

    if (leadId) {
      responses = responses.filter(
        (r: any) => r.lead === leadId || r.lead?._id === leadId || r.lead?.xpoId === leadId
      );
    }

    if (status && status !== 'all') {
      responses = responses.filter((r: any) => r.status === status);
    }

    const trimmedResponses = responses.slice(0, limit).map((r: any) => ({
      id: r._id,
      leadId: typeof r.lead === 'object' ? r.lead?._id : r.lead,
      leadTitle: r.lead?.title,
      absorber: {
        id: r.absorber?._id || r.absorber?.id,
        name: r.absorber?.name,
        company: r.absorber?.company,
        email: r.absorber?.email,
        phone: r.absorber?.phone,
      },
      status: r.status,
      message: r.message,
      createdAt: r.createdAt,
      connectionRequestedAt: r.connectionRequestedAt,
      connectedAt: r.connectedAt,
    }));

    return NextResponse.json({
      success: true,
      count: trimmedResponses.length,
      responses: trimmedResponses,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
