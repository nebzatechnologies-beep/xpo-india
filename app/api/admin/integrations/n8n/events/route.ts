import { NextRequest, NextResponse } from 'next/server';
import { clearN8nLogs, getN8nLogs } from '@/lib/integrations/n8n/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const event = searchParams.get('event');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let logs = getN8nLogs();

    if (event && event !== 'all') {
      logs = logs.filter((l) => l.event === event);
    }
    if (status && status !== 'all') {
      logs = logs.filter((l) => l.status === status);
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearN8nLogs();
    return NextResponse.json({ success: true, message: 'Event delivery logs cleared' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
