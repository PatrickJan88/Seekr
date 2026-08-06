const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

content = content.replace(
  'className="overflow-auto flex-grow scrollbar-thin"',
  'className="overflow-auto flex-grow scrollbar-thin outline-none focus:outline-none"'
);

content = content.replace(
  'className="w-full text-left border-collapse"',
  'className="w-full text-left border-collapse outline-none focus:outline-none"'
);

fs.writeFileSync('src/components/ListView.tsx', content);
