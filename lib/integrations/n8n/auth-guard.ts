import { NextRequest, NextResponse } from 'next/server';
import { getN8nConfig } from './store';
import { verifyInboundApiKey } from './signing';

export function authenticateN8nInboundRequest(req: NextRequest): { authenticated: boolean; errorResponse?: NextResponse } {
  const config = getN8nConfig();

  if (!config.enabled) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Hostinger n8n Integration is currently disabled in XPO Superadmin Settings.' },
        { status: 403 }
      ),
    };
  }

  const apiKeyHeader = req.headers.get('X-XPO-Api-Key') || req.headers.get('x-xpo-api-key');
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  
  const providedKey = apiKeyHeader || authHeader;

  if (!verifyInboundApiKey(providedKey, config.inboundApiKey)) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid XPO n8n Machine API Key or Bearer Token.' },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true };
}
