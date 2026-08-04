const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(/return \{ \.\.\.app, status: st \};/g, 'return { ...app, status: st as any };');

fs.writeFileSync('src/components/Dashboard.tsx', code);
