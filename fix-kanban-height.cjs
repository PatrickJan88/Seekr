const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

code = code.replace(
  'className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-270px)] snap-x"',
  'className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 snap-x"'
);
fs.writeFileSync('src/components/Kanban.tsx', code);
