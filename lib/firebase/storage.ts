import { storage } from './client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a browser File or Blob to Firebase Storage under the given path.
 * Returns the public download URL.
 */
export async function uploadToFirebase(file: Blob, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytesResumable(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
