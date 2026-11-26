import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
  Persistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDn3miN-Urzh6pk5Wmyqxry7RmysdCHTaE",
  authDomain: "seekr-37311.firebaseapp.com",
  projectId: "seekr-37311",
  storageBucket: "seekr-37311.firebasestorage.app",
  messagingSenderId: "524936950392",
  appId: "1:524936950392:web:9d31d164b838e4178ef38d",
  measurementId: "G-2WKHY5F4B3"
};

const app = initializeApp(firebaseConfig);
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    // Analytics is optional and may not be supported in preview iframe
  }
}

function isStorageWritable(storageType: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storage = window[storageType];
    const testKey = '__seekr_auth_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getSafeAuthPersistence(): Persistence[] {
  // Avoid IndexedDBLocalPersistence because Safari/iPadOS/iframes can trigger
  // "Error: Database is closing/hidden" during OAuth popup visibility changes.
  const chain: Persistence[] = [];
  if (isStorageWritable('localStorage')) {
    chain.push(browserLocalPersistence);
  }
  if (isStorageWritable('sessionStorage')) {
    chain.push(browserSessionPersistence);
  }
  chain.push(inMemoryPersistence);
  return chain;
}

function createAuthInstance(): Auth {
  const persistenceChain = getSafeAuthPersistence();
  try {
    return initializeAuth(app, {
      persistence: persistenceChain,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (err: any) {
    // If Auth was already initialized (e.g., during HMR), reuse existing instance
    // and ensure it uses a non-IndexedDB persistence backend.
    const existingAuth = getAuth(app);
    setPersistence(existingAuth, persistenceChain[0] || inMemoryPersistence).catch(() => {
      setPersistence(existingAuth, inMemoryPersistence).catch(() => {});
    });
    return existingAuth;
  }
}

export { analytics };
export const auth = createAuthInstance();
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

function isPersistenceError(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('database is closing') ||
    msg.includes('hidden') ||
    msg.includes('indexeddb') ||
    msg.includes('securityerror') ||
    msg.includes('quotaexceeded')
  );
}

export const googleSignIn = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (isPersistenceError(err)) {
      await setPersistence(auth, inMemoryPersistence);
      return await signInWithPopup(auth, googleProvider);
    }
    throw err;
  }
};

export const anonymousSignIn = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (err: any) {
    if (isPersistenceError(err)) {
      await setPersistence(auth, inMemoryPersistence);
      return await signInAnonymously(auth);
    }
    throw err;
  }
};

export const logout = () => signOut(auth);

export const initAuth = (onLogin: (user: User) => void, onLogout: () => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onLogin(user);
    } else {
      onLogout();
    }
  });
};

export type { User };
