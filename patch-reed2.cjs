const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const reedKey = process\.env\.REED_API_KEY \|\| "";\s*if \(\!reedKey\) return;/,
  'const reedKey = process.env.REED_API_KEY || "b391d941-0228-4cec-a21a-e6578ff43abe";'
);

fs.writeFileSync('server.ts', code);
console.log('patched reed api key');
