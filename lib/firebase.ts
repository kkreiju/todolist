import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function assertFirebaseConfig() {
  const names: Record<keyof typeof config, string> = {
    apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY', authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  };
  const missing = Object.entries(config).find(([, value]) => !value)?.[0] as keyof typeof config | undefined;
  if (missing) throw new Error(`Missing ${names[missing]}. Add it to your .env.local file.`);
}

// Defer config validation to the first client operation so static prerendering works without local credentials.
export const firebaseApp = getApps().length ? getApp() : initializeApp(config, 'daymark');

export const db = getFirestore(firebaseApp);
