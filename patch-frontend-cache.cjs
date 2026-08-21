const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

code = code.replace(
  /fetch\('\/api\/market-jobs'\)/,
  "fetch('/api/market-jobs?t=' + Date.now())"
);

fs.writeFileSync('src/components/GlobalMarket.tsx', code);
console.log('patched frontend cache buster');
