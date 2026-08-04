const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const targetImport = `import { getFirestore } from 'firebase/firestore';`;
const newImport = `import { getFirestore, initializeFirestore } from 'firebase/firestore';`;

code = code.replace(targetImport, newImport);

const targetInit = `export const db = getFirestore(app);`;
const newInit = `export const db = initializeFirestore(app, { experimentalForceLongPolling: true });`;

code = code.replace(targetInit, newInit);

fs.writeFileSync('src/lib/firebase.ts', code);
console.log("Patched firebase.ts for long polling");
