const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const targetInit = `export const db = initializeFirestore(app, { experimentalForceLongPolling: true });`;
const newInit = `export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId);`;

code = code.replace(targetInit, newInit);
fs.writeFileSync('src/lib/firebase.ts', code);
console.log("Patched firebase.ts for databaseId");
