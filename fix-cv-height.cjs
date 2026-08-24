const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

// Replace all hardcoded 520px heights with flex-1 or just removing the hard height
code = code.replaceAll('min-h-[520px] md:h-[520px]', 'flex-1 min-h-[400px]');
code = code.replaceAll('h-full md:h-[520px]', 'h-full flex-1 min-h-[400px]');
code = code.replaceAll('min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar space-y-6', 'min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar');

fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
