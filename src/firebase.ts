import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { isAdminEmail } from './config/admins';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseEnabled = Boolean(cfg.apiKey && cfg.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseEnabled) {
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

// src/firebase.ts

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase não configurado');
  const provider = new GoogleAuthProvider();
  
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const result = await signInWithPopup(auth, provider);

  if (!isAdminEmail(result.user.email)) {
    const emailRecusado = result.user.email;
    await signOut(auth);
    throw new Error(`ACESSO_NEGADO:${emailRecusado}`);
  }

  return result.user;
}

export async function signOutGoogle(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void) {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}