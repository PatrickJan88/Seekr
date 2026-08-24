const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

code = code.replaceAll('h-full flex-1 min-h-[400px] flex-1', 'h-full flex-1 min-h-[400px]');
code = code.replaceAll('flex-1 w-full min-w-0 self-stretch flex flex-col flex-1', 'flex-1 w-full min-w-0 self-stretch flex flex-col');

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
