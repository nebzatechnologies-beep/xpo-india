import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';
import { triggerN8nEventBackground } from '@/lib/integrations/n8n/emit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responses = xpoStore.responses.filter(
      (r: any) => r.lead?._id === id || r.lead?.xpoId === id
    );
    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await req.json();
    const { message, capabilityPitch, portfolioLink, experienceYears } = body;

    const lead = xpoStore.leads.find((l: any) => l._id === id || l.xpoId === id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    const partnerId = session?.user?.id || '67489a12bcde345678900003';
    const partnerName = session?.user?.name || 'Anil Patel (Patel Precision Tech)';

    const newResponse = {
      _id: `resp_${Date.now()}`,
      lead,
      absorber: {
        _id: partnerId,
        name: partnerName,
        company: 'Patel Precision Manufacturing & Tech',
        phone: '+91 9910044556',
        email: session?.user?.email || 'absorber@xpoindia.com',
        isVerified: true,
      },
      message: capabilityPitch || message || 'I am interested in fulfilling this commercial requirement and have relevant experience.',
      portfolioLink: portfolioLink || '',
      experienceYears: experienceYears || '10+ years',
      status: 'interested' as const,
      isViewed: false,
      createdAt: new Date().toISOString(),
    };

    xpoStore.responses.unshift(newResponse);

    // Notify n8n: Partner expressed interest
    triggerN8nEventBackground('interest.created', {
      responseId: newResponse._id,
      leadId: lead._id,
      leadTitle: lead.title,
      client: lead.creator,
      partner: newResponse.absorber,
      message: newResponse.message,
      createdAt: newResponse.createdAt,
    });

    return NextResponse.json({
      success: true,
      response: newResponse,
      message: "Expressed interest successfully! The Client will review your profile and can send a Connection Request.",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}