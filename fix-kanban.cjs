const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

code = code.replace(
  '<div className="flex flex-col gap-4 h-full">',
  '<div className="flex-1 flex flex-col gap-4 min-h-0">'
);
fs.writeFileSync('src/components/Kanban.tsx', code);
