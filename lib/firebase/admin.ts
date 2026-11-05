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

// ============================================================================
// In-Memory Local Dev Fallback (used when FIREBASE_PRIVATE_KEY is not set)
// ============================================================================

const globalStore = globalThis as unknown as {
  __xpoLocalDocs?: Map<string, Record<string, any>>;
  __xpoLocalFiles?: Map<string, Buffer>;
};

function getLocalDocsMap(): Map<string, Record<string, any>> {
  if (!globalStore.__xpoLocalDocs) {
    const map = new Map<string, Record<string, any>>();
    const now = new Date().toISOString();
    map.set('users/local-superadmin', {
      uid: 'local-superadmin',
      displayName: 'Pavan (Test Traders)',
      email: 'admin@xpoindia.com',
      phoneE164: '+919849000112',
      role: 'client',
      enabledRoles: ['client'],
      activeRole: 'client',
      isSuperadmin: true,
      isPhoneVerified: true,
      status: 'active',
      verificationStatus: 'verified',
      primaryCity: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      countryIso2: 'IN',
      billingCurrency: 'INR',
      createdAt: now,
      updatedAt: now,
    });
    map.set('users/partner-klotech', {
      uid: 'partner-klotech',
      displayName: 'Rohan Rao (Klo Tech)',
      email: 'rohan@klotech.in',
      phoneE164: '+919849022114',
      role: 'partner',
      enabledRoles: ['partner'],
      activeRole: 'partner',
      isSuperadmin: false,
      isPhoneVerified: true,
      status: 'active',
      verificationStatus: 'verified',
      primaryCity: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      countryIso2: 'IN',
      billingCurrency: 'INR',
      createdAt: now,
      updatedAt: now,
    });
    map.set('role_profiles/local-superadmin_client', {
      id: 'local-superadmin_client',
      uid: 'local-superadmin',
      role: 'client',
      contactName: 'Pavan',
      businessName: 'Test Traders',
      city: 'Hyderabad',
      location: 'Hyderabad, Telangana',
      country: 'India',
      isActive: true,
      verificationStatus: 'verified',
      onboardingCompleted: true,
      freePartnerViewsRemaining: 4,
      paidPartnerViewsRemaining: 0,
      paidViewsUnlimited: false,
      totalRequirementsPosted: 5,
      createdAt: now,
      updatedAt: now,
    });
    map.set('role_profiles/partner-klotech_partner', {
      id: 'partner-klotech_partner',
      uid: 'partner-klotech',
      role: 'partner',
      contactName: 'Rohan Rao',
      businessName: 'Klo Tech Pvt Ltd',
      classification: 'Software Agency',
      city: 'Hyderabad',
      location: 'Hyderabad, Telangana',
      country: 'India',
      isActive: true,
      verificationStatus: 'verified',
      onboardingCompleted: true,
      freeClaimsRemaining: 3,
      paidClaimsRemaining: 0,
      paidClaimsUnlimited: false,
      serviceCategories: ['Web & Mobile Development', 'Packaging & Printing'],
      skillsAndTags: ['Shopify', 'Next.js', 'Corrugated Boxes'],
      availabilityStatus: 'available',
      createdAt: now,
      updatedAt: now,
    });
    map.set('requirements/XPO-REQ-40971', {
      id: 'XPO-REQ-40971',
      referenceCode: 'XPO-REQ-40971',
      clientUid: 'local-superadmin',
      clientName: 'Pavan',
      clientBusinessName: 'Test Traders',
      title: 'E-commerce website for a 5-store retail chain',
      description:
        'Product catalogue for 5 stores, UPI checkout, store pickup and stock sync with our billing software.',
      sectorName: 'Technology & Software',
      categoryName: 'Web & Mobile Development',
      city: 'Hyderabad',
      country: 'India',
      timeline: 'Within 2-4 Weeks',
      budgetLabel: '₹2,00,000',
      moderationStatus: 'approved',
      distributionStatus: 'active_matching',
      interestedCount: 2,
      waveNumber: 2,
      createdAt: now,
      updatedAt: now,
    });
    map.set('requirements/XPO-REQ-41208', {
      id: 'XPO-REQ-41208',
      referenceCode: 'XPO-REQ-41208',
      clientUid: 'local-superadmin',
      clientName: 'Pavan',
      clientBusinessName: 'Test Traders',
      title: '10,000 printed 3-ply corrugated boxes',
      description: '3-ply, 12 x 10 x 8 in, 2-colour logo print, delivered to our Pune warehouse.',
      sectorName: 'Manufacturing & Industrial Supply',
      categoryName: 'Industrial Packaging & Raw Materials',
      city: 'Pune',
      country: 'India',
      timeline: 'Within 2-4 Weeks',
      budgetLabel: 'Quotes invited',
      moderationStatus: 'approved',
      distributionStatus: 'active_matching',
      interestedCount: 0,
      waveNumber: 1,
      createdAt: now,
      updatedAt: now,
    });
    map.set('requirements/XPO-REQ-41190', {
      id: 'XPO-REQ-41190',
      referenceCode: 'XPO-REQ-41190',
      clientUid: 'local-superadmin',
      clientName: 'Pavan',
      clientBusinessName: 'Test Traders',
      title: 'Marketing for a fantasy sports and betting app',
      description: 'Launch campaign across Meta and Google for an app.',
      sectorName: 'Design, Branding & Digital Growth',
      categoryName: 'Performance Marketing & SEO',
      city: 'Bengaluru',
      country: 'India',
      timeline: 'Immediate (Within 7 Days)',
      budgetLabel: '₹5,00,000',
      moderationStatus: 'pending_review',
      distributionStatus: 'paused',
      interestedCount: 0,
      waveNumber: 0,
      createdAt: now,
      updatedAt: now,
    });
    globalStore.__xpoLocalDocs = map;
  }
  return globalStore.__xpoLocalDocs;
}

