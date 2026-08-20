import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDn3miN-Urzh6pk5Wmyqxry7RmysdCHTaE",
  authDomain: "seekr-37311.firebaseapp.com",
  projectId: "seekr-37311",
  storageBucket: "seekr-37311.firebasestorage.app",
  messagingSenderId: "524936950392",
  appId: "1:524936950392:web:9d31d164b838e4178ef38d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'applications'), where('position', '==', 'Test Ghosted Ticket 1'));
  const snapshot = await getDocs(q);
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    console.log('Deleted', doc.id);
  }
  process.exit(0);
}
run();
