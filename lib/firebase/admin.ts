import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: Storage | null = null;

export function getFirebaseAdmin(): {
  app: App | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: Storage | null;
  isConfigured: boolean;
} {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return { app: null, db: null, auth: null, storage: null, isConfigured: false };
  }

  if (!adminApp) {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    }
  }

  if (!db) db = getFirestore(adminApp);
  if (!auth) auth = getAuth(adminApp);
  if (!storage) storage = getStorage(adminApp);

  return { app: adminApp, db, auth, storage, isConfigured: true };
}