function getNestedValue(obj: any, fieldPath: string): any {
  if (!obj || !fieldPath) return undefined;
  if (fieldPath === '__name__') return obj.id || obj.uid;
  const parts = fieldPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function applyDotUpdates(target: Record<string, any>, updates: Record<string, any>) {
  const out = { ...target };
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    if (k.includes('.')) {
      const parts = k.split('.');
      let cur: any = out;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]!;
        cur[p] = cur[p] && typeof cur[p] === 'object' ? { ...cur[p] } : {};
        cur = cur[p];
      }
      cur[parts[parts.length - 1]!] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function normalizeDocPath(p: string): string {
  return p.replace(/^\/+|\/+$/g, '');
}

function createDocRef(rawPath: string): any {
  const path = normalizeDocPath(rawPath);
  const segs = path.split('/');
  const id = segs[segs.length - 1] || 'doc_' + Math.random().toString(36).slice(2, 10);
  const store = getLocalDocsMap();

  const ref: any = {
    id,
    path,
    async get() {
      const data = store.get(path);
      return {
        id,
        ref,
        exists: Boolean(data),
        data: () => (data ? structuredClone(data) : undefined),
      };
    },
    async set(data: Record<string, any>, opts?: { merge?: boolean }) {
      const clean = JSON.parse(JSON.stringify(data || {}));
      if (opts?.merge && store.has(path)) {
        const prev = store.get(path) || {};
        store.set(path, { ...prev, ...clean });
      } else {
        store.set(path, clean);
      }
    },
    async update(updates: Record<string, any>) {
      const prev = store.get(path) || {};
      const next = applyDotUpdates(prev, JSON.parse(JSON.stringify(updates || {})));
      store.set(path, next);
    },
    async delete() {
      store.delete(path);
    },
    collection(subName: string) {
      return createCollectionRef(`${path}/${subName}`);
    },
  };
  return ref;
}

interface FilterSpec {
  field: string;
  op: string;
  val: any;
}

interface OrderSpec {
  field: string;
  dir: 'asc' | 'desc';
}

function createQuery(
  collectionPath: string,
  filters: FilterSpec[] = [],
  orders: OrderSpec[] = [],
  limitNum?: number,
  offsetNum?: number
): any {
  const prefix = normalizeDocPath(collectionPath) + '/';
  const depth = prefix.split('/').length;

  const evaluateDocs = () => {
    const store = getLocalDocsMap();
    const matched: { id: string; path: string; data: Record<string, any> }[] = [];

    for (const [docPath, rawData] of store.entries()) {
      if (!docPath.startsWith(prefix)) continue;
      const segs = docPath.split('/');
      if (segs.length !== depth) continue;
      const id = segs[segs.length - 1]!;
      const docObj = { id, ...rawData };

      let pass = true;
      for (const f of filters) {
        const v = f.field === '__name__' ? id : getNestedValue(docObj, f.field);
        switch (f.op) {
          case '==':
            if (v !== f.val) pass = false;
            break;
          case '!=':
            if (v === f.val) pass = false;
            break;
          case '<':
            if (!(v < f.val)) pass = false;
            break;
          case '<=':
            if (!(v <= f.val)) pass = false;
            break;
          case '>':
            if (!(v > f.val)) pass = false;
            break;
          case '>=':
            if (!(v >= f.val)) pass = false;
            break;
          case 'in':
            if (!Array.isArray(f.val) || !f.val.includes(v)) pass = false;
            break;
          case 'not-in':
            if (Array.isArray(f.val) && f.val.includes(v)) pass = false;
            break;
          case 'array-contains':
            if (!Array.isArray(v) || !v.includes(f.val)) pass = false;
            break;
          case 'array-contains-any':
            if (
              !Array.isArray(v) ||
              !Array.isArray(f.val) ||
              !v.some((item) => f.val.includes(item))
            ) {
              pass = false;
            }
            break;
          default:
            break;
        }
        if (!pass) break;
      }
      if (pass) {
        matched.push({ id, path: docPath, data: rawData });
      }
    }

    if (orders.length > 0) {
      matched.sort((a, b) => {
        for (const o of orders) {
          const av = getNestedValue(a.data, o.field);
          const bv = getNestedValue(b.data, o.field);
          if (av === bv) continue;
          if (av == null) return o.dir === 'asc' ? -1 : 1;
          if (bv == null) return o.dir === 'asc' ? 1 : -1;
          const cmp = av < bv ? -1 : 1;
          return o.dir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    let sliced = matched;
    if (typeof offsetNum === 'number' && offsetNum > 0) {
      sliced = sliced.slice(offsetNum);
    }
    if (typeof limitNum === 'number' && limitNum >= 0) {
      sliced = sliced.slice(0, limitNum);
    }
    return { allCount: matched.length, docs: sliced };
  };

  const queryObj: any = {
    where(field: string, op: string, val: any) {
      return createQuery(
        collectionPath,
        [...filters, { field, op, val }],
        orders,
        limitNum,
        offsetNum
      );
    },
    orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
      return createQuery(
        collectionPath,
        filters,
        [...orders, { field, dir }],
        limitNum,
        offsetNum
      );
    },
    limit(n: number) {
      return createQuery(collectionPath, filters, orders, n, offsetNum);
    },
    offset(n: number) {
      return createQuery(collectionPath, filters, orders, limitNum, n);
    },
    select() {
      return queryObj;
    },
    count() {
      return {
        async get() {
          const { allCount } = evaluateDocs();
          return {
            data: () => ({ count: allCount }),
          };
        },
      };
    },
    async get() {
      const { docs } = evaluateDocs();
      const snapDocs = docs.map((d) => {
        const ref = createDocRef(d.path);
        return {
          id: d.id,
          ref,
          exists: true,
          data: () => structuredClone(d.data),
        };
      });
      return {
        empty: snapDocs.length === 0,
        size: snapDocs.length,
        docs: snapDocs,
        forEach(cb: (doc: any) => void) {
          snapDocs.forEach(cb);
        },
      };
    },
  };

  return queryObj;
}

function createCollectionRef(rawPath: string): any {
  const path = normalizeDocPath(rawPath);
  const baseQuery = createQuery(path);

  return {
    ...baseQuery,
    id: path.split('/').pop() || path,
    path,
    doc(docId?: string) {
      const finalId =
        docId ||
        'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      return createDocRef(`${path}/${finalId}`);
    },
    async add(data: Record<string, any>) {
      const dRef = this.doc();
      await dRef.set(data);
      return dRef;
    },
  };
}

let localFirestoreInstance: Firestore | null = null;
let localAuthInstance: Auth | null = null;
let localStorageBucketInstance: any = null;

function getLocalFirestore(): Firestore {
  if (!localFirestoreInstance) {
    const dbObj: any = {
      collection(name: string) {
        return createCollectionRef(name);
      },
      doc(path: string) {
        return createDocRef(path);
      },
      batch() {
        const ops: Array<() => Promise<void>> = [];
        return {
          set(ref: any, data: any, opts?: any) {
            ops.push(() => ref.set(data, opts));
          },
          update(ref: any, data: any) {
            ops.push(() => ref.update(data));
          },
          delete(ref: any) {
            ops.push(() => ref.delete());
          },
          async commit() {
            for (const op of ops) {
              await op();
            }
          },
        };
      },
      async runTransaction(updateFn: (tx: any) => Promise<any>) {
        const pendingOps: Array<() => Promise<void>> = [];
        const tx = {
          async get(refOrQuery: any) {
            return refOrQuery.get();
          },
          set(ref: any, data: any, opts?: any) {
            pendingOps.push(() => ref.set(data, opts));
            return tx;
          },
          update(ref: any, data: any) {
            pendingOps.push(() => ref.update(data));
            return tx;
          },
          delete(ref: any) {
            pendingOps.push(() => ref.delete());
            return tx;
          },
        };
        const res = await updateFn(tx);
        for (const op of pendingOps) {
          await op();
        }
        return res;
      },
      async getAll(...refs: any[]) {
        return Promise.all(refs.map((r) => r.get()));
      },
      settings() {},
    };
    localFirestoreInstance = dbObj as Firestore;
  }
  return localFirestoreInstance;
}

function getLocalAdminAuth(): Auth {
  if (!localAuthInstance) {
    const authObj: any = {
      async createSessionCookie(idToken: string) {
        return `local_session_${idToken.slice(0, 24)}`;
      },
      async verifySessionCookie() {
        return {
          uid: 'local-superadmin',
          email: 'admin@xpoindia.com',
          phone_number: '+919849000112',
          superadmin: true,
        };
      },
      async verifyIdToken() {
        return {
          uid: 'local-superadmin',
          email: 'admin@xpoindia.com',
          phone_number: '+919849000112',
          superadmin: true,
        };
      },
      async getUser(uid: string) {
        return {
          uid,
          email: 'admin@xpoindia.com',
          phoneNumber: '+919849000112',
          displayName: 'Pavan (Test Traders)',
          customClaims: { superadmin: true },
        };
      },
      async getUserByEmail(email: string) {
        return {
          uid: 'local-superadmin',
          email,
          phoneNumber: '+919849000112',
          displayName: 'Pavan (Test Traders)',
          customClaims: { superadmin: true },
        };
      },
      async getUserByPhoneNumber(phoneNumber: string) {
        return {
          uid: 'local-superadmin',
          email: 'admin@xpoindia.com',
          phoneNumber,
          displayName: 'Pavan (Test Traders)',
          customClaims: { superadmin: true },
        };
      },
      async createUser(props: any) {
        return {
          uid: props.uid || 'user_' + Date.now(),
          email: props.email,
          phoneNumber: props.phoneNumber,
          displayName: props.displayName || 'XPO User',
        };
      },
      async updateUser(uid: string, props: any) {
        return { uid, ...props };
      },
      async setCustomUserClaims() {},
    };
    localAuthInstance = authObj as Auth;
  }
  return localAuthInstance;
}

function getLocalStorageBucket() {
  if (!localStorageBucketInstance) {
    if (!globalStore.__xpoLocalFiles) {
      globalStore.__xpoLocalFiles = new Map<string, Buffer>();
    }
    const filesMap = globalStore.__xpoLocalFiles;
    localStorageBucketInstance = {
      name: 'local-xpo-bucket',
      file(filePath: string) {
        return {
          name: filePath,
          async save(buf: Buffer | string) {
            filesMap.set(
              filePath,
              Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf))
            );
          },
          async download() {
            return [filesMap.get(filePath) || Buffer.from('')];
          },
          async exists() {
            return [filesMap.has(filePath)];
          },
          async getSignedUrl() {
            return [`/api/local-storage/${encodeURIComponent(filePath)}`];
          },
          async delete() {
            filesMap.delete(filePath);
          },
        };
      },
    };
  }
  return localStorageBucketInstance;
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
    return {
      app: null,
      db: getLocalFirestore(),
      auth: getLocalAdminAuth(),
      storage: null,
      isConfigured: true,
    };
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
  const { db } = getFirebaseAdmin();
  return db || getLocalFirestore();
}

export function requireAdminAuth(): Auth {
  const { auth } = getFirebaseAdmin();
  return auth || getLocalAdminAuth();
}

export function requireStorageBucket() {
  const { storage } = getFirebaseAdmin();
  if (!storage) {
    return getLocalStorageBucket();
  }
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${resolveProjectId()}.firebasestorage.app`;
  return storage.bucket(bucketName);
}
