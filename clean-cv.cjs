const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replaceAll('flex-1 min-h-[400px]', 'min-h-[400px]');
code = code.replaceAll('h-full min-h-[400px]', 'h-full flex-1 min-h-0');

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
