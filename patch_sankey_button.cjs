const fs = require('fs');
let content = fs.readFileSync('src/components/SankeyChart.tsx', 'utf8');

const iconBtnClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0";

content = content.replace(
  'className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"',
  'className="' + iconBtnClass + ' text-slate-500"'
);

fs.writeFileSync('src/components/SankeyChart.tsx', content);
