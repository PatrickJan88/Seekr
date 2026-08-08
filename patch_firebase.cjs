const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const newConfig = `const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
};`;

content = content.replace(/const firebaseConfig = \{[\s\S]*?\};/, newConfig);
content = content.replace("export const db = getFirestore(app);", `export const db = getFirestore(app, "${config.firestoreDatabaseId}");`);

fs.writeFileSync('src/lib/firebase.ts', content);
