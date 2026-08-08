import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAAdTHdsZwQv6qm91_ArnUpzafzZ52hA2g",
  authDomain: "hazel-streamer-l1ttq.firebaseapp.com",
  projectId: "hazel-streamer-l1ttq",
  storageBucket: "hazel-streamer-l1ttq.firebasestorage.app",
  messagingSenderId: "773789142381",
  appId: "1:773789142381:web:a2d4e8a385863041d89e64"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-careerdashboard-466a1dfe-d8a5-404b-9007-ad83a46a7434");

export const googleProvider = new GoogleAuthProvider();


export const googleSignIn = async () => {
  return signInWithPopup(auth, googleProvider);
};
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


