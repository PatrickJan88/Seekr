const fs = require('fs');

let code = fs.readFileSync('src/components/Analytics.tsx', 'utf-8');
code = code.replace(/#f59e0b/g, '#3b82f6');
fs.writeFileSync('src/components/Analytics.tsx', code);
