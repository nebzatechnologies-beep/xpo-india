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
    const user = (xpoStore.users || []).find((u: any) => u._id === id || u.id === id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        company: user.company || user.companyName,
        email: user.email,
        phone: user.phone || user.mobile,
        role: user.role,
        country: user.country,
        city: user.city,
        subscriptionPlan: user.subscriptionPlan || user.planType,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
