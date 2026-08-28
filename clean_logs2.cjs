const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/console\.log\([^)]+geminiErr[^)]+\);/g, '/* expected */');
code = code.replace(/console\.log\([^)]+openAiErr[^)]+\);/g, '/* expected */');
code = code.replace(/console\.log\([^)]+fetchErr[^)]+\);/g, '/* expected */');

fs.writeFileSync('server.ts', code);
