const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

content = content.replace(
  'googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");',
  `googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
googleProvider.setCustomParameters({ prompt: 'consent' });`
);

fs.writeFileSync('src/lib/firebase.ts', content);
