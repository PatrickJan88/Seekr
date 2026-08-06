const fs = require('fs');
let listview = fs.readFileSync('src/components/ListView.tsx', 'utf8');

const ghostIconClass = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500";

listview = listview.replace(
  'className="text-slate-400 hover:text-slate-600"',
  'className="' + ghostIconClass + '"'
);

// We replace ✕ with an X icon from lucide-react if we can, but it works as is.

fs.writeFileSync('src/components/ListView.tsx', listview);
