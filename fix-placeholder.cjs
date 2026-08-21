const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');
code = code.replace('placeholder="Search role or company in market"', 'placeholder="Search roles or companies in market"');
fs.writeFileSync('src/components/GlobalMarket.tsx', code);
console.log('Fixed');
