import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { pushN8nLog } from '@/lib/integrations/n8n/store';

export async function POST(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { workflowName, executionId, event, status, details } = body;

    // Log the incoming callback in delivery log history
    pushN8nLog({
      id: `cb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: executionId || `n8n_exec_${Date.now()}`,
      event: event || 'integration.test',
      status: status === 'failed' || status === 'error' ? 'failed' : 'success',
      attempts: 1,
      latencyMs: 0,
      occurredAt: new Date().toISOString(),
      payloadSummary: `Callback from n8n workflow "${workflowName || 'Automation'}" - Status: ${status || 'ok'}${details ? ' - ' + JSON.stringify(details).substring(0, 100) : ''}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Callback received and recorded successfully in XPO',
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
