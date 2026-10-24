import { NextRequest, NextResponse } from 'next/server';
import { testN8nConnection } from '@/lib/integrations/n8n/client';
import { getN8nConfig, updateN8nConfig } from '@/lib/integrations/n8n/store';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body allowed
    }

    let configToTest = getN8nConfig();

    // If caller provided updated temp config to test before saving
    if (body.webhookUrl !== undefined) {
      configToTest = {
        ...configToTest,
        webhookUrl: body.webhookUrl,
        authType: body.authType || configToTest.authType,
        authHeaderName: body.authHeaderName ?? configToTest.authHeaderName,
        authHeaderValue: body.authHeaderValue && !body.authHeaderValue.includes('••••') ? body.authHeaderValue : configToTest.authHeaderValue,
        basicUsername: body.basicUsername ?? configToTest.basicUsername,
        basicPassword: body.basicPassword && !body.basicPassword.includes('••••') ? body.basicPassword : configToTest.basicPassword,
        bearerToken: body.bearerToken && !body.bearerToken.includes('••••') ? body.bearerToken : configToTest.bearerToken,
      };
    }

    const result = await testN8nConnection(configToTest);

    return NextResponse.json({
      success: result.success,
      status: result.success ? 'connected' : 'disconnected',
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'disconnected',
        result: {
          success: false,
          latencyMs: 0,
          message: error.message || 'Connection test failed',
        },
      },
      { status: 500 }
    );
  }
}
