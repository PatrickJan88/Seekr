const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /return \{ continent: 'Remote \/ Global', country: 'Remote \/ Global', city: '' \};/g,
  "return { continent: 'Remote', country: 'Remote', city: '' };"
);
code = code.replace(
  /return \{ continent: 'Remote \/ Global', country: 'Remote \/ Global', city: 'Worldwide' \};/g,
  "return { continent: 'Remote', country: 'Remote', city: 'Worldwide' };"
);

fs.writeFileSync('server.ts', code);
console.log('patched remote');
