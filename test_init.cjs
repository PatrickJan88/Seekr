const { initializeApp } = require('firebase/app');
const { getFirestore, initializeFirestore } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
try {
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, config.firestoreDatabaseId);
  console.log("Success with 3 params");
} catch (e) {
  console.error(e.message);
}
