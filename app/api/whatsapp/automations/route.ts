import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappAutomations
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'toggle') {
      const auto = store.whatsappAutomations.find((a: any) => a.id === body.id);
      if (auto) {
        auto.status = auto.status === 'active' ? 'inactive' : 'active';
        return NextResponse.json({ success: true, data: auto });
      }
    }

    if (body.action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'Automation rule triggered successfully in sandbox! Payload dispatches 1 preview WhatsApp message.'
      });
    }

    const newAuto = {
      id: 'auto_' + (store.whatsappAutomations.length + 1).toString().padStart(3, '0'),
      name: body.name,
      trigger: body.trigger,
      conditions: body.conditions || 'None',
      templateName: body.templateName || 'xpo_lead_match_alert',
      status: 'active',
      lastExecuted: 'Never'
    };

    store.whatsappAutomations.unshift(newAuto);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp automation rule created and activated!',
      data: newAuto
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
