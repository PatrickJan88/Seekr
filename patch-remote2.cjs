const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /return \{ continent: 'Remote \/ Global', country: 'Remote \/ Global', city: single \};/g,
  "return { continent: 'Remote', country: 'Remote', city: single };"
);

fs.writeFileSync('server.ts', code);
console.log('patched remote 2');
