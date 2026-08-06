const fs = require('fs');
let content = fs.readFileSync('src/components/Kanban.tsx', 'utf8');

content = content.replace(
  /\$\{activeTab === 'active' \? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'\}/g,
  "${activeTab === 'active' ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}"
);

content = content.replace(
  /\$\{activeTab === 'inactive' \? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'\}/g,
  "${activeTab === 'inactive' ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}"
);

// Time filter also uses bg-blue-100 text-blue-700
content = content.replace(
  /\$\{timeFilter === tf \? 'bg-blue-100 text-blue-700' : 'bg-transparent text-slate-600 hover:bg-slate-100'\}/g,
  "${timeFilter === tf ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}"
);

fs.writeFileSync('src/components/Kanban.tsx', content);
