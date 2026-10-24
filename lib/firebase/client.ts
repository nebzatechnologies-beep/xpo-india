import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'xpo-india-ca951.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'xpo-india-ca951',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'xpo-india-ca951.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '455016728084',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:455016728084:web:f81f147faf9dad4085c901',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const storage = getStorage(app);
export default app;
