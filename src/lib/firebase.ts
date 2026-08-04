import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
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
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export const googleSignIn = () => signInWithPopup(auth, googleProvider);
export const anonymousSignIn = () => signInAnonymously(auth);
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

export const getAccessToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
};
