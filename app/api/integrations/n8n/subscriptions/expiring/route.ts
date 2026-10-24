import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const daysStr = searchParams.get('days') || '7';
    const days = parseInt(daysStr, 10);

    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;

    // Derived from payments / subscriptions history
    const payments = xpoStore.payments || [];
    const users = xpoStore.users || [];

    const expiringItems: any[] = [];

    payments.forEach((p: any) => {
      if (p.status === 'captured' || p.status === 'success') {
        const paymentTime = new Date(p.createdAt || p.date || 0).getTime();
        // Assuming annual subscription (365 days)
        const expiryTime = paymentTime + 365 * 24 * 60 * 60 * 1000;
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry > 0 && timeUntilExpiry <= daysMs) {
          const user = users.find((u: any) => u._id === p.userId || u.email === p.userEmail);
          expiringItems.push({
            paymentId: p._id,
            userId: p.userId || user?._id,
            userName: user?.name || p.userName || 'Subscriber',
            userEmail: user?.email || p.userEmail,
            userPhone: user?.phone || p.userPhone,
            planName: p.planName || p.planId || 'Standard Plan',
            amountINR: p.amount,
            expiryDate: new Date(expiryTime).toISOString(),
            daysRemaining: Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000)),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      queryDays: days,
      count: expiringItems.length,
      expiringSubscriptions: expiringItems,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
