import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Plan } from '@/lib/db/models';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    try {
      await connectDB();
      const plans = await Plan.find({ isActive: true }).lean();
      if (plans && plans.length > 0) {
        return NextResponse.json({ success: true, plans, data: plans });
      }
    } catch (e) {
      console.warn('[GET /api/subscriptions/plans] Using in-memory fallback store');
    }

    const plans = xpoStore.plans.filter((p: any) => p.isActive);
    return NextResponse.json({ success: true, plans, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}