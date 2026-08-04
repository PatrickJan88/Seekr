const { initializeApp } = require('firebase/app');
const { getFirestore, initializeFirestore, collection, doc, setDoc, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, config.firestoreDatabaseId);

async function test() {
  try {
    const q = await getDocs(collection(db, "applications"));
    console.log("Success with query. Found items:", q.docs.length);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
