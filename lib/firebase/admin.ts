import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

export class ServiceConfigurationError extends Error {
  public readonly statusCode = 503;
  public readonly code = 'SERVICE_UNCONFIGURED';
  public readonly missingService: string;

  constructor(missingService: string, message: string) {
    super(message);
    this.name = 'ServiceConfigurationError';
    this.missingService = missingService;
  }
}

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;
let firestoreSettingsApplied = false;
let adminAuthInstance: Auth | null = null;
let adminStorageInstance: Storage | null = null;

function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT
  );
}

function canUseApplicationDefaultCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE ||
      process.env.FIREBASE_CONFIG ||
      process.env.FIRESTORE_EMULATOR_HOST
  );
}

export function getFirebaseAdmin(): {
  app: App | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: Storage | null;
  isConfigured: boolean;
} {
  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;
  const hasExplicitCert = Boolean(projectId && clientEmail && privateKey);
  const hasAdc = Boolean(projectId && canUseApplicationDefaultCredentials());

  if (!hasExplicitCert && !hasAdc) {
    return { app: null, db: null, auth: null, storage: null, isConfigured: false };
  }

  if (!adminApp) {
    const existing = getApps();
    if (existing.length > 0) {
      adminApp = existing[0]!;
    } else {
      const storageBucket =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        `${projectId}.firebasestorage.app`;

      adminApp = initializeApp({
        projectId,
        credential: hasExplicitCert
          ? cert({
              projectId: projectId!,
              clientEmail: clientEmail!,
              privateKey: privateKey!,
            })
          : applicationDefault(),
        storageBucket,
      });
    }
  }

  if (!firestoreDb) {
    firestoreDb = getFirestore(adminApp);
    if (!firestoreSettingsApplied) {
      try {
        firestoreDb.settings({ ignoreUndefinedProperties: true });
      } catch {
        // Firestore settings already initialized in HMR session
      }
      firestoreSettingsApplied = true;
    }
  }

  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(adminApp);
  }

  if (!adminStorageInstance) {
    adminStorageInstance = getStorage(adminApp);
  }

  return {
    app: adminApp,
    db: firestoreDb,
    auth: adminAuthInstance,
    storage: adminStorageInstance,
    isConfigured: true,
  };
}

export function requireFirestore(): Firestore {
  const { db, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !db) {
    throw new ServiceConfigurationError(
      'firebase-admin',
      'Firebase Admin Firestore is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local.'
    );
  }
  return db;
}

export function requireAdminAuth(): Auth {
  const { auth, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !auth) {
    throw new ServiceConfigurationError(
      'firebase-admin-auth',
      'Firebase Admin Auth is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local.'
    );
  }
  return auth;
}

export function requireStorageBucket() {
  const { storage, isConfigured } = getFirebaseAdmin();
  if (!isConfigured || !storage) {
    throw new ServiceConfigurationError(
      'firebase-admin-storage',
      'Firebase Admin Storage is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local.'
    );
  }
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${resolveProjectId()}.firebasestorage.app`;
  return storage.bucket(bucketName);
}
