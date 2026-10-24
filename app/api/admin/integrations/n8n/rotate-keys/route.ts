import { NextRequest, NextResponse } from 'next/server';
import { generateRandomKey } from '@/lib/integrations/n8n/signing';
import { getMaskedN8nConfig, getN8nConfig, updateN8nConfig } from '@/lib/integrations/n8n/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body; // 'signingSecret' | 'inboundApiKey'

    if (target === 'signingSecret') {
      const newSecret = generateRandomKey(32);
      updateN8nConfig({ signingSecret: newSecret });
      return NextResponse.json({
        success: true,
        message: 'HMAC Signing Secret regenerated',
        target,
        newKey: newSecret,
        config: getMaskedN8nConfig(),
      });
    } else if (target === 'inboundApiKey') {
      const newKey = `xpo_n8n_live_${generateRandomKey(24)}`;
      updateN8nConfig({ inboundApiKey: newKey });
      return NextResponse.json({
        success: true,
        message: 'Inbound Machine API Key regenerated',
        target,
        newKey: newKey,
        config: getMaskedN8nConfig(),
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid target specified' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
