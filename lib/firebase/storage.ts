import { getClientStorage } from './client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a browser File or Blob to Firebase Storage under the given path.
 * Returns the storage path and download URL when rules permit read access.
 */
export async function uploadToFirebase(
  file: Blob,
  path: string
): Promise<{ storagePath: string; downloadUrl?: string }> {
  const storage = getClientStorage();
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytesResumable(storageRef, file);
  try {
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { storagePath: path, downloadUrl };
  } catch {
    // Private ACL buckets (e.g. kyc/, resumes/, imports/) forbid client getDownloadURL
    return { storagePath: path };
  }
}
