const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replaceAll(
  'className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"',
  'className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors select-none focus:outline-none"'
);

fs.writeFileSync('src/components/ListView.tsx', content);
