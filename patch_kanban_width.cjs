const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

code = code.replace(/className="flex-shrink-0 w-\[320px\] flex flex-col/g, 'className="flex-shrink-0 w-[280px] lg:w-[calc(20%-1rem)] lg:min-w-[220px] flex flex-col');

fs.writeFileSync('src/components/Kanban.tsx', code);
