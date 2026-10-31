import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/server-session';
import { getFirebaseAdmin, requireFirestore } from '@/lib/firebase/admin';
import { BadRequestError, handleApiError, jsonOk } from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new BadRequestError('No file provided in form data under field "file".');
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new BadRequestError(
        `Invalid file type (${file.type}). Allowed types: PDF, PNG, JPEG, WEBP.`
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError('File exceeds maximum allowed size of 10MB.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `kyc/${session.uid}/${Date.now()}_${sanitizedName}`;

    // Try saving to Cloud Storage bucket if configured
    try {
      const admin = getFirebaseAdmin();
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = admin.storage ? (bucketName ? admin.storage.bucket(bucketName) : admin.storage.bucket()) : null;

      if (bucket) {
        const fileRef = bucket.file(storagePath);
        await fileRef.save(buffer, {
          contentType: file.type,
          resumable: false,
          metadata: {
            uploadedByUid: session.uid,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });
        return jsonOk({ ok: true, storagePath }, 201);
      }
    } catch {
      // Storage bucket not provisioned locally; use Firestore fallback
    }

    // Fallback for local testing: persist blob record in Firestore
    const db = requireFirestore();
    const blobId = generateDocId('blob');
    const base64Data = buffer.toString('base64');

    await db.collection('verification_blobs').doc(blobId).set({
      id: blobId,
      uid: session.uid,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      base64Data,
      storagePath: `blob://${blobId}/${sanitizedName}`,
      createdAt: new Date().toISOString(),
    });

    return jsonOk({ ok: true, storagePath: `blob://${blobId}/${sanitizedName}` }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
