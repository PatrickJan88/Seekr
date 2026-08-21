const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/body: JSON\.stringify\(\{ keywords: query, location: 'Europe' , signal: AbortSignal\.timeout\(8000\) \}\)/g, "body: JSON.stringify({ keywords: query, location: 'Europe' })");
code = code.replace(/, signal: AbortSignal\.timeout\(8000\) \}\);/g, "});");
code = code.replace(/if \(Array\.isArray\(ids\), \{ signal: AbortSignal\.timeout\(8000\) \}\) \{/g, "if (Array.isArray(ids)) {");
code = code.replace(/map\(\(item: any, \{ signal: AbortSignal\.timeout\(8000\) \}\) => \(\{/g, "map((item: any) => ({");

fs.writeFileSync('server.ts', code);
console.log('fixed all weird syntax');
