const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

// Update column styling
content = content.replace(
  /border-2 rounded-2xl p-5/g,
  'border rounded-xl p-4'
);

// Update Kanban layout toggle active state
content = content.replace(
  /\$\{layoutMode === 'kanban' \? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'\}/g,
  "${layoutMode === 'kanban' ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}"
);

content = content.replace(
  /\$\{layoutMode === 'list' \? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'\}/g,
  "${layoutMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}"
);

fs.writeFileSync('src/components/Kanban.tsx', content);
