import { NextRequest, NextResponse } from 'next/server';
import { getMaskedN8nConfig, getN8nConfig, getN8nLogs, updateN8nConfig } from '@/lib/integrations/n8n/store';

export async function GET() {
  try {
    const maskedConfig = getMaskedN8nConfig();
    const logs = getN8nLogs();

    const stats = {
      totalEventsEmitted: logs.length,
      successfulDeliveries: logs.filter((l) => l.status === 'success').length,
      failedDeliveries: logs.filter((l) => l.status === 'failed').length,
      averageLatencyMs:
        logs.length > 0
          ? Math.round(logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / logs.length)
          : 0,
    };

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      stats,
      recentLogs: logs.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateN8nConfig(body);
    const maskedConfig = getMaskedN8nConfig();

    return NextResponse.json({
      success: true,
      message: 'Hostinger n8n Integration settings updated successfully',
      config: maskedConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
