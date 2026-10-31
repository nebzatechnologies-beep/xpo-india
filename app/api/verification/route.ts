import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server-session';
import { requireFirestore } from '@/lib/firebase/admin';
import { submitVerificationRequest } from '@/lib/services/verification';
import { BadRequestError, ForbiddenError, handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type { VerificationRequest } from '@/lib/types/domain';

const kycSchema = z.object({
  role: z.enum(['client', 'partner']),
  documentType: z.enum([
    'gst_certificate',
    'business_registration',
    'trade_license',
    'identity_proof',
    'credential_certificate',
    'portfolio_evidence',
  ]),
  documentNumber: z.string().optional(),
  storagePaths: z.array(z.string()).default([]),
  websiteUrl: z.string().optional(),
  companyName: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const db = requireFirestore();
    const snap = await db
      .collection('verification_requests')
      .where('uid', '==', session.uid)
      .limit(25)
      .get();

    const requests = snap.docs
      .map((d) => d.data() as VerificationRequest)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return jsonOk({ requests, verificationStatus: session.user.verificationStatus });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = kycSchema.parse(await request.json());

    if (!session.user.isSuperadmin && body.role !== session.user.role) {
      throw new ForbiddenError('You can only submit verification for your own account role.');
    }

    const hasDocNum = Boolean(body.documentNumber?.trim());
    const hasStorage = body.storagePaths && body.storagePaths.length > 0;
    const hasWeb = Boolean(body.websiteUrl?.trim());

    if (!hasDocNum && !hasStorage && !hasWeb) {
      throw new BadRequestError(
        'Please provide a document number, upload an official document, or provide your verification URL.'
      );
    }

    const created = await submitVerificationRequest({
      uid: session.uid,
      ...body,
    });
    return jsonOk({ request: created }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
