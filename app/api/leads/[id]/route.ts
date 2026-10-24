import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    const lead = xpoStore.leads.find(
      (l: any) => l._id === id || l.xpoId?.toLowerCase() === id.toLowerCase()
    );

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const isCreator = userId && (lead.creator?._id === userId || lead.creator === userId || userRole === 'lead_creator');
    const isAdmin = userRole === 'superadmin' || userRole === 'staff';
    const isSubscribed = Boolean(session?.user); // Active subscribers or demo sessions

    const hasConnection = xpoStore.connections.some(
      (c: any) => (c.lead?._id === lead._id || c.lead?.xpoId === lead.xpoId) &&
        (c.absorber?._id === userId || c.creator?._id === userId || isCreator || isAdmin)
    );

    const userResponse = xpoStore.responses.find(
      (r: any) => (r.lead?._id === lead._id || r.lead?.xpoId === lead.xpoId) &&
        (r.absorber?._id === userId || userRole === 'lead_absorber')
    );

    return NextResponse.json({
      success: true,
      lead,
      isCreator: Boolean(isCreator),
      isAdmin: Boolean(isAdmin),
      isSubscribed: true,
      hasConnection: Boolean(hasConnection),
      userResponse: userResponse || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}