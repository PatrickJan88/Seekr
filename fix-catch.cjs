const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/catch \(e, \{ signal: AbortSignal\.timeout\(8000\) \}\)/g, 'catch (e)');

fs.writeFileSync('server.ts', code);
console.log('fixed catch');
