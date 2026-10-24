import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    let razorpayRevenueINR = 0;
    let paypalRevenueUSD = 0;
    let autopayCount = 0;

    for (const p of xpoStore.payments) {
      if (p.status === 'captured') {
        if (p.gateway === 'razorpay') razorpayRevenueINR += p.amount;
        if (p.gateway === 'paypal') paypalRevenueUSD += p.amount;
      }
      if (p.metadata?.isAutoPay || p.type === 'subscription') {
        autopayCount++;
      }
    }

    const clientCount = xpoStore.users.filter((u: any) => u.role === 'lead_creator' || u.userType === 'client').length || 1;
    const partnerCount = xpoStore.users.filter((u: any) => u.role === 'lead_absorber' || u.userType === 'partner').length || 1;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: xpoStore.users.length,
        clientCount,
        partnerCount,
        creatorCount: clientCount,
        absorberCount: partnerCount,
        totalLeads: xpoStore.leads.length,
        liveLeads: xpoStore.leads.filter((l: any) => l.status === 'live').length,
        totalProposals: xpoStore.responses.length,
        activeSubs: xpoStore.payments.filter((p: any) => p.status === 'captured').length,
        autopayCount,
        razorpayRevenueINR,
        paypalRevenueUSD,
      },
      recentPayments: xpoStore.payments.slice(0, 6),
      recentLeads: xpoStore.leads.slice(0, 6),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}