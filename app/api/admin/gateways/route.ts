import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  getMaskedPlatformCredentials,
  testGatewayCredentials,
  updatePlatformCredentials,
} from '@/lib/services/credentials';
import { handleApiError, jsonOk } from '@/lib/utils/api-handler';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
    const creds = await getMaskedPlatformCredentials();

    return jsonOk({
      credentials: creds,
      webhookUrls: {
        whatsapp: `${appUrl}/api/webhooks/whatsapp`,
        razorpay: `${appUrl}/api/webhooks/razorpay`,
        paypal: `${appUrl}/api/webhooks/paypal`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchGatewaysSchema = z.object({
  whatsapp: z
    .object({
      graphVersion: z.string().optional(),
      wabaId: z.string().optional(),
      phoneNumberId: z.string().optional(),
      displayPhoneNumber: z.string().optional(),
      accessToken: z.string().optional(),
      appSecret: z.string().optional(),
      verifyToken: z.string().optional(),
    })
    .optional(),
  razorpay: z
    .object({
      keyId: z.string().optional(),
      keySecret: z.string().optional(),
      webhookSecret: z.string().optional(),
      partnerPlanId: z.string().optional(),
      clientPlanId: z.string().optional(),
    })
    .optional(),
  paypal: z
    .object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      webhookId: z.string().optional(),
      partnerPlanId: z.string().optional(),
      clientPlanId: z.string().optional(),
      apiBaseUrl: z.string().optional(),
    })
    .optional(),
  ai: z
    .object({
      provider: z.enum(['gemini', 'openai', 'deterministic']).optional(),
      geminiApiKey: z.string().optional(),
      geminiModel: z.string().optional(),
      openaiApiKey: z.string().optional(),
      openaiModel: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = patchGatewaysSchema.parse(await request.json());

    await updatePlatformCredentials(body, {
      uid: session.uid,
      name: session.user.displayName,
    });

    const masked = await getMaskedPlatformCredentials();
    return jsonOk({ success: true, credentials: masked });
  } catch (err) {
    return handleApiError(err);
  }
}

const postActionSchema = z.object({
  action: z.literal('test'),
  gateway: z.enum(['whatsapp', 'razorpay', 'paypal', 'ai']),
});

export async function POST(request: NextRequest) {
  try {
    await requireSuperadmin();
    const body = postActionSchema.parse(await request.json());

    const result = await testGatewayCredentials(body.gateway);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
