import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gateway = searchParams.get('gateway');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let list = [...xpoStore.payments];

    if (gateway && gateway !== 'all') {
      list = list.filter((p: any) => p.gateway === gateway);
    }
    if (status && status !== 'all') {
      list = list.filter((p: any) => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.gatewayOrderId?.toLowerCase().includes(q) ||
          p.gatewayPaymentId?.toLowerCase().includes(q) ||
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q)
      );
    }

    let razorpayRevenue = 0;
    let paypalRevenue = 0;
    for (const p of xpoStore.payments) {
      if (p.status === 'captured') {
        if (p.gateway === 'razorpay') razorpayRevenue += p.amount;
        if (p.gateway === 'paypal') paypalRevenue += p.amount;
      }
    }

    return NextResponse.json({
      success: true,
      payments: list,
      stats: {
        totalRevenue: razorpayRevenue,
        razorpayRevenue,
        paypalRevenue,
        totalTransactions: xpoStore.payments.length,
      },
      pagination: {
        page: 1,
        limit: 50,
        total: list.length,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}