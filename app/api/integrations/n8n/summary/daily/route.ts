import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const leads = xpoStore.leads || [];
    const responses = xpoStore.responses || [];
    const payments = xpoStore.payments || [];
    const users = xpoStore.users || [];

    const newLeads = leads.filter((l: any) => new Date(l.createdAt || 0).getTime() >= oneDayAgo);
    const newInterests = responses.filter(
      (r: any) => new Date(r.createdAt || 0).getTime() >= oneDayAgo
    );
    const newConnRequests = responses.filter(
      (r: any) =>
        r.connectionRequestedAt && new Date(r.connectionRequestedAt).getTime() >= oneDayAgo
    );
    const newConnAccepted = responses.filter(
      (r: any) => r.connectedAt && new Date(r.connectedAt).getTime() >= oneDayAgo
    );
    const newPayments = payments.filter(
      (p: any) =>
        (p.status === 'captured' || p.status === 'success') &&
        new Date(p.createdAt || 0).getTime() >= oneDayAgo
    );

    const totalRevenueINR = newPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

    const unansweredLeads = leads.filter((l: any) => {
      if (l.status !== 'live') return false;
      const respCount = responses.filter((r: any) => r.lead === l._id || r.lead?._id === l._id).length;
      return respCount === 0;
    });

    const activePartners = users.filter((u: any) => u.role === 'lead_absorber' || u.userType === 'partner').length;
    const activeClients = users.filter((u: any) => u.role === 'lead_creator' || u.userType === 'client').length;

    const summary = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      metrics: {
        totalNewLeads24h: newLeads.length,
        totalInterests24h: newInterests.length,
        totalConnectionsRequested24h: newConnRequests.length,
        totalConnectionsAccepted24h: newConnAccepted.length,
        totalPaymentsCaptured24h: newPayments.length,
        totalRevenueINR24h: totalRevenueINR,
        activePartnersCount: activePartners,
        activeClientsCount: activeClients,
        unansweredLeadsCount: unansweredLeads.length,
      },
      topSectors24h: newLeads.reduce((acc: Record<string, number>, l: any) => {
        const sec = l.category?.parentSectorCode || l.sector || 'general';
        acc[sec] = (acc[sec] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
