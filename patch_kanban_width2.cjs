const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

code = code.replace(/lg:w-\[calc\(20%-1rem\)\] lg:min-w-\[220px\]/g, 'lg:w-[calc(20%-13px)] lg:min-w-[200px]');

fs.writeFileSync('src/components/Kanban.tsx', code);
