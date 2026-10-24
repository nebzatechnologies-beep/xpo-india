import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const createdSince = searchParams.get('createdSince');
    const deadlineBefore = searchParams.get('deadlineBefore');
    const inactiveDays = searchParams.get('inactiveDays');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let leads = [...xpoStore.leads];

    if (status && status !== 'all') {
      leads = leads.filter((l: any) => l.status === status);
    }

    if (createdSince) {
      const sinceTime = new Date(createdSince).getTime();
      if (!isNaN(sinceTime)) {
        leads = leads.filter((l: any) => new Date(l.createdAt || 0).getTime() >= sinceTime);
      }
    }

    if (deadlineBefore) {
      const deadlineTime = new Date(deadlineBefore).getTime();
      if (!isNaN(deadlineTime)) {
        leads = leads.filter((l: any) => l.deadline && new Date(l.deadline).getTime() <= deadlineTime);
      }
    }

    if (inactiveDays) {
      const days = parseInt(inactiveDays, 10);
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      leads = leads.filter((l: any) => {
        const leadTime = new Date(l.createdAt || 0).getTime();
        const responseCount = xpoStore.responses.filter((r: any) => r.lead === l._id || r.lead?._id === l._id).length;
        return leadTime <= cutoffTime && responseCount === 0;
      });
    }

    const trimmedLeads = leads.slice(0, limit).map((l: any) => ({
      id: l._id,
      xpoId: l.xpoId,
      title: l.title,
      description: l.description,
      type: l.type,
      status: l.status,
      category: l.category,
      country: l.country,
      city: l.city,
      budget: l.budget,
      budgetOpenForDiscussion: l.budgetOpenForDiscussion,
      deadline: l.deadline,
      quantity: l.quantity,
      tags: l.tags,
      creator: {
        id: l.creator?._id || l.creator?.id,
        name: l.creator?.name,
        company: l.creator?.company,
        email: l.creator?.email,
        phone: l.creator?.phone,
      },
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: trimmedLeads.length,
      totalMatching: leads.length,
      leads: trimmedLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
