const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(cLower\.includes\('remote'\) \|\| cLower\.includes\('global'\)\) return 'Remote \/ Global';/g,
  "if (cLower.includes('remote') || cLower.includes('global')) return 'Remote';"
);

fs.writeFileSync('server.ts', code);
console.log('patched getContinent');
