const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

// The Notes td
content = content.replace(
  '<td className="px-6 py-4 min-w-[200px]">',
  '<td className="px-6 py-4 w-full max-w-0 min-w-[200px]">'
);

// TruncatedNotes max-w-[250px] w-full
content = content.replace(
  'className="text-slate-600 cursor-pointer hover:text-slate-900 group relative inline-flex items-center max-w-[250px] w-full"',
  'className="text-slate-600 cursor-pointer hover:text-slate-900 group relative inline-flex items-center w-full"'
);

fs.writeFileSync('src/components/ListView.tsx', content);
