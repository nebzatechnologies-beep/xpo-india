import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';
import { triggerN8nEventBackground } from '@/lib/integrations/n8n/emit';

export async function GET(req: NextRequest) {
  try {
    const responses = xpoStore.responses.map((r: any) => ({
      ...r,
      isConnected: r.status === 'connected',
      isConnectionRequested: r.status === 'connection_requested',
    }));
    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const {
      action = 'express_interest',
      responseId,
      leadId,
      message,
      capabilityPitch,
      portfolioLink,
      experienceYears,
    } = body;

    // Handle Client sending Connection Request to Partner
    if (action === 'send_connection_request') {
      const resp = xpoStore.responses.find((r: any) => r._id === responseId);
      if (!resp) {
        return NextResponse.json({ success: false, error: 'Interested partner response not found' }, { status: 404 });
      }
      resp.status = 'connection_requested';
      resp.connectionRequestedAt = new Date().toISOString();

      // Notify n8n: Client requested connection with Partner
      triggerN8nEventBackground('connection.requested', {
        responseId: resp._id,
        leadId: typeof resp.lead === 'object' ? resp.lead?._id : resp.lead,
        leadTitle: resp.lead?.title,
        client: resp.lead?.creator,
        partner: resp.absorber,
        connectionRequestedAt: resp.connectionRequestedAt,
      });

      return NextResponse.json({ success: true, response: resp, message: 'Connection request sent to Partner' });
    }

    // Handle Partner accepting Connection Request from Client
    if (action === 'accept_connection_request') {
      const resp = xpoStore.responses.find((r: any) => r._id === responseId);
      if (!resp) {
        return NextResponse.json({ success: false, error: 'Connection request not found' }, { status: 404 });
      }
      resp.status = 'connected';
      resp.connectedAt = new Date().toISOString();

      // Ensure connection object in store
      const connId = `conn_${Date.now()}`;
      const connection = {
        _id: connId,
        lead: resp.lead,
        creator: resp.lead?.creator || {
          _id: '67489a12bcde345678900002',
          name: 'Rajesh Sharma',
          company: 'Client Enterprise Ltd',
          phone: '+91 9820011223',
          email: 'creator@xpoindia.com',
        },
        absorber: resp.absorber,
        response: { _id: resp._id },
        status: 'connected',
        contactRevealedAt: new Date().toISOString(),
      };
      xpoStore.connections.unshift(connection);

      // Notify n8n: Connection accepted by Partner
      triggerN8nEventBackground('connection.accepted', {
        connectionId: connId,
        responseId: resp._id,
        leadId: typeof resp.lead === 'object' ? resp.lead?._id : resp.lead,
        leadTitle: resp.lead?.title,
        client: connection.creator,
        partner: connection.absorber,
        connectedAt: resp.connectedAt,
      });

      return NextResponse.json({
        success: true,
        response: resp,
        connection,
        message: 'Connection accepted! Direct contact details are now unmasked for off-platform communication.',
      });
    }

    // Handle Partner declining Connection Request
    if (action === 'decline_connection_request') {
      const resp = xpoStore.responses.find((r: any) => r._id === responseId);
      if (!resp) {
        return NextResponse.json({ success: false, error: 'Connection request not found' }, { status: 404 });
      }
      resp.status = 'declined';

      triggerN8nEventBackground('connection.declined', {
        responseId: resp._id,
        leadId: typeof resp.lead === 'object' ? resp.lead?._id : resp.lead,
        partner: resp.absorber,
        client: resp.lead?.creator,
      });

      return NextResponse.json({ success: true, response: resp, message: 'Connection request declined' });
    }

    // Default Action: Partner expresses interest in a Lead ("I'm Interested")
    const targetLead = xpoStore.leads.find((l: any) => l._id === leadId || l.xpoId === leadId) || xpoStore.leads[0];

    const partnerId = session?.user?.id || '67489a12bcde345678900003';
    const partnerName = session?.user?.name || 'Anil Patel (Patel Precision Tech)';

    const newResponse = {
      _id: `resp_${Date.now()}`,
      lead: targetLead,
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
      leadId: targetLead._id,
      leadTitle: targetLead.title,
      client: targetLead.creator,
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