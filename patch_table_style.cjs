const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

// Table
content = content.replace(
  'className="w-full text-left border-collapse outline-none focus:outline-none"',
  'className="w-full text-left border-separate border-spacing-0 outline-none focus:outline-none"'
);

// Thead
content = content.replace(
  'className="bg-slate-50 sticky top-0 z-10 after:content-[\'\'] after:absolute after:left-0 after:right-0 after:bottom-0 after:border-b after:border-slate-200"',
  'className="bg-slate-50 sticky top-0 z-10"'
);

// Th - we need to add border-b border-slate-200 to all th
content = content.replace(/<th\s+className="/g, '<th className="border-b border-slate-200 ');

// Tbody
content = content.replace(
  '<tbody className="divide-y divide-slate-100">',
  '<tbody>'
);

// Td - we need to add border-b border-slate-100 to all td
content = content.replace(/<td className="/g, '<td className="border-b border-slate-100 ');

fs.writeFileSync('src/components/ListView.tsx', content);
